import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { CurrencyService } from "../shared/currency.service";
import { PaymentStatus } from "@prisma/client";

@Injectable()
export class NriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currencyService: CurrencyService,
  ) {}

  async getIncomeSummary(landlordId: string) {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });

    if (!landlord || !landlord.isNRI) {
      throw new ForbiddenException(
        "This feature is only available for NRI landlords",
      );
    }

    const foreignCurrency = landlord.currency || "USD";
    const exchangeRate = await this.currencyService.getRate(foreignCurrency);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const properties = await this.prisma.property.findMany({
      where: { ownerId: landlordId },
      include: {
        leases: {
          include: {
            payments: {
              where: { status: PaymentStatus.SUCCEEDED },
            },
            charges: {
              where: {
                dueDate: { lt: now },
                status: { notIn: ["PAID", "VOID", "ISSUED"] }, // OVERDUE, PARTIALLY_PAID
              },
            },
          },
        },
        documents: {
          where: { createdAt: { gte: startOfMonth }, type: "OTHER" },
        },
        maintenanceRequests: {
          where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
        },
      },
    });

    let totalINR = 0;
    const monthlyBreakdownMap = new Map<string, number>();
    const propertySummaryMap = new Map<
      string,
      { amountINR: number; healthScore: number; healthStatus: string }
    >();

    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    for (const property of properties) {
      let propertyTotalINR = 0;

      for (const lease of property.leases) {
        for (const payment of lease.payments) {
          const amount = Number(payment.amount);

          if (payment.paidAt) {
            const date = new Date(payment.paidAt);
            const monthKey = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
            const currentTotal = monthlyBreakdownMap.get(monthKey) || 0;
            monthlyBreakdownMap.set(monthKey, currentTotal + amount);

            // If it's the current month, add to the total snapshot
            if (
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth()
            ) {
              totalINR += amount;
              propertyTotalINR += amount;
            }
          }
        }
      }

      let lateCount = 0;
      for (const lease of property.leases) {
        lateCount += lease.charges.length;
      }

      let rentScore = 40;
      if (lateCount === 1) rentScore = 25;
      else if (lateCount >= 2) rentScore = 0;

      const photoCount = property.documents.length;
      let photoScore = 0;
      if (photoCount >= 4) photoScore = 30;
      else if (photoCount >= 1) photoScore = 15;

      const openMaint = property.maintenanceRequests.length;
      let maintScore = 30;
      if (openMaint === 1) maintScore = 20;
      else if (openMaint === 2) maintScore = 10;
      else if (openMaint >= 3) maintScore = 0;

      const totalHealthScore = rentScore + photoScore + maintScore;
      let healthStatus = "At Risk";
      if (totalHealthScore >= 80) healthStatus = "Healthy";
      else if (totalHealthScore >= 50) healthStatus = "Needs Attention";

      propertySummaryMap.set(property.name, {
        amountINR: propertyTotalINR,
        healthScore: totalHealthScore,
        healthStatus,
      });
    }

    const monthlyBreakdown = Array.from(monthlyBreakdownMap.entries())
      .map(([month, amountINR]) => ({
        month,
        amountINR,
        amountForeign: Number((amountINR * exchangeRate).toFixed(2)),
      }))
      // Sort by date (naive string match or parse)
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );

    const propertySummary = Array.from(propertySummaryMap.entries()).map(
      ([propertyName, stats]) => ({
        propertyName,
        amountINR: stats.amountINR,
        amountForeign: Number((stats.amountINR * exchangeRate).toFixed(2)),
        healthScore: stats.healthScore,
        healthStatus: stats.healthStatus,
      }),
    );

    return {
      totalINR,
      totalForeignCurrency: Number((totalINR * exchangeRate).toFixed(2)),
      foreignCurrency,
      exchangeRate,
      rateUpdatedAt: new Date().toISOString(),
      monthlyBreakdown,
      propertySummary,
    };
  }

  async getTdsSummary(landlordId: string, yearStr?: string) {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });
    if (!landlord || !landlord.isNRI) {
      throw new ForbiddenException(
        "This feature is only available for NRI landlords",
      );
    }

    const { financialYear, startDate, endDate } =
      this.getCurrentFinancialYear(yearStr);
    const foreignCurrency = landlord.currency || "USD";
    const exchangeRate = await this.currencyService.getRate(foreignCurrency);

    const properties = await this.prisma.property.findMany({
      where: { ownerId: landlordId },
      include: {
        leases: {
          include: {
            tenant: true,
            payments: {
              where: {
                status: PaymentStatus.SUCCEEDED,
                paidAt: { gte: startDate, lte: endDate },
              },
            },
          },
        },
      },
    });

    const quarters = [
      {
        id: "Q1",
        start: new Date(startDate.getFullYear(), 3, 1),
        end: new Date(startDate.getFullYear(), 6, 0),
        label: "Q1 (Apr-Jun)",
        dueDate: `${startDate.getFullYear()}-07-31`,
      },
      {
        id: "Q2",
        start: new Date(startDate.getFullYear(), 6, 1),
        end: new Date(startDate.getFullYear(), 9, 0),
        label: "Q2 (Jul-Sep)",
        dueDate: `${startDate.getFullYear()}-10-31`,
      },
      {
        id: "Q3",
        start: new Date(startDate.getFullYear(), 9, 1),
        end: new Date(startDate.getFullYear(), 12, 0),
        label: "Q3 (Oct-Dec)",
        dueDate: `${startDate.getFullYear() + 1}-01-31`,
      },
      {
        id: "Q4",
        start: new Date(startDate.getFullYear() + 1, 0, 1),
        end: new Date(startDate.getFullYear() + 1, 3, 0),
        label: "Q4 (Jan-Mar)",
        dueDate: `${startDate.getFullYear() + 1}-05-31`,
      },
    ];

    let annualTotalRent = 0;
    let annualTotalTds = 0;
    let annualNetReceived = 0;

    const quarterSummaries = quarters.map((q) => {
      let qTotalRent = 0;
      let qTotalTds = 0;
      let qNetReceived = 0;
      const tenantsMap = new Map();

      properties.forEach((prop) => {
        prop.leases.forEach((lease) => {
          lease.payments.forEach((payment) => {
            const paid = payment.paidAt as Date;
            if (paid >= q.start && paid <= q.end) {
              const amount = Number(payment.amount);
              const tds = payment.tdsAmount ? Number(payment.tdsAmount) : 0;
              const net = payment.netAmountReceived
                ? Number(payment.netAmountReceived)
                : amount;

              qTotalRent += amount;
              qTotalTds += tds;
              qNetReceived += net;

              annualTotalRent += amount;
              annualTotalTds += tds;
              annualNetReceived += net;

              if (tds > 0) {
                const tenantId = lease.tenant.id;
                if (!tenantsMap.has(tenantId)) {
                  tenantsMap.set(tenantId, {
                    name: `${lease.tenant.firstName || ""} ${lease.tenant.lastName || ""}`.trim(),
                    pan: (lease.tenant as any).pan || "NOT_PROVIDED",
                    rentPaid: 0,
                    tdsDeducted: 0,
                    tdsDepositConfirmed: !!payment.tdsConfirmedByLandlord,
                  });
                }
                const t = tenantsMap.get(tenantId);
                t.rentPaid += amount;
                t.tdsDeducted += tds;
              }
            }
          });
        });
      });

      return {
        quarter: q.label,
        totalRent: qTotalRent,
        totalTdsDeducted: qTotalTds,
        netReceived: qNetReceived,
        form27QDueDate: q.dueDate,
        form27QFiled: false,
        tenants: Array.from(tenantsMap.values()),
      };
    });

    return {
      financialYear,
      quarters: quarterSummaries,
      annualSummary: {
        totalRentINR: annualTotalRent,
        totalTdsINR: annualTotalTds,
        netReceivedINR: annualNetReceived,
        totalRentForeign: Number((annualTotalRent * exchangeRate).toFixed(2)),
        foreignCurrency,
      },
    };
  }

  async generateTdsSummaryPdf(landlordId: string, yearStr?: string) {
    const summary = await this.getTdsSummary(landlordId, yearStr);
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { height } = page.getSize();
    let y = height - 50;

    const drawText = (text: string, size = 12, isBold = false, x = 50) => {
      page.drawText(text, { x, y, size, font: isBold ? boldFont : font });
      y -= size + 8;
    };

    drawText("RENTMATE - TDS SUMMARY FOR CA", 18, true);
    y -= 10;
    drawText(`Financial Year: ${summary.financialYear}`);
    drawText(
      `Landlord: ${landlord?.firstName || ""} ${landlord?.lastName || ""} (NRI)`,
    );
    y -= 15;

    drawText("ANNUAL SUMMARY", 14, true);
    drawText(`Total Rent Paid: Rs. ${summary.annualSummary.totalRentINR}`);
    drawText(`TDS Deducted: Rs. ${summary.annualSummary.totalTdsINR}`);
    drawText(
      `Net Amount Received: Rs. ${summary.annualSummary.netReceivedINR}`,
    );
    y -= 15;

    drawText("QUARTER-WISE BREAKDOWN", 14, true);
    summary.quarters.forEach((q) => {
      drawText(
        `${q.quarter}: Rs. ${q.totalRent} rent | Rs. ${q.totalTdsDeducted} TDS`,
        12,
        false,
        60,
      );
    });

    y -= 20;
    drawText(
      `Generated by RentMate on ${new Date().toLocaleDateString()}`,
      10,
      false,
    );
    drawText("This is a summary. File Form 27Q via NSDL.", 10, false);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private getCurrentFinancialYear(yearStr?: string) {
    const now = new Date();
    let startYear =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    if (yearStr) {
      startYear = parseInt(yearStr.split("-")[0]);
    }
    const endYear = startYear + 1;
    return {
      financialYear: `${startYear}-${endYear.toString().slice(2)}`,
      startDate: new Date(startYear, 3, 1), // April 1
      endDate: new Date(endYear, 2, 31, 23, 59, 59), // March 31
    };
  }

  async getMorningDigest(landlordId: string): Promise<string> {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
    });
    if (!landlord) return "";
    const income = await this.getIncomeSummary(landlordId);

    // Fetch pending/overdue rent
    const now = new Date();
    const properties = await this.prisma.property.findMany({
      where: { ownerId: landlordId },
      include: {
        leases: {
          include: { charges: true },
        },
        maintenanceRequests: {
          where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
        },
      },
    });

    let pendingCount = 0;
    let pendingAmt = 0;
    let overdueCount = 0;
    let overdueAmt = 0;
    let maintCount = 0;

    properties.forEach((p) => {
      maintCount += p.maintenanceRequests.length;
      p.leases.forEach((l) => {
        l.charges.forEach((c) => {
          if (c.status !== "PAID" && c.status !== "VOID") {
            if (new Date(c.dueDate) < now) {
              overdueCount++;
              overdueAmt += Number(c.balanceAmount);
            } else {
              pendingCount++;
              pendingAmt += Number(c.balanceAmount);
            }
          }
        });
      });
    });

    // Formatting date
    const todayStr = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: landlord.timezone || "Asia/Kolkata",
    }).format(now);

    let text = `🌅 *Good Morning, ${landlord.firstName || "Landlord"}!*\n📍 ${landlord.country || "Global"} | ${todayStr}\n\n`;

    const currMonthKey = `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
    const currMonthRec = income.monthlyBreakdown.find(
      (m) => m.month === currMonthKey,
    );
    const currMonthVal = currMonthRec ? currMonthRec.amountINR : 0;
    const currMonthFor = currMonthRec ? currMonthRec.amountForeign : 0;

    text += `💰 *Rent Status — ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}*\n`;
    text += `✅ Collected: ₹${currMonthVal.toLocaleString()} (${income.foreignCurrency} ${currMonthFor.toLocaleString()})\n`;
    if (pendingCount > 0)
      text += `⏳ Pending: ${pendingCount} tenants (₹${pendingAmt.toLocaleString()})\n`;
    if (overdueCount > 0)
      text += `🔴 Overdue: ${overdueCount} tenants (₹${overdueAmt.toLocaleString()})\n`;

    text += `\n🏠 *Property Health*\n`;
    income.propertySummary.forEach((ps) => {
      const emoji =
        ps.healthScore >= 80 ? "🟢" : ps.healthScore >= 50 ? "🟡" : "🔴";
      text += `${ps.propertyName}: ${emoji} ${ps.healthStatus} (${ps.healthScore}/100)\n`;
    });

    text += `\n📋 *TDS Reminder*\nCheck app for any pending TDS deposits.\n`;

    if (maintCount > 0) {
      text += `\n🔧 *Maintenance*\n${maintCount} open request(s).\n`;
    }

    text += `\nReply with any command or open the app for details.`;
    return text;
  }

  async getIncomeBotText(landlordId: string): Promise<string> {
    const income = await this.getIncomeSummary(landlordId);
    let text = `💰 *Your Rental Income*\n\n`;

    const now = new Date();
    const currMonthKey = `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.toLocaleString("default", { month: "short" })} ${lastMonth.getFullYear()}`;

    const currMonthRec = income.monthlyBreakdown.find(
      (m) => m.month === currMonthKey,
    );
    const lastMonthRec = income.monthlyBreakdown.find(
      (m) => m.month === lastMonthKey,
    );

    if (currMonthRec)
      text += `This month: ₹${currMonthRec.amountINR.toLocaleString()} = ${income.foreignCurrency} ${currMonthRec.amountForeign.toLocaleString()}\n`;
    if (lastMonthRec)
      text += `Last month: ₹${lastMonthRec.amountINR.toLocaleString()} = ${income.foreignCurrency} ${lastMonthRec.amountForeign.toLocaleString()}\n`;

    text += `This year:  ₹${income.totalINR.toLocaleString()} = ${income.foreignCurrency} ${income.totalForeignCurrency.toLocaleString()}\n\n`;
    text += `Exchange rate: 1 INR = ${income.exchangeRate.toFixed(3)} ${income.foreignCurrency}\n(Updated recently)`;
    return text;
  }

  async getTdsBotText(landlordId: string): Promise<string> {
    const summary = await this.getTdsSummary(landlordId);
    let text = `📋 *TDS Summary — ${summary.financialYear}*\n\n`;

    // Pick the most recent quarter with data
    const lastQ =
      summary.quarters.reverse().find((q) => q.tenants.length > 0) ||
      summary.quarters[0];

    if (!lastQ || lastQ.tenants.length === 0) {
      return (
        text +
        "No TDS collections recorded recently.\n\nReply *report* to get the full TDS PDF for your CA."
      );
    }

    const t = lastQ.tenants[0];
    text += `Tenant: ${t.name}\nRent this quarter: ₹${t.rentPaid.toLocaleString()}\nTDS @ 31.2%: ₹${t.tdsDeducted.toLocaleString()}\nNet received: ₹${(t.rentPaid - t.tdsDeducted).toLocaleString()}\n`;
    text += `TDS deposit status: ${t.tdsDepositConfirmed ? "✅ Confirmed" : "⏳ Pending"}\n\n`;
    text += `Form 27Q due: ${lastQ.form27QDueDate}\n\n`;
    text += `Reply *report* to get the full TDS PDF for your CA.`;
    return text;
  }
}
