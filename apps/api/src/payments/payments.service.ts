import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../common/auth/request-user";
import { SubmitOfflinePaymentDto } from "./dto/submit-offline-payment.dto";
import { ReviewOfflinePaymentDto } from "./dto/review-offline-payment.dto";
import { UserRole, OfflineRentPaymentStatus } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { WhatsappService } from "../shared/whatsapp.service";
import { ReceiptService } from "../shared/receipt.service";
import * as crypto from "crypto";
import Razorpay from "razorpay";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly whatsappService: WhatsappService,
    private readonly receiptService: ReceiptService,
  ) {
    const keyId = this.configService.get<string>("RAZORPAY_KEY_ID");
    const keySecret = this.configService.get<string>("RAZORPAY_KEY_SECRET");
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async submitOfflinePayment(
    user: RequestUser,
    payload: SubmitOfflinePaymentDto,
  ) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException(
        "Only tenants can submit offline rent payments",
      );
    }

    const { amount, paymentDate, ...rest } = payload;

    const payment = await this.prisma.offlineRentPayment.create({
      data: {
        ...rest,
        amount,
        paymentDate: new Date(paymentDate),
        tenantId: user.id,
      },
      include: {
        property: {
          select: { name: true, ownerId: true },
        },
        unit: {
          select: { name: true },
        },
        tenant: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Notify the landlord (fire-and-forget)
    const landlordId = payment.property.ownerId;
    const tenantName =
      [payment.tenant?.firstName, payment.tenant?.lastName]
        .filter(Boolean)
        .join(" ") || "A tenant";
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));

    this.prisma.notification
      .create({
        data: {
          userId: landlordId,
          type: "PAYMENT_RECEIVED",
          channel: "IN_APP",
          title: "Cash payment pending approval",
          body: `${tenantName} recorded a ${rest.paymentMode} payment of ${formattedAmount} for ${rest.rentMonth} (${payment.unit.name}, ${payment.property.name}). Tap to review.`,
        },
      })
      .catch((err) =>
        this.logger.error("Failed to create landlord notification", err),
      );

    return payment;
  }

  async listPending(user: RequestUser) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Only landlords or admins can view pending cash payments",
      );
    }

    const payments = await this.prisma.offlineRentPayment.findMany({
      where: {
        status: OfflineRentPaymentStatus.PENDING_APPROVAL,
        property: {
          ...(user.role === UserRole.LANDLORD ? { ownerId: user.id } : {}),
        },
      },
      include: {
        property: {
          select: { name: true },
        },
        unit: {
          select: { name: true },
        },
        tenant: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return payments;
  }

  async listTenantPayments(user: RequestUser) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException(
        "Access denied. Only tenants can view their offline payments.",
      );
    }

    const payments = await this.prisma.offlineRentPayment.findMany({
      where: {
        tenantId: user.id,
      },
      include: {
        property: {
          select: { name: true },
        },
        unit: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return payments;
  }

  async reviewOfflinePayment(
    user: RequestUser,
    paymentId: string,
    payload: ReviewOfflinePaymentDto,
  ) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Only landlords or admins can review offline payments",
      );
    }

    const payment = await this.prisma.offlineRentPayment.findUnique({
      where: { id: paymentId },
      include: {
        property: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found");
    }

    if (
      user.role === UserRole.LANDLORD &&
      payment.property.ownerId !== user.id
    ) {
      throw new ForbiddenException(
        "You do not have permission to review this payment",
      );
    }

    if (payment.status !== OfflineRentPaymentStatus.PENDING_APPROVAL) {
      throw new ForbiddenException("Only pending payments can be reviewed");
    }

    const updatedPayment = await this.prisma.offlineRentPayment.update({
      where: { id: paymentId },
      data: {
        status: payload.action,
      },
      include: {
        property: {
          select: { name: true },
        },
        unit: {
          select: { name: true },
        },
        tenant: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return {
      message: `Offline payment successfully ${payload.action.toLowerCase()}.`,
      payment: updatedPayment,
    };
  }

  // ─── WEEK 2: RENT REMINDERS & RAZORPAY ────────────────────────────────

  async generateMonthlyPayments() {
    this.logger.log("Generating monthly payments for active leases...");
    const activeLeases = await this.prisma.lease.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (const lease of activeLeases) {
      // dueDate is typically the 1st of the current month
      const dueDate = new Date(currentYear, currentMonth, 1);
      const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          leaseId: lease.id,
          dueDate: {
            gte: dueDate,
            lt: nextMonthDate,
          },
        },
      });

      if (!existingPayment) {
        await this.prisma.payment.create({
          data: {
            leaseId: lease.id,
            amount: lease.monthlyRent,
            status: "PENDING",
            dueDate: dueDate,
            currency: "INR",
          },
        });
        this.logger.log(
          `Created monthly payment for lease ${lease.id} due ${dueDate.toISOString()}`,
        );
      }
    }
  }

  async sendRentReminder(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            tenant: true,
            property: true,
          },
        },
      },
    });

    if (!payment || !payment.lease) {
      throw new NotFoundException("Payment or Lease not found");
    }

    const { tenant, property } = payment.lease;

    if (!tenant.phone) {
      this.logger.warn(
        `Cannot send reminder for Payment ${payment.id}: Tenant has no phone number.`,
      );
      return;
    }

    const dueDateStr = payment.dueDate
      ? payment.dueDate.toLocaleDateString("en-GB")
      : "Upcoming";
    const monthStr = payment.dueDate
      ? payment.dueDate.toLocaleString("default", { month: "long" })
      : "this month";
    const yearStr = payment.dueDate
      ? payment.dueDate.getFullYear().toString()
      : new Date().getFullYear().toString();

    // Generate Razorpay Payment Link
    let paymentLinkUrl = payment.razorpayPaymentLinkUrl;
    if (!paymentLinkUrl) {
      const razorpayKeyId = this.configService.get("RAZORPAY_KEY_ID");
      const razorpayKeySecret = this.configService.get("RAZORPAY_KEY_SECRET");
      const baseUrl =
        this.configService.get("APP_BASE_URL") || "http://localhost:3000";

      let finalAmount = Number(payment.amount);
      let tdsAmount = 0;

      if (payment.lease.hasTdsObligation) {
        tdsAmount = Math.round(Number(payment.amount) * payment.lease.tdsRate);
        finalAmount = Number(payment.amount) - tdsAmount;
      }

      if (razorpayKeyId && razorpayKeySecret) {
        const authHeader = `Basic ${Buffer.from(
          `${razorpayKeyId}:${razorpayKeySecret}`,
        ).toString("base64")}`;

        const link = await this.razorpay.paymentLink.create({
          amount: Math.round(finalAmount * 100), // convert to paise
          currency: payment.currency,
          accept_partial: false,
          reference_id: payment.id,
          description: `Rent for ${monthStr} ${yearStr} - ${property.name}`,
          customer: {
            name: tenant.firstName
              ? `${tenant.firstName} ${tenant.lastName || ""}`
              : "Tenant",
            contact: tenant.phone.startsWith("+91")
              ? tenant.phone
              : `+91${tenant.phone.replace(/^\\+?91/, "")}`,
          },
          notify: { sms: false, email: false },
          reminder_enable: false,
          callback_url: `${baseUrl}/payment-success`,
          callback_method: "get",
        });

        paymentLinkUrl = link.short_url;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentLinkId: link.id,
            razorpayPaymentLinkUrl: link.short_url,
            ...(payment.lease.hasTdsObligation && {
              tdsAmount,
              netAmountReceived: finalAmount,
            }),
          },
        });

        paymentLinkUrl = payment.lease.hasTdsObligation
          ? `${baseUrl}/#/tds-consent/${payment.id}`
          : link.short_url;
      } else {
        paymentLinkUrl = payment.lease.hasTdsObligation
          ? `${baseUrl}/#/tds-consent/${payment.id}`
          : `${baseUrl}/#/pay/${payment.id}`; // Fallback if no keys
      }
    } else if (payment.lease.hasTdsObligation) {
      const baseUrl =
        this.configService.get("APP_BASE_URL") || "http://localhost:3000";
      paymentLinkUrl = `${baseUrl}/#/tds-consent/${payment.id}`;
    }

    // Send WhatsApp reminder
    await this.whatsappService.sendRentReminder(
      tenant.phone,
      tenant.firstName || "Tenant",
      property.name,
      Number(payment.amount),
      dueDateStr,
      paymentLinkUrl,
    );

    // Update reminder timestamp
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { reminderSentAt: new Date() },
    });

    return updatedPayment;
  }

  async markAsPaidCash(paymentId: string, landlordId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment || !payment.lease) {
      throw new NotFoundException("Payment or Lease not found");
    }

    if (payment.lease.property.ownerId !== landlordId) {
      throw new ForbiddenException("You do not own this property");
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCEEDED", // Emulating "PAID", Prisma enum mapping holds 'SUCCEEDED' locally per Week 1 logic
        paidAt: new Date(),
        // method logic applies conceptually or via relations
      },
    });

    // Trigger explicit receipt generation for Cash Flow
    await this.generateAndSendReceipt(paymentId);

    return updatedPayment;
  }

  async handleRazorpayWebhook(payload: any, signature: string) {
    const secret = this.configService.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new UnauthorizedException("Invalid Razorpay payload signature");
    }

    if (payload.event === "payment_link.paid") {
      const plinkId = payload.payload.payment_link.entity.id;
      const rpPaymentId = payload.payload.payment_link.entity.payment_id;

      const payment = await this.prisma.payment.findFirst({
        where: { razorpayPaymentLinkId: plinkId },
      });

      if (payment && payment.status !== "SUCCEEDED") {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCEEDED",
            paidAt: new Date(),
            razorpayPaymentId: rpPaymentId,
          },
        });

        // Generate receipt
        await this.generateAndSendReceipt(payment.id);
      }
    }

    return { status: "ok" };
  }

  private async generateAndSendReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            tenant: true,
            property: { include: { owner: true } },
          },
        },
      },
    });

    if (!payment || !payment.lease) return;

    const tenantUser = payment.lease.tenant;
    const propertyOwner = payment.lease.property.owner;

    try {
      const pdfBuffer = await this.receiptService.generateReceipt(
        payment.id,
        `${propertyOwner.firstName} ${propertyOwner.lastName}`,
        `${payment.lease.property.addressLine1}, ${payment.lease.property.city}`,
        `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
        tenantUser?.phone || "N/A",
        Number(payment.amount),
        payment.dueDate
          ? payment.dueDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })
          : "N/A",
        payment.razorpayPaymentId ? "UPI" : "CASH",
        payment.paidAt || new Date(),
      );

      const receiptUrl = await this.receiptService.uploadReceiptToSupabase(
        pdfBuffer,
        payment.id,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { receiptPdfUrl: receiptUrl },
      });

      // Send to Tenant
      if (tenantUser?.phone) {
        await this.whatsappService.sendReceiptConfirmation(
          tenantUser.phone,
          payment.lease.tenant.firstName,
          payment.lease.property.name,
          Number(payment.amount),
          (payment.paidAt || new Date()).toLocaleDateString("en-GB"),
          receiptUrl,
        );
      }

      // Notify Landlord
      if (propertyOwner?.phone) {
        await this.whatsappService.sendReceiptConfirmation(
          propertyOwner.phone,
          "You",
          payment.lease.property.name,
          Number(payment.amount),
          (payment.paidAt || new Date()).toLocaleDateString("en-GB"),
          receiptUrl,
        );
      }
    } catch (e) {
      this.logger.error("Failed to generate/send receipt", e);
    }
  }
}
