import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

export interface ClassificationResult {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  language: "english" | "hindi" | "kannada" | "mixed";
}

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for Domvio, an Indian property management app. Landlords message in English, Hindi, Kannada, Telugu, and mixed languages (Hinglish).

Classify the message and return ONLY valid JSON. No explanation. No preamble. Just JSON.

Intents:
check_payment_status, send_reminder, record_cash_payment,
get_monthly_summary, get_overdue_list, get_tenant_details,
list_tenants, list_maintenance, get_monthly_report,
list_properties, help, greeting, confirm_yes, confirm_no, unclear

Examples:
"status" → {"intent":"get_monthly_summary","entities":{},"confidence":0.99,"language":"english"}
"Priya ne pay kiya?" → {"intent":"check_payment_status","entities":{"tenant":"Priya"},"confidence":0.96,"language":"hindi"}
"remind kar do sabko" → {"intent":"send_reminder","entities":{"target":"all"},"confidence":0.97,"language":"hindi"}
"elli payment aagide?" → {"intent":"get_monthly_summary","entities":{},"confidence":0.91,"language":"kannada"}
"paid rahul" → {"intent":"record_cash_payment","entities":{"tenant":"Rahul"},"confidence":0.95,"language":"english"}
"remind all" → {"intent":"send_reminder","entities":{"target":"all"},"confidence":0.97,"language":"english"}
"haan" → {"intent":"confirm_yes","entities":{},"confidence":0.99,"language":"hindi"}
"nahi" → {"intent":"confirm_no","entities":{},"confidence":0.99,"language":"hindi"}
"yes" → {"intent":"confirm_yes","entities":{},"confidence":0.99,"language":"english"}
"no" → {"intent":"confirm_no","entities":{},"confidence":0.99,"language":"english"}
"hello" → {"intent":"greeting","entities":{},"confidence":0.99,"language":"english"}
"tenants" → {"intent":"list_tenants","entities":{},"confidence":0.97,"language":"english"}
"overdue" → {"intent":"get_overdue_list","entities":{},"confidence":0.97,"language":"english"}`;

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);
  private anthropic: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("ANTHROPIC_API_KEY");
    if (apiKey && apiKey !== "your_key_here") {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.logger.warn(
        "ANTHROPIC_API_KEY not set — classifier running in stub mode",
      );
    }
  }

  async classify(message: string): Promise<ClassificationResult> {
    if (!this.anthropic) {
      return this.stubClassify(message);
    }

    const model =
      this.configService.get<string>("CLAUDE_CLASSIFIER_MODEL") ||
      "claude-haiku-4-5-20251001";

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 150,
        system: CLASSIFIER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "{}";
      const parsed = JSON.parse(text.trim()) as ClassificationResult;
      return parsed;
    } catch (e) {
      this.logger.error("Classifier error", e);
      return {
        intent: "unclear",
        entities: {},
        confidence: 0,
        language: "english",
      };
    }
  }

  /** Rule-based fallback used when API key is absent */
  private stubClassify(message: string): ClassificationResult {
    const text = message.trim().toLowerCase();

    if (text === "status" || text === "summary")
      return {
        intent: "get_monthly_summary",
        entities: {},
        confidence: 0.99,
        language: "english",
      };
    if (text === "overdue")
      return {
        intent: "get_overdue_list",
        entities: {},
        confidence: 0.97,
        language: "english",
      };
    if (text === "tenants" || text === "list tenants")
      return {
        intent: "list_tenants",
        entities: {},
        confidence: 0.97,
        language: "english",
      };
    if (text === "maintenance")
      return {
        intent: "list_maintenance",
        entities: {},
        confidence: 0.97,
        language: "english",
      };
    if (text === "remind all" || text === "remind kar do sabko")
      return {
        intent: "send_reminder",
        entities: { target: "all" },
        confidence: 0.97,
        language: text.includes("kar") ? "hindi" : "english",
      };
    if (text === "haan" || text === "yes" || text === "ok")
      return {
        intent: "confirm_yes",
        entities: {},
        confidence: 0.99,
        language: text === "haan" ? "hindi" : "english",
      };
    if (text === "nahi" || text === "no" || text === "cancel")
      return {
        intent: "confirm_no",
        entities: {},
        confidence: 0.99,
        language: text === "nahi" ? "hindi" : "english",
      };
    if (text === "hello" || text === "hi")
      return {
        intent: "greeting",
        entities: {},
        confidence: 0.99,
        language: "english",
      };
    if (text === "help")
      return {
        intent: "help",
        entities: {},
        confidence: 0.99,
        language: "english",
      };

    const paidMatch = text.match(/^paid\s+(.+)$/);
    if (paidMatch)
      return {
        intent: "record_cash_payment",
        entities: { tenant: paidMatch[1] },
        confidence: 0.95,
        language: "english",
      };

    const remindMatch = text.match(/^remind\s+(.+)$/);
    if (remindMatch)
      return {
        intent: "send_reminder",
        entities: {
          target: remindMatch[1] === "all" ? "all" : "one",
          tenant: remindMatch[1] !== "all" ? remindMatch[1] : "",
        },
        confidence: 0.92,
        language: "english",
      };

    return {
      intent: "unclear",
      entities: {},
      confidence: 0.1,
      language: "english",
    };
  }
}
