import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ChargeStatus,
  LeaseStatus,
  PaymentMethodType,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { PrismaService } from "../prisma/prisma.service";
import { BillingSummaryQueryDto } from "./dto/billing-summary-query.dto";
import { CashfreeService, type CashfreeOrderPayment } from "./cashfree.service";
import { CreateOnlinePaymentSessionDto } from "./dto/create-online-payment-session.dto";
import { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import { GenerateMonthlyChargesDto } from "./dto/generate-monthly-charges.dto";
import { ListChargesDto } from "./dto/list-charges.dto";
import { ListPaymentsDto } from "./dto/list-payments.dto";
import {
  PaymentReviewAction,
  ReviewPaymentDto,
} from "./dto/review-payment.dto";
import { SubmitCashPaymentDto } from "./dto/submit-cash-payment.dto";

const zeroMoney = new Prisma.Decimal(0);

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashfreeService: CashfreeService,
  ) {}

  async listCharges(user: RequestUser, query: ListChargesDto) {
    await this.syncOverdueCharges();

    const where = this.buildChargeWhere(user, query);
    return this.prisma.rentCharge.findMany({
      where,
      orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
      include: chargeInclude,
    });
  }

  async getChargeById(user: RequestUser, chargeId: string) {
    await this.syncOverdueCharges();

    const charge = await this.prisma.rentCharge.findUnique({
      where: { id: chargeId },
      include: chargeInclude,
    });
    if (!charge) {
      throw new NotFoundException("Charge not found");
    }

    this.assertCanAccessCharge(
      user,
      charge.lease.landlordId,
      charge.lease.tenantId,
    );
    return charge;
  }

  async createOnlineSession(
    user: RequestUser,
    chargeId: string,
    payload: CreateOnlinePaymentSessionDto,
  ) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException(
        "Only tenants can create online rent payments",
      );
    }
    if (!this.cashfreeService.isConfigured()) {
      throw new BadRequestException(
        "Cashfree is not configured on this server",
      );
    }

    await this.syncOverdueCharges();

    const charge = await this.prisma.rentCharge.findUnique({
      where: { id: chargeId },
      include: {
        lease: true,
      },
    });
    if (!charge) {
      throw new NotFoundException("Charge not found");
    }
    if (charge.lease.tenantId !== user.id) {
      throw new ForbiddenException("You cannot pay this charge");
    }
    if (
      charge.status === ChargeStatus.PAID ||
      charge.status === ChargeStatus.VOID
    ) {
      throw new BadRequestException("This charge is not payable");
    }

    const outstanding = asDecimal(charge.balanceAmount);
    if (outstanding.lte(zeroMoney)) {
      throw new BadRequestException("This charge has no outstanding balance");
    }

    const amount = payload.amount ? asDecimal(payload.amount) : outstanding;
    if (amount.lte(zeroMoney)) {
      throw new BadRequestException("Payment amount must be positive");
    }
    if (amount.gt(outstanding)) {
      throw new BadRequestException(
        "Payment amount exceeds outstanding balance",
      );
    }
    if (!charge.lease.partialPaymentsAllowed && !amount.eq(outstanding)) {
      throw new BadRequestException(
        "Partial online payments are disabled for this lease",
      );
    }

    const tenant = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });
    if (!tenant?.email) {
      throw new BadRequestException(
        "Tenant email is required before initiating online payments",
      );
    }

    const customerPhone = normalizeIndianPhone(tenant.phone);
    if (!customerPhone) {
      throw new BadRequestException(
        "A valid 10-digit Indian phone number is required for online checkout",
      );
    }

    const orderId = `rent_${charge.id}_${Date.now()}`;
    const returnUrl = buildCashfreeReturnUrl({
      base: this.cashfreeService.getReturnUrlBase(),
      orderId,
      chargeId: charge.id,
      paymentProvider: "cashfree",
    });
    const notifyUrl = this.cashfreeService.getNotifyUrl();

    const created = await this.prisma.$transaction(async (tx) => {
      const onlineMethodId = await this.resolveOrCreateOnlineMethod(
        tx,
        user.id,
      );
      const payment = await tx.payment.create({
        data: {
          chargeId: charge.id,
          payerId: user.id,
          methodId: onlineMethodId,
          amount,
          currency: "INR",
          status: PaymentStatus.PENDING,
          provider: "cashfree",
          reference: orderId,
        },
      });

      const order = await this.cashfreeService.createOrder({
        orderId,
        orderAmount: Number(amount.toFixed(2)),
        customerId: user.id,
        customerEmail: tenant.email,
        customerPhone,
        returnUrl,
        notifyUrl,
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          externalEventId: `cashfree-order:${order.order_id}:created`,
          eventType: "ONLINE_PAYMENT_CREATED",
          payload: {
            provider: "cashfree",
            orderId: order.order_id,
            cfOrderId: order.cf_order_id,
            orderStatus: order.order_status,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "PAYMENT",
          entityId: payment.id,
          action: "ONLINE_PAYMENT_CREATED",
          metadata: {
            provider: "cashfree",
            orderId: order.order_id,
            amount: amount.toString(),
          },
        },
      });

      return {
        paymentId: payment.id,
        chargeId: charge.id,
        amount: amount.toFixed(2),
        currency: "INR",
        provider: "cashfree",
        orderId: order.order_id,
        cfOrderId: order.cf_order_id,
        orderStatus: order.order_status,
        paymentSessionId: order.payment_session_id,
        checkoutMode: this.cashfreeService.getCheckoutMode(),
      };
    });

    return created;
  }

  async generateMonthlyCharges(
    user: RequestUser,
    payload: GenerateMonthlyChargesDto,
  ) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Only landlords can generate monthly charges",
      );
    }

    const period = this.resolveBillingPeriod(payload.month);
    const leaseWhere: Prisma.LeaseWhereInput = {
      status: {
        in: [LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
      },
      startDate: {
        lte: period.periodEnd,
      },
      endDate: {
        gte: period.periodStart,
      },
    };

    if (payload.leaseId) {
      leaseWhere.id = payload.leaseId;
    }
    if (payload.propertyId) {
      leaseWhere.propertyId = payload.propertyId;
    }
    if (user.role === UserRole.LANDLORD) {
      leaseWhere.landlordId = user.id;
    }

    const leases = await this.prisma.lease.findMany({
      where: leaseWhere,
      include: {
        unit: {
          select: {
            maintenanceFee: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const createdChargeIds: string[] = [];
    const existingLeaseIds: string[] = [];

    for (const lease of leases) {
      const dueDate = dueDateForMonth(period.year, period.month, lease.dueDay);
      const baseRentAmount = asDecimal(lease.monthlyRent);
      const maintenanceAmount = asDecimal(lease.unit.maintenanceFee);
      const utilityAmount = zeroMoney;
      const lateFeeAmount = zeroMoney;
      const totalAmount = baseRentAmount
        .plus(maintenanceAmount)
        .plus(utilityAmount)
        .plus(lateFeeAmount);

      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const charge = await tx.rentCharge.create({
            data: {
              leaseId: lease.id,
              createdById: user.id,
              periodStart: period.periodStart,
              periodEnd: period.periodEnd,
              dueDate,
              baseRentAmount,
              maintenanceAmount,
              utilityAmount,
              lateFeeAmount,
              totalAmount,
              balanceAmount: totalAmount,
              status: ChargeStatus.ISSUED,
            },
          });

          await tx.auditLog.create({
            data: {
              actorId: user.id,
              entityType: "RENT_CHARGE",
              entityId: charge.id,
              action: "CHARGE_GENERATED_MONTHLY",
              metadata: {
                month: period.monthString,
                leaseId: lease.id,
                dueDay: lease.dueDay,
              },
            },
          });

          return charge;
        });

        createdChargeIds.push(created.id);
      } catch (error) {
        if (isPrismaUniqueViolation(error)) {
          existingLeaseIds.push(lease.id);
          continue;
        }
        throw error;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "BILLING_RUN",
        entityId: `monthly:${period.monthString}`,
        action: "MONTHLY_CHARGE_GENERATION_COMPLETED",
        metadata: {
          month: period.monthString,
          eligibleLeaseCount: leases.length,
          createdCount: createdChargeIds.length,
          existingCount: existingLeaseIds.length,
        },
      },
    });

    const generatedCharges = await this.prisma.rentCharge.findMany({
      where: {
        leaseId: { in: leases.map((lease) => lease.id) },
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
      },
      include: chargeInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    return {
      month: period.monthString,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      eligibleLeaseCount: leases.length,
      createdCount: createdChargeIds.length,
      existingCount: existingLeaseIds.length,
      charges: generatedCharges,
    };
  }

  async submitCashPayment(
    user: RequestUser,
    chargeId: string,
    payload: SubmitCashPaymentDto,
  ) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException("Only tenants can submit cash payments");
    }

    await this.syncOverdueCharges();

    const charge = await this.prisma.rentCharge.findUnique({
      where: { id: chargeId },
      include: {
        lease: true,
      },
    });

    if (!charge) {
      throw new NotFoundException("Charge not found");
    }

    if (charge.lease.tenantId !== user.id) {
      throw new ForbiddenException(
        "You cannot submit payments for this charge",
      );
    }

    if (!charge.lease.cashPaymentsAllowed) {
      throw new ForbiddenException("Cash payments are disabled for this lease");
    }

    if (
      charge.status === ChargeStatus.PAID ||
      charge.status === ChargeStatus.VOID
    ) {
      throw new ForbiddenException("This charge is not payable");
    }

    const amount = asDecimal(payload.amount);
    const outstandingBalance = asDecimal(charge.balanceAmount);

    if (outstandingBalance.lte(zeroMoney)) {
      throw new ForbiddenException("This charge has no outstanding balance");
    }
    if (amount.gt(outstandingBalance)) {
      throw new BadRequestException(
        "Payment amount exceeds outstanding balance",
      );
    }
    if (
      !charge.lease.partialPaymentsAllowed &&
      !amount.eq(outstandingBalance)
    ) {
      throw new ForbiddenException(
        "Partial cash payments are disabled for this lease",
      );
    }

    const cashMethodId = await this.resolveOrCreateCashMethod(user.id);
    const submittedAt = new Date();
    const isAutoApproved = !charge.lease.cashApprovalRequired;

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          chargeId: charge.id,
          payerId: user.id,
          methodId: cashMethodId,
          amount,
          currency: "USD",
          status: isAutoApproved
            ? PaymentStatus.SUCCEEDED
            : PaymentStatus.REQUIRES_REVIEW,
          provider: "cash",
          reference: payload.reference?.trim(),
          paidAt: isAutoApproved
            ? payload.paidAt
              ? new Date(payload.paidAt)
              : submittedAt
            : null,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: createdPayment.id,
          eventType: isAutoApproved ? "CASH_AUTO_APPROVED" : "CASH_SUBMITTED",
          payload: {
            actorId: user.id,
            chargeId: charge.id,
            amount: amount.toString(),
            submittedAt: submittedAt.toISOString(),
            note: payload.note?.trim(),
          },
        },
      });

      if (isAutoApproved) {
        await this.applyApprovedPaymentToCharge(tx, charge.id, amount);
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "PAYMENT",
          entityId: createdPayment.id,
          action: isAutoApproved
            ? "CASH_PAYMENT_AUTO_APPROVED"
            : "CASH_PAYMENT_SUBMITTED",
          metadata: {
            chargeId: charge.id,
            amount: amount.toString(),
            status: createdPayment.status,
          },
        },
      });

      return tx.payment.findUnique({
        where: { id: createdPayment.id },
        include: paymentInclude,
      });
    });

    if (!payment) {
      throw new NotFoundException(
        "Payment record was not found after creation",
      );
    }

    return payment;
  }

  async listPayments(user: RequestUser, query: ListPaymentsDto) {
    await this.syncOverdueCharges();

    const where = this.buildPaymentWhere(user, query);
    return this.prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async listPendingCashReviews(user: RequestUser) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Only landlords can review pending cash payments",
      );
    }

    const where: Prisma.PaymentWhereInput = {
      provider: "cash",
      status: PaymentStatus.REQUIRES_REVIEW,
      charge: {
        isNot: null,
      },
    };

    if (user.role === UserRole.LANDLORD) {
      where.charge = {
        is: {
          lease: {
            is: {
              landlordId: user.id,
            },
          },
        },
      };
    }

    return this.prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async reviewPayment(
    user: RequestUser,
    paymentId: string,
    payload: ReviewPaymentDto,
  ) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only landlords can review payments");
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        charge: {
          include: {
            lease: true,
          },
        },
      },
    });

    if (!payment || !payment.charge || !payment.charge.lease) {
      throw new NotFoundException("Payment review target not found");
    }

    if (
      user.role === UserRole.LANDLORD &&
      payment.charge.lease.landlordId !== user.id
    ) {
      throw new ForbiddenException("You cannot review payments for this lease");
    }

    if (payment.status !== PaymentStatus.REQUIRES_REVIEW) {
      throw new BadRequestException("Payment is not pending review");
    }

    const reviewNote = payload.note?.trim();
    const reviewedAt = new Date();

    const reviewed = await this.prisma.$transaction(async (tx) => {
      if (payload.action === PaymentReviewAction.APPROVE) {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            paidAt: payload.paidAt ? new Date(payload.paidAt) : reviewedAt,
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: updatedPayment.id,
            eventType: "PAYMENT_APPROVED",
            payload: {
              actorId: user.id,
              reviewedAt: reviewedAt.toISOString(),
              note: reviewNote,
            },
          },
        });

        await this.applyApprovedPaymentToCharge(
          tx,
          payment.charge.id,
          asDecimal(updatedPayment.amount),
        );

        await tx.auditLog.create({
          data: {
            actorId: user.id,
            entityType: "PAYMENT",
            entityId: updatedPayment.id,
            action: "CASH_PAYMENT_APPROVED",
            metadata: {
              chargeId: payment.charge.id,
              amount: updatedPayment.amount.toString(),
              note: reviewNote,
            },
          },
        });

        return tx.payment.findUnique({
          where: { id: updatedPayment.id },
          include: paymentInclude,
        });
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: updatedPayment.id,
          eventType: "PAYMENT_REJECTED",
          payload: {
            actorId: user.id,
            reviewedAt: reviewedAt.toISOString(),
            note: reviewNote,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "PAYMENT",
          entityId: updatedPayment.id,
          action: "CASH_PAYMENT_REJECTED",
          metadata: {
            chargeId: payment.charge.id,
            amount: updatedPayment.amount.toString(),
            note: reviewNote,
          },
        },
      });

      return tx.payment.findUnique({
        where: { id: updatedPayment.id },
        include: paymentInclude,
      });
    });

    if (!reviewed) {
      throw new NotFoundException("Reviewed payment was not found");
    }

    return reviewed;
  }

  async reconcilePayment(user: RequestUser, paymentId: string) {
    if (!this.cashfreeService.isConfigured()) {
      throw new BadRequestException(
        "Cashfree is not configured on this server",
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        charge: {
          include: {
            lease: true,
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    if (payment.provider !== "cashfree" || !payment.reference) {
      throw new BadRequestException(
        "Only Cashfree-backed payments can be reconciled",
      );
    }

    this.assertCanAccessPayment(user, payment);

    const [order, attempts] = await Promise.all([
      this.cashfreeService.fetchOrder(payment.reference),
      this.cashfreeService.fetchOrderPayments(payment.reference),
    ]);

    const selectedAttempt = selectCashfreeAttempt(attempts);
    const eventStatus = selectedAttempt?.payment_status ?? order.order_status;
    const eventPaymentId = selectedAttempt?.cf_payment_id;
    const eventPaymentTime = selectedAttempt?.payment_time;

    return this.applyCashfreeEvent({
      paymentId: payment.id,
      orderId: payment.reference,
      paymentStatus: eventStatus,
      cfPaymentId: eventPaymentId,
      paymentTime: eventPaymentTime,
      source: "RECONCILE",
      payload: {
        order,
        payments: attempts,
      },
      actorId: user.id,
    });
  }

  async handleCashfreeWebhook(input: {
    rawBody: Buffer;
    signatureHeader?: string;
    timestampHeader?: string;
  }) {
    const verified = this.cashfreeService.verifyWebhookSignature({
      rawBody: input.rawBody,
      signatureHeader: input.signatureHeader,
      timestampHeader: input.timestampHeader,
    });

    if (!verified) {
      throw new UnauthorizedException("Invalid Cashfree webhook signature");
    }

    const payload = parseJsonObject(input.rawBody.toString("utf8"));
    if (!payload) {
      throw new BadRequestException("Webhook payload is not valid JSON");
    }

    const orderId = getString(payload, ["data", "order", "order_id"]);
    if (!orderId) {
      return {
        received: true,
        processed: false,
        reason: "missing_order_id",
      };
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: "cashfree",
        reference: orderId,
      },
      select: { id: true },
    });
    if (!payment) {
      return {
        received: true,
        processed: false,
        reason: "order_not_mapped",
        orderId,
      };
    }

    const paymentStatus =
      getString(payload, ["data", "payment", "payment_status"]) ??
      getString(payload, ["data", "order", "order_status"]);
    const cfPaymentId = getString(payload, [
      "data",
      "payment",
      "cf_payment_id",
    ]);
    const paymentTime = getString(payload, ["data", "payment", "payment_time"]);

    const updated = await this.applyCashfreeEvent({
      paymentId: payment.id,
      orderId,
      paymentStatus,
      cfPaymentId,
      paymentTime,
      source: "WEBHOOK",
      payload,
    });

    return {
      received: true,
      processed: true,
      paymentId: updated.id,
      status: updated.status,
      orderId,
    };
  }

  async listPaymentMethods(user: RequestUser) {
    return this.prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createPaymentMethod(
    user: RequestUser,
    payload: CreatePaymentMethodDto,
  ) {
    if (
      payload.type !== PaymentMethodType.CASH &&
      !payload.providerRef?.trim()
    ) {
      throw new BadRequestException(
        "providerRef is required for non-cash payment methods",
      );
    }

    const existingCount = await this.prisma.paymentMethod.count({
      where: { userId: user.id },
    });
    const isDefault = payload.isDefault ?? existingCount === 0;

    const created = await this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.paymentMethod.create({
        data: {
          userId: user.id,
          type: payload.type,
          provider: payload.provider?.trim(),
          providerRef: payload.providerRef?.trim(),
          last4: payload.last4,
          brand: payload.brand?.trim(),
          isDefault,
        },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "PAYMENT_METHOD",
        entityId: created.id,
        action: "PAYMENT_METHOD_CREATED",
        metadata: {
          type: created.type,
          provider: created.provider,
          isDefault: created.isDefault,
        },
      },
    });

    return created;
  }

  async setDefaultPaymentMethod(user: RequestUser, methodId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: methodId },
    });

    if (!method || method.userId !== user.id) {
      throw new NotFoundException("Payment method not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      return tx.paymentMethod.update({
        where: { id: method.id },
        data: { isDefault: true },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "PAYMENT_METHOD",
        entityId: updated.id,
        action: "PAYMENT_METHOD_SET_DEFAULT",
        metadata: {
          type: updated.type,
          provider: updated.provider,
        },
      },
    });

    return updated;
  }

  async getBillingSummary(user: RequestUser, query: BillingSummaryQueryDto) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only landlords can view billing reports");
    }

    await this.syncOverdueCharges();
    const range = resolveSummaryDateRange(query.from, query.to);

    const chargeWhere = this.buildSummaryChargeWhere(
      user,
      query.propertyId,
      range,
    );
    const charges = await this.prisma.rentCharge.findMany({
      where: chargeWhere,
      select: {
        id: true,
        dueDate: true,
        totalAmount: true,
        balanceAmount: true,
        status: true,
      },
      orderBy: { dueDate: "asc" },
    });

    let totalBilled = zeroMoney;
    let totalCollected = zeroMoney;
    let totalOutstanding = zeroMoney;
    let totalOverdue = zeroMoney;
    let overdueCount = 0;
    let openCount = 0;

    const monthBuckets = new Map<
      string,
      { billed: Prisma.Decimal; collected: Prisma.Decimal }
    >();

    for (const charge of charges) {
      const total = asDecimal(charge.totalAmount);
      const balance = asDecimal(charge.balanceAmount);
      const collected = total.minus(balance);

      totalBilled = totalBilled.plus(total);
      totalCollected = totalCollected.plus(collected);
      if (balance.gt(zeroMoney)) {
        totalOutstanding = totalOutstanding.plus(balance);
        openCount += 1;
      }
      if (charge.status === ChargeStatus.OVERDUE && balance.gt(zeroMoney)) {
        totalOverdue = totalOverdue.plus(balance);
        overdueCount += 1;
      }

      const monthKey = monthKeyFromDate(charge.dueDate);
      const existing = monthBuckets.get(monthKey) ?? {
        billed: zeroMoney,
        collected: zeroMoney,
      };
      monthBuckets.set(monthKey, {
        billed: existing.billed.plus(total),
        collected: existing.collected.plus(collected),
      });
    }

    const pendingReviewWhere: Prisma.PaymentWhereInput = {
      provider: "cash",
      status: PaymentStatus.REQUIRES_REVIEW,
      charge: {
        is: {
          dueDate: {
            gte: range.from,
            lte: range.to,
          },
        },
      },
    };
    if (user.role === UserRole.LANDLORD) {
      pendingReviewWhere.charge = {
        is: {
          dueDate: {
            gte: range.from,
            lte: range.to,
          },
          lease: {
            is: {
              landlordId: user.id,
              ...(query.propertyId ? { propertyId: query.propertyId } : {}),
            },
          },
        },
      };
    } else if (query.propertyId) {
      pendingReviewWhere.charge = {
        is: {
          dueDate: {
            gte: range.from,
            lte: range.to,
          },
          lease: {
            is: {
              propertyId: query.propertyId,
            },
          },
        },
      };
    }

    const pendingReviewPayments = await this.prisma.payment.findMany({
      where: pendingReviewWhere,
      select: {
        amount: true,
      },
    });

    const pendingReviewAmount = pendingReviewPayments.reduce(
      (acc, payment) => acc.plus(asDecimal(payment.amount)),
      zeroMoney,
    );

    return {
      range: {
        from: range.from,
        to: range.to,
      },
      totals: {
        billed: moneyToString(totalBilled),
        collected: moneyToString(totalCollected),
        outstanding: moneyToString(totalOutstanding),
        overdue: moneyToString(totalOverdue),
        pendingReview: moneyToString(pendingReviewAmount),
      },
      counts: {
        openCharges: openCount,
        overdueCharges: overdueCount,
        pendingCashApprovals: pendingReviewPayments.length,
      },
      monthly: [...monthBuckets.entries()].map(([month, values]) => ({
        month,
        billed: moneyToString(values.billed),
        collected: moneyToString(values.collected),
      })),
    };
  }

  private buildChargeWhere(user: RequestUser, query: ListChargesDto) {
    const where: Prisma.RentChargeWhereInput = {};
    const leaseWhere: Prisma.LeaseWhereInput = {};

    if (user.role === UserRole.LANDLORD) {
      leaseWhere.landlordId = user.id;
    } else if (user.role === UserRole.TENANT) {
      leaseWhere.tenantId = user.id;
    }

    if (query.propertyId) {
      leaseWhere.propertyId = query.propertyId;
    }
    if (Object.keys(leaseWhere).length > 0) {
      where.lease = { is: leaseWhere };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.leaseId) {
      where.leaseId = query.leaseId;
    }

    return where;
  }

  private buildPaymentWhere(user: RequestUser, query: ListPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {};

    if (user.role === UserRole.LANDLORD) {
      where.charge = {
        is: {
          lease: {
            is: {
              landlordId: user.id,
            },
          },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.charge = {
        is: {
          lease: {
            is: {
              tenantId: user.id,
            },
          },
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.chargeId) {
      where.chargeId = query.chargeId;
    }

    return where;
  }

  private buildSummaryChargeWhere(
    user: RequestUser,
    propertyId: string | undefined,
    range: { from: Date; to: Date },
  ) {
    const where: Prisma.RentChargeWhereInput = {
      dueDate: {
        gte: range.from,
        lte: range.to,
      },
    };

    const leaseWhere: Prisma.LeaseWhereInput = {};
    if (user.role === UserRole.LANDLORD) {
      leaseWhere.landlordId = user.id;
    }
    if (propertyId) {
      leaseWhere.propertyId = propertyId;
    }
    if (Object.keys(leaseWhere).length > 0) {
      where.lease = { is: leaseWhere };
    }

    return where;
  }

  private assertCanAccessCharge(
    user: RequestUser,
    landlordId: string,
    tenantId: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.role === UserRole.LANDLORD && user.id === landlordId) {
      return;
    }
    if (user.role === UserRole.TENANT && user.id === tenantId) {
      return;
    }
    throw new ForbiddenException("You do not have access to this charge");
  }

  private assertCanAccessPayment(
    user: RequestUser,
    payment: {
      payerId: string | null;
      charge: {
        lease: {
          landlordId: string;
          tenantId: string;
        } | null;
      } | null;
    },
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.TENANT && payment.payerId === user.id) {
      return;
    }

    const lease = payment.charge?.lease;
    if (user.role === UserRole.LANDLORD && lease?.landlordId === user.id) {
      return;
    }
    if (user.role === UserRole.TENANT && lease?.tenantId === user.id) {
      return;
    }

    throw new ForbiddenException("You do not have access to this payment");
  }

  private async applyCashfreeEvent(input: {
    paymentId: string;
    orderId: string;
    paymentStatus?: string;
    cfPaymentId?: string;
    paymentTime?: string;
    source: "WEBHOOK" | "RECONCILE";
    payload: unknown;
    actorId?: string;
  }) {
    const normalizedStatus = normalizeCashfreeStatus(input.paymentStatus);
    const externalEventId = buildCashfreeEventId({
      cfPaymentId: input.cfPaymentId,
      orderId: input.orderId,
      normalizedStatus,
      source: input.source,
      payload: input.payload,
    });

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: input.paymentId },
          include: {
            charge: {
              include: {
                lease: true,
              },
            },
          },
        });
        if (!payment) {
          throw new NotFoundException("Payment not found");
        }

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            externalEventId,
            eventType: `CASHFREE_${input.source}_${normalizedStatus ?? "UNKNOWN"}`,
            payload: input.payload as Prisma.InputJsonValue,
          },
        });

        const updates: Prisma.PaymentUpdateInput = {
          provider: "cashfree",
          reference: input.orderId,
        };
        if (input.cfPaymentId) {
          updates.providerPaymentId = input.cfPaymentId;
        }

        let nextStatus = payment.status;
        let shouldSettleCharge = false;

        if (normalizedStatus === "SUCCESS") {
          if (payment.status !== PaymentStatus.SUCCEEDED) {
            nextStatus = PaymentStatus.SUCCEEDED;
            shouldSettleCharge = true;
          }
          updates.paidAt =
            input.paymentTime &&
            !Number.isNaN(new Date(input.paymentTime).getTime())
              ? new Date(input.paymentTime)
              : new Date();
        } else if (normalizedStatus === "FAILED") {
          if (
            payment.status !== PaymentStatus.SUCCEEDED &&
            payment.status !== PaymentStatus.REFUNDED
          ) {
            nextStatus = PaymentStatus.FAILED;
          }
        } else if (normalizedStatus === "PENDING") {
          if (
            payment.status !== PaymentStatus.SUCCEEDED &&
            payment.status !== PaymentStatus.REFUNDED
          ) {
            nextStatus = PaymentStatus.PENDING;
          }
        }

        updates.status = nextStatus;

        const savedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: updates,
        });

        if (shouldSettleCharge && payment.chargeId) {
          await this.applyApprovedPaymentToCharge(
            tx,
            payment.chargeId,
            asDecimal(payment.amount),
          );
        }

        if (
          normalizedStatus === "SUCCESS" ||
          normalizedStatus === "FAILED" ||
          normalizedStatus === "PENDING"
        ) {
          await tx.auditLog.create({
            data: {
              actorId: input.actorId ?? null,
              entityType: "PAYMENT",
              entityId: savedPayment.id,
              action: `CASHFREE_${input.source}_${normalizedStatus}`,
              metadata: {
                orderId: input.orderId,
                cfPaymentId: input.cfPaymentId,
                paymentStatus: normalizedStatus,
              },
            },
          });
        }

        return tx.payment.findUnique({
          where: { id: payment.id },
          include: paymentInclude,
        });
      });

      if (!updated) {
        throw new NotFoundException("Payment not found after event processing");
      }

      return updated;
    } catch (error) {
      if (isPaymentEventExternalIdDuplicate(error)) {
        const existing = await this.prisma.payment.findUnique({
          where: { id: input.paymentId },
          include: paymentInclude,
        });
        if (!existing) {
          throw new NotFoundException(
            "Payment not found after duplicate event",
          );
        }
        return existing;
      }
      throw error;
    }
  }

  private async resolveOrCreateOnlineMethod(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const existing = await tx.paymentMethod.findFirst({
      where: {
        userId,
        provider: "cashfree",
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    const hasMethods = await tx.paymentMethod.count({
      where: { userId },
    });

    const created = await tx.paymentMethod.create({
      data: {
        userId,
        type: PaymentMethodType.OTHER,
        provider: "cashfree",
        providerRef: "hosted_checkout",
        isDefault: hasMethods === 0,
      },
      select: { id: true },
    });
    return created.id;
  }

  private async resolveOrCreateCashMethod(userId: string) {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: {
        userId,
        type: PaymentMethodType.CASH,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    const hasMethods = await this.prisma.paymentMethod.count({
      where: { userId },
    });

    const created = await this.prisma.paymentMethod.create({
      data: {
        userId,
        type: PaymentMethodType.CASH,
        provider: "cash",
        providerRef: "in_person",
        isDefault: hasMethods === 0,
      },
      select: { id: true },
    });
    return created.id;
  }

  private async applyApprovedPaymentToCharge(
    tx: Prisma.TransactionClient,
    chargeId: string,
    amount: Prisma.Decimal,
  ) {
    const charge = await tx.rentCharge.findUnique({
      where: { id: chargeId },
      select: {
        id: true,
        dueDate: true,
        status: true,
        balanceAmount: true,
      },
    });
    if (!charge) {
      throw new NotFoundException("Charge not found for payment update");
    }

    const currentBalance = asDecimal(charge.balanceAmount);
    const nextBalanceRaw = currentBalance.minus(amount);
    const nextBalance = nextBalanceRaw.lt(zeroMoney)
      ? zeroMoney
      : nextBalanceRaw;

    const nextStatus = nextBalance.eq(zeroMoney)
      ? ChargeStatus.PAID
      : charge.dueDate.getTime() < Date.now()
        ? ChargeStatus.OVERDUE
        : ChargeStatus.PARTIALLY_PAID;

    await tx.rentCharge.update({
      where: { id: charge.id },
      data: {
        balanceAmount: nextBalance,
        status: nextStatus,
      },
    });
  }

  private async syncOverdueCharges() {
    await this.prisma.rentCharge.updateMany({
      where: {
        status: {
          in: [ChargeStatus.ISSUED, ChargeStatus.PARTIALLY_PAID],
        },
        balanceAmount: {
          gt: zeroMoney,
        },
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: ChargeStatus.OVERDUE,
      },
    });
  }

  private resolveBillingPeriod(inputMonth: string | undefined) {
    const now = new Date();
    const defaultMonth = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const monthString = (inputMonth ?? defaultMonth).trim();
    const matched = /^(\d{4})-(\d{2})$/.exec(monthString);
    if (!matched) {
      throw new BadRequestException("month must be in YYYY-MM format");
    }

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException("month must be in YYYY-MM format");
    }

    const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return {
      year,
      month,
      monthString,
      periodStart,
      periodEnd,
    };
  }
}

const chargeInclude = {
  lease: {
    include: {
      property: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          addressLine1: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          monthlyRent: true,
        },
      },
      landlord: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
  payments: {
    include: {
      payer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      method: {
        select: {
          id: true,
          type: true,
          provider: true,
          last4: true,
          brand: true,
          isDefault: true,
        },
      },
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.RentChargeInclude;

const paymentInclude = {
  charge: {
    include: {
      lease: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  },
  payer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  method: {
    select: {
      id: true,
      type: true,
      provider: true,
      last4: true,
      brand: true,
      isDefault: true,
    },
  },
  events: {
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.PaymentInclude;

const isPrismaUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const isPaymentEventExternalIdDuplicate = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") {
    return false;
  }
  const target = Array.isArray(error.meta?.target)
    ? error.meta?.target.join(",")
    : String(error.meta?.target ?? "");
  return (
    target.includes("PaymentEvent_externalEventId_key") ||
    target.includes("externalEventId")
  );
};

const asDecimal = (
  value: Prisma.Decimal | string | number | null | undefined,
): Prisma.Decimal => {
  if (value === undefined || value === null) {
    return zeroMoney;
  }
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
};

const moneyToString = (value: Prisma.Decimal) => value.toFixed(2);

const dueDateForMonth = (year: number, month: number, dueDay: number) => {
  const clampedDay = Math.min(Math.max(dueDay, 1), daysInMonth(year, month));
  return new Date(Date.UTC(year, month - 1, clampedDay, 12, 0, 0, 0));
};

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const monthKeyFromDate = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const resolveSummaryDateRange = (
  fromInput: string | undefined,
  toInput: string | undefined,
) => {
  const to = toInput ? new Date(toInput) : new Date();
  if (Number.isNaN(to.getTime())) {
    throw new BadRequestException("Invalid to date");
  }

  const from = fromInput
    ? new Date(fromInput)
    : new Date(
        Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1, 0, 0, 0, 0),
      );
  if (Number.isNaN(from.getTime())) {
    throw new BadRequestException("Invalid from date");
  }
  if (from.getTime() > to.getTime()) {
    throw new BadRequestException("from date must be before to date");
  }

  return { from, to };
};

type NormalizedCashfreeStatus = "SUCCESS" | "FAILED" | "PENDING";

const normalizeCashfreeStatus = (
  status: string | undefined,
): NormalizedCashfreeStatus | undefined => {
  if (!status) {
    return undefined;
  }

  const upper = status.trim().toUpperCase();
  if (upper === "SUCCESS" || upper === "PAID") {
    return "SUCCESS";
  }
  if (upper === "FAILED" || upper === "USER_DROPPED" || upper === "CANCELLED") {
    return "FAILED";
  }
  if (upper === "PENDING" || upper === "ACTIVE" || upper === "NOT_ATTEMPTED") {
    return "PENDING";
  }
  return undefined;
};

const normalizeIndianPhone = (
  phone: string | null | undefined,
): string | null => {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return null;
};

const buildCashfreeReturnUrl = (input: {
  base: string | undefined;
  orderId: string;
  chargeId: string;
  paymentProvider: string;
}): string | undefined => {
  const base = input.base?.trim();
  if (!base) {
    return undefined;
  }

  const queryJoin = base.includes("?") ? "&" : "?";
  return `${base}${queryJoin}order_id=${encodeURIComponent(
    input.orderId,
  )}&charge_id=${encodeURIComponent(
    input.chargeId,
  )}&provider=${encodeURIComponent(input.paymentProvider)}`;
};

const parseJsonObject = (raw: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getString = (
  object: Record<string, unknown>,
  path: string[],
): string | undefined => {
  let cursor: unknown = object;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "string" ? cursor : undefined;
};

const buildCashfreeEventId = (input: {
  cfPaymentId?: string;
  orderId: string;
  normalizedStatus?: NormalizedCashfreeStatus;
  source: "WEBHOOK" | "RECONCILE";
  payload: unknown;
}) => {
  const status = input.normalizedStatus ?? "UNKNOWN";
  if (input.cfPaymentId) {
    return `cashfree:${input.cfPaymentId}:${status}`;
  }

  const payloadString =
    typeof input.payload === "string"
      ? input.payload
      : JSON.stringify(input.payload ?? {});
  const payloadToken = Buffer.from(payloadString)
    .toString("base64url")
    .slice(0, 48);

  return `cashfree:${input.source}:${input.orderId}:${status}:${payloadToken}`;
};

const selectCashfreeAttempt = (
  payments: CashfreeOrderPayment[],
): CashfreeOrderPayment | null => {
  if (payments.length === 0) {
    return null;
  }

  const byPriority = [...payments].sort((left, right) => {
    const leftScore = cashfreeStatusPriority(left.payment_status);
    const rightScore = cashfreeStatusPriority(right.payment_status);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const leftTime = left.payment_time
      ? new Date(left.payment_time).getTime()
      : 0;
    const rightTime = right.payment_time
      ? new Date(right.payment_time).getTime()
      : 0;
    return rightTime - leftTime;
  });

  return byPriority[0];
};

const cashfreeStatusPriority = (status: string | undefined) => {
  const normalized = normalizeCashfreeStatus(status);
  if (normalized === "SUCCESS") {
    return 3;
  }
  if (normalized === "PENDING") {
    return 2;
  }
  if (normalized === "FAILED") {
    return 1;
  }
  return 0;
};
