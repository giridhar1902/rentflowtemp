import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendRentReminder(
    phone: string,
    tenantName: string,
    propertyName: string,
    amount: number,
    dueDate: string,
    paymentLink: string,
  ) {
    const interaktKey = this.configService.get<string>("INTERAKT_API_KEY");
    if (!interaktKey) {
      this.logger.warn(
        `INTERAKT_API_KEY not set. Stubbed WhatsApp Rent Reminder for ${tenantName} to +91${phone}: Due ${dueDate}, Link: ${paymentLink}`,
      );
      return;
    }

    try {
      const response = await fetch(
        "https://api.interakt.ai/v1/public/message/",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(interaktKey).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            countryCode: "+91",
            phoneNumber: phone,
            callbackData: "rent_reminder",
            type: "Template",
            template: {
              name: "rent_reminder_v1",
              languageCode: "en",
              bodyValues: [
                tenantName,
                propertyName,
                amount.toString(),
                dueDate,
                paymentLink,
              ],
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Interakt API Error: ${response.status} ${await response.text()}`,
        );
      }
      this.logger.log(`Sent rent reminder to +91${phone}`);
    } catch (e) {
      this.logger.error(`Failed to send rent reminder to +91${phone}`, e);
    }
  }

  async sendReceiptConfirmation(
    phone: string,
    tenantName: string,
    propertyName: string,
    amount: number,
    paidDate: string,
    receiptUrl: string,
  ) {
    const interaktKey = this.configService.get<string>("INTERAKT_API_KEY");
    if (!interaktKey) {
      this.logger.warn(
        `INTERAKT_API_KEY not set. Stubbed WhatsApp Receipt for ${tenantName} to +91${phone}: Paid ${paidDate}, Receipt: ${receiptUrl}`,
      );
      return;
    }

    try {
      const response = await fetch(
        "https://api.interakt.ai/v1/public/message/",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(interaktKey).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            countryCode: "+91",
            phoneNumber: phone,
            callbackData: "rent_receipt",
            type: "Template",
            template: {
              name: "rent_receipt_v1",
              languageCode: "en",
              bodyValues: [
                tenantName,
                amount.toString(),
                propertyName,
                paidDate,
                receiptUrl,
              ],
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Interakt API Error: ${response.status} ${await response.text()}`,
        );
      }
      this.logger.log(`Sent receipt to +91${phone}`);
    } catch (e) {
      this.logger.error(`Failed to send receipt to +91${phone}`, e);
    }
  }

  async sendCustomMessage(phone: string, text: string) {
    const interaktKey = this.configService.get<string>("INTERAKT_API_KEY");
    if (!interaktKey) {
      this.logger.warn(
        `INTERAKT_API_KEY not set. Stubbed WhatsApp Custom Message to +91${phone}:\n${text}`,
      );
      return;
    }

    try {
      this.logger.log(
        `[Interakt] Sending custom message to +91${phone}:\n${text}`,
      );
      // In production, we would map to a generic alert template if outside 24h window
    } catch (e) {
      this.logger.error(`Failed to send custom message to +91${phone}`, e);
    }
  }
}
