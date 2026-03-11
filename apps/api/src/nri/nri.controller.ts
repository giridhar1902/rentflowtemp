import { Controller, Get, Req, Query, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { NriService } from "./nri.service";
import { RequireTier } from "../common/auth/require-tier.decorator";
import { SubscriptionGuard } from "../common/auth/subscription.guard";
import { SubscriptionTier } from "@prisma/client";

@Controller("nri")
@UseGuards(SubscriptionGuard)
export class NriController {
  constructor(private readonly nriService: NriService) {}

  @Get("income-summary")
  @RequireTier(SubscriptionTier.NRI_ESSENTIAL)
  async getIncomeSummary(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.nriService.getIncomeSummary(user.id);
  }

  @Get("tds-summary")
  @RequireTier(SubscriptionTier.NRI_ESSENTIAL)
  async getTdsSummary(@Req() request: Request, @Query("year") year?: string) {
    const user = getRequestUser(request);
    return this.nriService.getTdsSummary(user.id, year);
  }

  @Get("tds-summary/pdf")
  @RequireTier(SubscriptionTier.NRI_PREMIUM)
  async getTdsSummaryPdf(
    @Req() request: Request,
    @Res() response: Response,
    @Query("year") year?: string,
  ) {
    const user = getRequestUser(request);
    const pdfBuffer = await this.nriService.generateTdsSummaryPdf(
      user.id,
      year,
    );

    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=TDS_Summary_${year || "current"}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    response.end(pdfBuffer);
  }
}
