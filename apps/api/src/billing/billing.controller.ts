import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { Public } from "../common/auth/public.decorator";
import { getRequestUser } from "../common/auth/request-user";
import { BillingSummaryQueryDto } from "./dto/billing-summary-query.dto";
import { CreateOnlinePaymentSessionDto } from "./dto/create-online-payment-session.dto";
import { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import { GenerateMonthlyChargesDto } from "./dto/generate-monthly-charges.dto";
import { ListChargesDto } from "./dto/list-charges.dto";
import { ListPaymentsDto } from "./dto/list-payments.dto";
import { ReviewPaymentDto } from "./dto/review-payment.dto";
import { SubmitCashPaymentDto } from "./dto/submit-cash-payment.dto";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("status")
  getStatus() {
    return { module: "billing", status: "ok" };
  }

  @Get("charges")
  listCharges(@Req() request: Request, @Query() query: ListChargesDto) {
    const user = getRequestUser(request);
    return this.billingService.listCharges(user, query);
  }

  @Post("charges/generate-monthly")
  generateMonthly(
    @Req() request: Request,
    @Body() payload: GenerateMonthlyChargesDto,
  ) {
    const user = getRequestUser(request);
    return this.billingService.generateMonthlyCharges(user, payload);
  }

  @Get("charges/:chargeId")
  getCharge(@Req() request: Request, @Param("chargeId") chargeId: string) {
    const user = getRequestUser(request);
    return this.billingService.getChargeById(user, chargeId);
  }

  @Post("charges/:chargeId/online-session")
  createOnlineSession(
    @Req() request: Request,
    @Param("chargeId") chargeId: string,
    @Body() payload: CreateOnlinePaymentSessionDto,
  ) {
    const user = getRequestUser(request);
    return this.billingService.createOnlineSession(user, chargeId, payload);
  }

  @Post("charges/:chargeId/cash-payments")
  submitCashPayment(
    @Req() request: Request,
    @Param("chargeId") chargeId: string,
    @Body() payload: SubmitCashPaymentDto,
  ) {
    const user = getRequestUser(request);
    return this.billingService.submitCashPayment(user, chargeId, payload);
  }

  @Get("payments")
  listPayments(@Req() request: Request, @Query() query: ListPaymentsDto) {
    const user = getRequestUser(request);
    return this.billingService.listPayments(user, query);
  }

  @Get("payments/pending-review")
  listPendingReview(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.billingService.listPendingCashReviews(user);
  }

  @Post("payments/:paymentId/review")
  reviewPayment(
    @Req() request: Request,
    @Param("paymentId") paymentId: string,
    @Body() payload: ReviewPaymentDto,
  ) {
    const user = getRequestUser(request);
    return this.billingService.reviewPayment(user, paymentId, payload);
  }

  @Post("payments/:paymentId/reconcile")
  reconcilePayment(
    @Req() request: Request,
    @Param("paymentId") paymentId: string,
  ) {
    const user = getRequestUser(request);
    return this.billingService.reconcilePayment(user, paymentId);
  }

  @Get("payment-methods")
  listPaymentMethods(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.billingService.listPaymentMethods(user);
  }

  @Post("payment-methods")
  createPaymentMethod(
    @Req() request: Request,
    @Body() payload: CreatePaymentMethodDto,
  ) {
    const user = getRequestUser(request);
    return this.billingService.createPaymentMethod(user, payload);
  }

  @Post("payment-methods/:methodId/default")
  setDefaultPaymentMethod(
    @Req() request: Request,
    @Param("methodId") methodId: string,
  ) {
    const user = getRequestUser(request);
    return this.billingService.setDefaultPaymentMethod(user, methodId);
  }

  @Get("expenses")
  listExpenses(
    @Req() request: Request,
    @Query() query: Record<string, string>,
  ) {
    const user = getRequestUser(request);
    return this.billingService.listExpenses(user, query);
  }

  @Post("expenses")
  createExpense(@Req() request: Request, @Body() payload: any) {
    const user = getRequestUser(request);
    return this.billingService.createExpense(user, payload);
  }

  @Get("reports/summary")
  getSummary(@Req() request: Request, @Query() query: BillingSummaryQueryDto) {
    const user = getRequestUser(request);
    return this.billingService.getBillingSummary(user, query);
  }

  @Public()
  @Post("webhooks/cashfree")
  receiveCashfreeWebhook(
    @Req() request: Request,
    @Headers("x-webhook-signature") signatureHeader: string | undefined,
    @Headers("x-webhook-timestamp") timestampHeader: string | undefined,
  ) {
    if (!request.rawBody) {
      throw new UnauthorizedException(
        "Webhook raw body is unavailable; enable rawBody in Nest bootstrap",
      );
    }

    return this.billingService.handleCashfreeWebhook({
      rawBody: request.rawBody,
      signatureHeader,
      timestampHeader,
    });
  }
}
