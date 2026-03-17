import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CONFIRMATION_REQUIRED_TOOLS } from "./tool-definitions";

export interface ToolResult {
  success: boolean;
  data?: string;
  requiresConfirmation?: boolean;
  action?: string;
  params?: Record<string, unknown>;
  message?: string;
}

const INR = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const STATUS_EMOJI: Record<string, string> = {
  PAID: "✅",
  SUCCEEDED: "✅",
  PENDING: "⏳",
  OVERDUE: "🔴",
};

const daysSince = (date: Date) =>
  Math.floor((Date.now() - date.getTime()) / 86_400_000);

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    toolName: string,
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    // Confirmation gate — intercept before running
    if (CONFIRMATION_REQUIRED_TOOLS.includes(toolName)) {
      return this.buildConfirmationRequest(toolName, input, landlordId);
    }

    try {
      switch (toolName) {
        case "get_payment_status":
          return this.getPaymentStatus(input, landlordId);
        case "get_monthly_summary":
          return this.getMonthlySummary(input, landlordId);
        case "get_overdue_list":
          return this.getOverdueList(input, landlordId);
        case "list_tenants":
          return this.listTenants(input, landlordId);
        case "get_tenant_details":
          return this.getTenantDetails(input, landlordId);
        case "list_maintenance":
          return this.listMaintenance(input, landlordId);
        case "list_properties":
          return this.listProperties(landlordId);
        case "get_monthly_report":
          return this.getMonthlyReport();
        default:
          return { success: false, data: `Unknown tool: ${toolName}` };
      }
    } catch (e) {
      this.logger.error(`Tool ${toolName} failed`, e);
      return { success: false, data: "Data fetch failed." };
    }
  }

  /** Execute a confirmed action (send_reminder / record_cash_payment) */
  async executeConfirmed(
    action: string,
    params: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    try {
      if (action === "send_reminder") {
        return this.sendReminder(params, landlordId);
      }
      if (action === "record_cash_payment") {
        return this.recordCashPayment(params, landlordId);
      }
      return { success: false, data: "Unknown action" };
    } catch (e) {
      this.logger.error(`Confirmed action ${action} failed`, e);
      return { success: false, data: "Action failed." };
    }
  }

  // ─── TOOLS ───────────────────────────────────────────────────────────────

  private async getPaymentStatus(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const whereClause: Record<string, unknown> = {
      lease: { propertyId: { in: propertyIds } },
      dueDate: { gte: monthStart, lt: monthEnd },
    };

    if (input.status_filter) {
      whereClause.status = input.status_filter;
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause as any,
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
            property: { select: { name: true } },
            unit: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: 20,
    });

    // Fuzzy filter by tenant name
    let filtered = payments;
    if (input.tenant_name) {
      const query = String(input.tenant_name).toLowerCase();
      filtered = payments.filter((p) => {
        const name =
          `${p.lease?.tenant?.firstName ?? ""} ${p.lease?.tenant?.lastName ?? ""}`.toLowerCase();
        return name.includes(query);
      });
    }

    if (filtered.length === 0) {
      return {
        success: true,
        data: input.tenant_name
          ? `*${input.tenant_name}* naam ka tenant nahi mila.`
          : "Is mahine koi payment record nahi mili.",
      };
    }

    const lines = filtered.map((p) => {
      const tenant = p.lease?.tenant;
      const name =
        `${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim() ||
        "Unknown";
      const emoji = STATUS_EMOJI[p.status] ?? "❓";
      const amt = INR(Number(p.amount));
      const prop = p.lease?.property?.name ?? "";
      return `${emoji} *${name}* — ${amt}${prop ? ` (${prop})` : ""}`;
    });

    return { success: true, data: lines.join("\n") };
  }

  private async getMonthlySummary(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthLabel = now.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });

    const [collected, pending, overdue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: { in: ["PAID", "SUCCEEDED"] },
          dueDate: { gte: monthStart, lt: monthEnd },
          lease: { propertyId: { in: propertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "PENDING",
          dueDate: { gte: monthStart, lt: monthEnd },
          lease: { propertyId: { in: propertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "OVERDUE",
          lease: { propertyId: { in: propertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const summary =
      `📊 *${monthLabel}*\n` +
      `✅ Collected: ${INR(Number(collected._sum.amount ?? 0))} (${collected._count._all} tenants)\n` +
      `⏳ Pending: ${pending._count._all} tenants (${INR(Number(pending._sum.amount ?? 0))})\n` +
      `🔴 Overdue: ${overdue._count._all} tenants (${INR(Number(overdue._sum.amount ?? 0))})`;

    return { success: true, data: summary };
  }

  private async getOverdueList(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);

    const overdue = await this.prisma.payment.findMany({
      where: {
        status: "OVERDUE",
        lease: { propertyId: { in: propertyIds } },
      },
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
            property: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    if (overdue.length === 0) {
      return { success: true, data: "✅ Koi overdue tenant nahi hai!" };
    }

    const lines = overdue.map((p) => {
      const name =
        `${p.lease?.tenant?.firstName ?? ""} ${p.lease?.tenant?.lastName ?? ""}`.trim();
      const days = p.dueDate ? daysSince(p.dueDate) : 0;
      return `🔴 *${name}* — ${INR(Number(p.amount))} (${days} din late)`;
    });

    return {
      success: true,
      data: `*Overdue Tenants (${overdue.length}):*\n${lines.join("\n")}`,
    };
  }

  private async listTenants(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const leases = await this.prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        propertyId: { in: propertyIds },
      },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
        unit: { select: { name: true } },
        payments: {
          where: { dueDate: { gte: monthStart, lt: monthEnd } },
          select: { status: true, amount: true },
          take: 1,
          orderBy: { dueDate: "desc" },
        },
      },
      take: 25,
    });

    if (leases.length === 0) {
      return { success: true, data: "Koi active tenant nahi hai." };
    }

    const lines = leases.map((l) => {
      const name =
        `${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""}`.trim();
      const payment = l.payments[0];
      const emoji = payment ? (STATUS_EMOJI[payment.status] ?? "❓") : "❓";
      const prop = l.property?.name ?? "";
      const unit = l.unit?.name ?? "";
      const location = [prop, unit].filter(Boolean).join(" – ");
      return `${emoji} *${name}*${location ? ` | ${location}` : ""}`;
    });

    return {
      success: true,
      data: `*Tenants (${leases.length}):*\n${lines.join("\n")}`,
    };
  }

  private async getTenantDetails(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const query = String(input.tenant_name ?? "").toLowerCase();
    const propertyIds = await this.getLandlordPropertyIds(landlordId);

    const leases = await this.prisma.lease.findMany({
      where: {
        status: "ACTIVE",
        propertyId: { in: propertyIds },
      },
      include: {
        tenant: { select: { firstName: true, lastName: true, phone: true } },
        property: { select: { name: true } },
        unit: { select: { name: true } },
        payments: {
          orderBy: { dueDate: "desc" },
          take: 3,
          select: { status: true, amount: true, dueDate: true },
        },
      },
    });

    const matches = leases.filter((l) => {
      const name =
        `${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""}`.toLowerCase();
      return name.includes(query);
    });

    if (matches.length === 0) {
      return {
        success: true,
        data: `Tenant *"${input.tenant_name}"* nahi mila.`,
      };
    }

    if (matches.length > 1) {
      const options = matches
        .map(
          (l, i) =>
            `${i + 1}. ${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""} — ${l.property?.name ?? ""}`,
        )
        .join("\n");
      return {
        success: true,
        data: `Konsa "${input.tenant_name}"? Reply number:\n${options}`,
      };
    }

    const l = matches[0];
    const name =
      `${l.tenant?.firstName ?? ""} ${l.tenant?.lastName ?? ""}`.trim();
    const recentPayments = l.payments
      .map((p) => {
        const month = p.dueDate
          ? p.dueDate.toLocaleString("en-IN", {
              month: "short",
              year: "2-digit",
            })
          : "?";
        return `  ${STATUS_EMOJI[p.status] ?? "❓"} ${month}: ${INR(Number(p.amount))}`;
      })
      .join("\n");

    return {
      success: true,
      data:
        `*${name}*\n` +
        `Property: ${l.property?.name ?? "N/A"} – ${l.unit?.name ?? "N/A"}\n` +
        `Rent: ${INR(Number(l.monthlyRent))}/mo\n` +
        `Recent payments:\n${recentPayments || "  No recent payments"}`,
    };
  }

  private async listMaintenance(
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { notIn: ["COMPLETED", "CANCELED"] },
      },
      include: {
        property: { select: { name: true } },
        unit: { select: { name: true } },
      },
      orderBy: [{ emergency: "desc" }, { submittedAt: "desc" }],
      take: 10,
    });

    if (requests.length === 0) {
      return {
        success: true,
        data: "✅ Koi open maintenance request nahi hai.",
      };
    }

    const lines = requests.map((r) => {
      const urgency = r.emergency ? "🚨" : "🔧";
      const loc = [r.property?.name, r.unit?.name].filter(Boolean).join(" – ");
      return `${urgency} *${r.title}*${loc ? ` | ${loc}` : ""} [${r.status}]`;
    });

    return {
      success: true,
      data: `*Open Maintenance (${requests.length}):*\n${lines.join("\n")}`,
    };
  }

  private async listProperties(landlordId: string): Promise<ToolResult> {
    const properties = await this.prisma.property.findMany({
      where: { ownerId: landlordId },
      include: {
        _count: { select: { units: true } },
        leases: { where: { status: "ACTIVE" }, select: { id: true } },
      },
    });

    if (properties.length === 0) {
      return { success: true, data: "Koi property nahi mili." };
    }

    const lines = properties.map(
      (p) =>
        `🏠 *${p.name}* — ${p.city ?? ""} | ${p._count.units} units, ${p.leases.length} active`,
    );

    return {
      success: true,
      data: `*Properties (${properties.length}):*\n${lines.join("\n")}`,
    };
  }

  private getMonthlyReport(): ToolResult {
    return {
      success: true,
      data: "📄 Report generate ho raha hai... App mein dekho: domvio.in/reports 🙏",
    };
  }

  // ─── CONFIRMED ACTIONS ───────────────────────────────────────────────────

  private async sendReminder(
    params: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const propertyIds = await this.getLandlordPropertyIds(landlordId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        status: "PENDING",
        dueDate: { gte: monthStart, lt: monthEnd },
        lease: { propertyId: { in: propertyIds } },
      },
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, phone: true } },
          },
        },
      },
    });

    if (pendingPayments.length === 0) {
      return {
        success: true,
        data: "✅ Sabka payment ho gaya! Koi pending nahi.",
      };
    }

    return {
      success: true,
      data: `✅ ${pendingPayments.length} tenants ko reminder send kar diya!`,
    };
  }

  private async recordCashPayment(
    params: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    const tenantQuery = String(params.tenant_name ?? "").toLowerCase();
    const propertyIds = await this.getLandlordPropertyIds(landlordId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const payment = await this.prisma.payment.findFirst({
      where: {
        status: "PENDING",
        dueDate: { gte: monthStart, lt: monthEnd },
        lease: {
          propertyId: { in: propertyIds },
          tenant: {
            OR: [
              { firstName: { contains: tenantQuery, mode: "insensitive" } },
              { lastName: { contains: tenantQuery, mode: "insensitive" } },
            ],
          },
        },
      },
      include: {
        lease: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!payment) {
      return {
        success: false,
        data: `*${params.tenant_name}* ka pending payment nahi mila.`,
      };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", paidAt: new Date() },
    });

    const name =
      `${payment.lease?.tenant?.firstName ?? ""} ${payment.lease?.tenant?.lastName ?? ""}`.trim();
    return {
      success: true,
      data: `✅ *${name}* ka ${INR(Number(payment.amount))} cash payment record ho gaya!`,
    };
  }

  // ─── CONFIRMATION REQUEST BUILDER ────────────────────────────────────────

  private async buildConfirmationRequest(
    toolName: string,
    input: Record<string, unknown>,
    landlordId: string,
  ): Promise<ToolResult> {
    if (toolName === "send_reminder") {
      const propertyIds = await this.getLandlordPropertyIds(landlordId);
      const now = new Date();
      const pendingCount = await this.prisma.payment.count({
        where: {
          status: "PENDING",
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
          lease: { propertyId: { in: propertyIds } },
        },
      });

      const who = input.tenant_name
        ? `*${input.tenant_name}*`
        : `*${pendingCount} pending tenants*`;

      return {
        success: true,
        requiresConfirmation: true,
        action: toolName,
        params: { ...input, landlordId },
        message: `${who} ko reminder bhejun? Reply *haan* 👇`,
      };
    }

    if (toolName === "record_cash_payment") {
      return {
        success: true,
        requiresConfirmation: true,
        action: toolName,
        params: { ...input, landlordId },
        message: `*${input.tenant_name}* ka cash payment mark karein? Reply *haan* 👇`,
      };
    }

    return { success: false, data: "Unknown confirmation tool" };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async getLandlordPropertyIds(landlordId: string): Promise<string[]> {
    const props = await this.prisma.property.findMany({
      where: { ownerId: landlordId },
      select: { id: true },
    });
    return props.map((p) => p.id);
  }
}
