import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { CashfreeService } from "./cashfree.service";

describe("CashfreeService", () => {
  const configValues: Record<string, string> = {
    CASHFREE_CLIENT_ID: "test_client_id",
    CASHFREE_CLIENT_SECRET: "test_client_secret",
    CASHFREE_WEBHOOK_SECRET: "test_webhook_secret",
    CASHFREE_ENVIRONMENT: "sandbox",
    CASHFREE_API_VERSION: "2025-01-01",
  };

  const configService = {
    get: (key: string) => configValues[key],
  } as unknown as ConfigService;

  const service = new CashfreeService(configService);

  it("reports configured when client credentials are set", () => {
    expect(service.isConfigured()).toBe(true);
  });

  it("verifies webhook signature using timestamp + raw body", () => {
    const rawBody = Buffer.from(JSON.stringify({ test: true }));
    const timestamp = "1729981812";
    const signature = createHmac("sha256", configValues.CASHFREE_WEBHOOK_SECRET)
      .update(`${timestamp}${rawBody.toString("utf8")}`, "utf8")
      .digest("base64");

    expect(
      service.verifyWebhookSignature({
        rawBody,
        timestampHeader: timestamp,
        signatureHeader: signature,
      }),
    ).toBe(true);
  });

  it("rejects webhook signature mismatch", () => {
    const rawBody = Buffer.from(JSON.stringify({ test: true }));
    const timestamp = "1729981812";

    expect(
      service.verifyWebhookSignature({
        rawBody,
        timestampHeader: timestamp,
        signatureHeader: "invalid_signature",
      }),
    ).toBe(false);
  });
});
