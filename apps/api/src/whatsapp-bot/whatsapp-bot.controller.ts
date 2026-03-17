import { Controller, Post, Get, Body, Query, Logger } from "@nestjs/common";
import { Public } from "../common/auth/public.decorator";
import { WhatsappBotService } from "./whatsapp-bot.service";

@Controller("whatsapp")
export class WhatsappBotController {
  private readonly logger = new Logger(WhatsappBotController.name);

  constructor(private readonly botService: WhatsappBotService) {}

  /** Webhook verification (GET) */
  @Public()
  @Get("webhook")
  verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    const verifyToken =
      process.env.WHATSAPP_BOT_VERIFY_TOKEN || "domvio-bot-verify";
    if (mode === "subscribe" && token === verifyToken) {
      return challenge;
    }
    return { error: "Verification failed" };
  }

  /** Incoming message webhook (POST) */
  @Public()
  @Post("webhook")
  async handleWebhook(@Body() payload: any) {
    if (payload?.type !== "whatsapp") return { received: true };

    const messageType = payload?.data?.message?.type;
    const fromPhone = payload?.data?.message?.from;

    if (!fromPhone || messageType !== "text") {
      return { success: false, reason: "Unsupported message type" };
    }

    const text = payload.data.message.text?.body?.toString()?.trim() ?? "";
    if (!text) return { success: false, reason: "Empty message" };

    // Fire-and-forget — webhook must respond quickly
    this.botService.handleIncoming(fromPhone, text).catch((e) => {
      this.logger.error(`Bot handleIncoming failed for ${fromPhone}`, e);
    });

    return { received: true };
  }
}
