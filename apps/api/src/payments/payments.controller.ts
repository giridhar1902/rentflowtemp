import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";
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
}
