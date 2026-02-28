import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

type CashfreeCreateOrderInput = {
  orderId: string;
  orderAmount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl?: string;
  notifyUrl?: string;
};

export type CashfreeCreateOrderResponse = {
  cf_order_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id: string;
};

export type CashfreeOrderPayment = {
  cf_payment_id: string;
  payment_status: string;
  payment_amount: number;
  payment_time?: string;
  payment_message?: string;
  payment_method?: Record<string, unknown>;
  payment_group?: string;
};

type CashfreeOrder = {
  order_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
  payment_session_id?: string;
};

@Injectable()
export class CashfreeService {
  constructor(private readonly configService: ConfigService) {}

  getCheckoutMode(): "sandbox" | "production" {
    return this.getEnvironment();
  }

  getReturnUrlBase(): string | undefined {
    return this.configService.get<string>("CASHFREE_RETURN_URL")?.trim();
  }

  getNotifyUrl(): string | undefined {
    return this.configService.get<string>("CASHFREE_NOTIFY_URL")?.trim();
  }

  isConfigured(): boolean {
    return Boolean(this.clientId() && this.clientSecret());
  }

  async createOrder(
    input: CashfreeCreateOrderInput,
  ): Promise<CashfreeCreateOrderResponse> {
    const payload: Record<string, unknown> = {
      order_id: input.orderId,
      order_amount: input.orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
    };

    const meta: Record<string, string> = {};
    if (input.returnUrl) {
      meta.return_url = input.returnUrl;
    }
    if (input.notifyUrl) {
      meta.notify_url = input.notifyUrl;
    }
    if (Object.keys(meta).length > 0) {
      payload.order_meta = meta;
    }

    return this.request<CashfreeCreateOrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchOrder(orderId: string): Promise<CashfreeOrder> {
    return this.request<CashfreeOrder>(
      `/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
      },
    );
  }

  async fetchOrderPayments(orderId: string): Promise<CashfreeOrderPayment[]> {
    return this.request<CashfreeOrderPayment[]>(
      `/orders/${encodeURIComponent(orderId)}/payments`,
      {
        method: "GET",
      },
    );
  }

  verifyWebhookSignature(input: {
    rawBody: Buffer | string | undefined;
    timestampHeader: string | undefined;
    signatureHeader: string | undefined;
  }): boolean {
    const webhookSecret = this.webhookSecret();
    if (!webhookSecret) {
      throw new InternalServerErrorException(
        "CASHFREE_WEBHOOK_SECRET is not configured",
      );
    }

    if (!input.rawBody || !input.timestampHeader || !input.signatureHeader) {
      return false;
    }

    const raw =
      typeof input.rawBody === "string"
        ? input.rawBody
        : input.rawBody.toString("utf8");
    const digest = createHmac("sha256", webhookSecret)
      .update(`${input.timestampHeader}${raw}`, "utf8")
      .digest("base64");

    const incoming = input.signatureHeader.trim();
    const left = Buffer.from(digest);
    const right = Buffer.from(incoming);
    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const clientId = this.clientId();
    const clientSecret = this.clientSecret();
    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        "Cashfree credentials are not configured",
      );
    }

    const response = await fetch(`${this.baseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": this.apiVersion(),
        ...(init.headers ?? {}),
      },
    });

    const raw = await response.text();
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    if (!response.ok) {
      throw new BadRequestException({
        message: "Cashfree API request failed",
        statusCode: response.status,
        response: parsed,
      });
    }

    return parsed as T;
  }

  private baseUrl(): string {
    const fromEnv = this.configService
      .get<string>("CASHFREE_API_BASE_URL")
      ?.trim();
    if (fromEnv) {
      return fromEnv.replace(/\/$/, "");
    }

    if (this.getEnvironment() === "production") {
      return "https://api.cashfree.com/pg";
    }
    return "https://sandbox.cashfree.com/pg";
  }

  private getEnvironment(): "sandbox" | "production" {
    const configured = this.configService
      .get<string>("CASHFREE_ENVIRONMENT")
      ?.trim()
      .toLowerCase();
    return configured === "production" ? "production" : "sandbox";
  }

  private apiVersion(): string {
    return (
      this.configService.get<string>("CASHFREE_API_VERSION")?.trim() ??
      "2025-01-01"
    );
  }

  private webhookSecret(): string | undefined {
    return (
      this.configService.get<string>("CASHFREE_WEBHOOK_SECRET")?.trim() ??
      this.clientSecret()
    );
  }

  private clientId(): string | undefined {
    return this.configService.get<string>("CASHFREE_CLIENT_ID")?.trim();
  }

  private clientSecret(): string | undefined {
    return this.configService.get<string>("CASHFREE_CLIENT_SECRET")?.trim();
  }
}
