import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsappService } from "../shared/whatsapp.service";
import { IntentClassifierService } from "./agent/intent-classifier.service";
import { ToolExecutorService } from "./agent/tool-executor.service";
import { ConversationMemoryService } from "./memory/conversation-memory.service";

const RATE_LIMIT_MSG = "Aaj ka limit ho gaya. Kal phir try karo 🙏";
const ERROR_FALLBACK_MSG = "Kuch problem ho gayi. App mein dekho: domvio.in 🙏";
const REGISTRATION_MSG =
  "Aapka number Domvio mein registered nahi hai. App install karein: domvio.in";

const HELP_MSG = `*Domvio Bot* — Yeh commands kaam karte hain:

📊 *status* — Is mahine ka summary
👥 *tenants* — Sabke tenants ki list
🔴 *overdue* — Late tenants
🏠 *properties* — Aapki properties
🔧 *maintenance* — Open requests
💬 Ya seedha puchho: "Priya ne pay kiya?"`;

@Injectable()
export class WhatsappBotService {
  private readonly logger = new Logger(WhatsappBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly whatsapp: WhatsappService,
    private readonly classifier: IntentClassifierService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly memory: ConversationMemoryService,
  ) {}

  async handleIncoming(phone: string, message: string): Promise<void> {
    try {
      // 1. Resolve landlord identity
      const user = await this.resolveUser(phone);
      if (!user) {
        await this.whatsapp.sendBotReply(phone, REGISTRATION_MSG);
        return;
      }

      // 2. Ensure conversation record exists
      await this.memory.ensureRecord(phone, user.id);

      // 3. Rate limit check
      const rateLimitMax =
        this.configService.get<number>("WHATSAPP_BOT_RATE_LIMIT") ?? 50;
      if (await this.memory.isRateLimited(phone, rateLimitMax)) {
        await this.whatsapp.sendBotReply(phone, RATE_LIMIT_MSG);
        return;
      }

      // 4. Increment daily message count
      await this.memory.incrementMessageCount(phone);

      // 5. Check pending confirmation
      const pending = await this.memory.getPendingConfirmation(phone);
      if (pending) {
        const intent = await this.classifier.classify(message);

        if (intent.intent === "confirm_yes" && intent.confidence >= 0.8) {
          await this.memory.clearPendingConfirmation(phone);
          const result = await this.toolExecutor.executeConfirmed(
            pending.action,
            pending.params,
            user.id,
          );
          const reply = result.data ?? ERROR_FALLBACK_MSG;
          await this.send(phone, reply);
          await this.memory.appendMessage(phone, "user", message);
          await this.memory.appendMessage(phone, "assistant", reply);
          return;
        }

        if (intent.intent === "confirm_no" && intent.confidence >= 0.8) {
          await this.memory.clearPendingConfirmation(phone);
          const reply = "Ok, cancel kar diya ✅";
          await this.send(phone, reply);
          await this.memory.appendMessage(phone, "user", message);
          await this.memory.appendMessage(phone, "assistant", reply);
          return;
        }

        // Not a yes/no — clear pending and continue
        await this.memory.clearPendingConfirmation(phone);
      }

      // 6. Classify intent
      const classification = await this.classifier.classify(message);
      this.logger.log(
        `[Bot] ${phone} → intent=${classification.intent} conf=${classification.confidence}`,
      );

      // 7. Fast path — high confidence
      if (
        classification.confidence >= 0.85 &&
        classification.intent !== "unclear"
      ) {
        const reply = await this.handleFastPath(phone, user.id, classification);
        await this.send(phone, reply);
        await this.memory.appendMessage(phone, "user", message);
        await this.memory.appendMessage(phone, "assistant", reply);
        return;
      }

      // 8. Regex fallback for exact commands
      const regexReply = this.handleRegexCommand(message.trim().toLowerCase());
      if (regexReply !== null) {
        const result = await this.toolExecutor.execute(regexReply, {}, user.id);
        const reply = result.data ?? ERROR_FALLBACK_MSG;
        await this.send(phone, reply);
        await this.memory.appendMessage(phone, "user", message);
        await this.memory.appendMessage(phone, "assistant", reply);
        return;
      }

      // 9. Fallback — help menu
      await this.send(phone, HELP_MSG);
      await this.memory.appendMessage(phone, "user", message);
      await this.memory.appendMessage(phone, "assistant", HELP_MSG);
    } catch (e) {
      this.logger.error(`handleIncoming failed for ${phone}`, e);
      await this.whatsapp
        .sendBotReply(phone, ERROR_FALLBACK_MSG)
        .catch(() => {});
    }
  }

  // ─── FAST PATH ───────────────────────────────────────────────────────────

  private async handleFastPath(
    phone: string,
    landlordId: string,
    classification: { intent: string; entities: Record<string, string> },
  ): Promise<string> {
    const { intent, entities } = classification;

    const toolMap: Record<string, string> = {
      check_payment_status: "get_payment_status",
      get_monthly_summary: "get_monthly_summary",
      get_overdue_list: "get_overdue_list",
      list_tenants: "list_tenants",
      get_tenant_details: "get_tenant_details",
      list_maintenance: "list_maintenance",
      list_properties: "list_properties",
      get_monthly_report: "get_monthly_report",
    };

    // Confirmation-required intents
    if (intent === "send_reminder") {
      const result = await this.toolExecutor.execute(
        "send_reminder",
        {
          target: entities.target ?? "all",
          tenant_name: entities.tenant,
        },
        landlordId,
      );
      if (result.requiresConfirmation && result.message) {
        await this.memory.setPendingConfirmation(
          phone,
          result.action!,
          result.params!,
          result.message,
        );
        return result.message;
      }
      return result.data ?? ERROR_FALLBACK_MSG;
    }

    if (intent === "record_cash_payment") {
      const result = await this.toolExecutor.execute(
        "record_cash_payment",
        { tenant_name: entities.tenant },
        landlordId,
      );
      if (result.requiresConfirmation && result.message) {
        await this.memory.setPendingConfirmation(
          phone,
          result.action!,
          result.params!,
          result.message,
        );
        return result.message;
      }
      return result.data ?? ERROR_FALLBACK_MSG;
    }

    if (intent === "greeting") {
      return "Namaste! 🙏 Kaise help karein?\n\n" + HELP_MSG;
    }

    if (intent === "help") {
      return HELP_MSG;
    }

    const toolName = toolMap[intent];
    if (!toolName) return HELP_MSG;

    // Build input from entities
    const input: Record<string, string> = {};
    if (entities.tenant) input.tenant_name = entities.tenant;
    if (entities.property) input.property_name = entities.property;
    if (entities.month) input.month = entities.month;

    const result = await this.toolExecutor.execute(toolName, input, landlordId);
    return result.data ?? ERROR_FALLBACK_MSG;
  }

  // ─── REGEX FALLBACK ──────────────────────────────────────────────────────

  /** Maps exact keyword commands to tool names. Returns null if no match. */
  private handleRegexCommand(text: string): string | null {
    if (text === "status" || text === "summary") return "get_monthly_summary";
    if (text === "overdue") return "get_overdue_list";
    if (text === "tenants") return "list_tenants";
    if (text === "maintenance") return "list_maintenance";
    if (text === "properties") return "list_properties";
    if (text === "report") return "get_monthly_report";
    return null;
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async resolveUser(phone: string) {
    return this.prisma.user.findFirst({
      where: {
        phone: { endsWith: phone.slice(-10) },
        role: "LANDLORD",
      },
      select: { id: true, firstName: true, phone: true },
    });
  }

  private async send(phone: string, message: string): Promise<void> {
    await this.whatsapp.sendBotReply(phone, message);
  }
}
