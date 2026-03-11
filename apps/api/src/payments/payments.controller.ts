import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Headers,
} from "@nestjs/common";
import { Request } from "express";
import { Public } from "../common/auth/public.decorator";
import { getRequestUser } from "../common/auth/request-user";
import { PaymentsService } from "./payments.service";
import { SubmitOfflinePaymentDto } from "./dto/submit-offline-payment.dto";
import { ReviewOfflinePaymentDto } from "./dto/review-offline-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("submit")
  submitOfflinePayment(
    @Req() request: Request,
    @Body() payload: SubmitOfflinePaymentDto,
  ) {
    const user = getRequestUser(request);
    return this.paymentsService.submitOfflinePayment(user, payload);
  }

  @Get("pending")
  listPending(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.paymentsService.listPending(user);
  }

  @Get("tenant")
  listTenantPayments(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.paymentsService.listTenantPayments(user);
  }

  @Post(":id/review")
  reviewOfflinePayment(
    @Req() request: Request,
    @Param("id") paymentId: string,
    @Body() payload: ReviewOfflinePaymentDto,
  ) {
    const user = getRequestUser(request);
    return this.paymentsService.reviewOfflinePayment(user, paymentId, payload);
  }

  // ─── WEEK 2: RENT REMINDERS & RAZORPAY ────────────────────────────────

  @Post("reminders/send-all")
  async triggerAllReminders() {
    // Usually called by cron, but exposing for manual testing or admin override
    await this.paymentsService.generateMonthlyPayments();
    return { success: true };
  }

  @Post(":id/remind")
  async sendReminder(@Param("id") paymentId: string) {
    return this.paymentsService.sendRentReminder(paymentId);
  }

  @Post(":id/mark-cash-paid")
  async markAsCashPaid(
    @Req() request: Request,
    @Param("id") paymentId: string,
  ) {
    const user = getRequestUser(request);
    return this.paymentsService.markAsPaidCash(paymentId, user.id);
  }

  @Public()
  @Post("webhook/razorpay")
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers("x-razorpay-signature") signature: string,
  ) {
    return this.paymentsService.handleRazorpayWebhook(payload, signature);
  }

  @Get("lease/:leaseId")
  async getPaymentsForLease(@Param("leaseId") leaseId: string) {
    // Would logically retrieve all payments for a particular lease
    // To implement cleanly, let's leverage the Prisma injection
    return this.paymentsService["prisma"].payment.findMany({
      where: { leaseId },
      orderBy: { dueDate: "desc" },
    });
  }
}
