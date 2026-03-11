import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestUser } from "../common/auth/request-user";
import { SubmitOfflinePaymentDto } from "./dto/submit-offline-payment.dto";
import { ReviewOfflinePaymentDto } from "./dto/review-offline-payment.dto";
import { UserRole, OfflineRentPaymentStatus } from "@prisma/client";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitOfflinePayment(
    user: RequestUser,
    payload: SubmitOfflinePaymentDto,
  ) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException(
        "Only tenants can submit offline rent payments",
      );
    }

    const { amount, ...rest } = payload;

    const payment = await this.prisma.offlineRentPayment.create({
      data: {
        ...rest,
        amount,
        tenantId: user.id,
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
}
