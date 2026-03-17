import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface ConversationMemory {
  id: string;
  phone: string;
  landlordId: string;
  lastTenantMentioned: string | null;
  lastPropertyMentioned: string | null;
  recentMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  pendingConfirmationAction: string | null;
  pendingConfirmationParams: Record<string, unknown> | null;
  pendingConfirmationText: string | null;
  pendingConfirmationExpiry: Date | null;
  messageCountToday: number;
}

const MAX_RECENT_MESSAGES = 3;
const RATE_LIMIT_DEFAULT = 50;
const CONFIRMATION_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMemory(phone: string): Promise<ConversationMemory> {
    const record = await this.prisma.whatsappConversation.findUnique({
      where: { phone },
    });

    if (!record) {
      // Return empty shell — will be created on first write
      return {
        id: "",
        phone,
        landlordId: "",
        lastTenantMentioned: null,
        lastPropertyMentioned: null,
        recentMessages: [],
        pendingConfirmationAction: null,
        pendingConfirmationParams: null,
        pendingConfirmationText: null,
        pendingConfirmationExpiry: null,
        messageCountToday: 0,
      };
    }

    return {
      id: record.id,
      phone: record.phone,
      landlordId: record.landlordId,
      lastTenantMentioned: record.lastTenantMentioned,
      lastPropertyMentioned: record.lastPropertyMentioned,
      recentMessages:
        (record.recentMessages as ConversationMemory["recentMessages"]) ?? [],
      pendingConfirmationAction: record.pendingConfirmationAction,
      pendingConfirmationParams: record.pendingConfirmationParams as Record<
        string,
        unknown
      > | null,
      pendingConfirmationText: record.pendingConfirmationText,
      pendingConfirmationExpiry: record.pendingConfirmationExpiry,
      messageCountToday: record.messageCountToday,
    };
  }

  async ensureRecord(phone: string, landlordId: string): Promise<void> {
    await this.prisma.whatsappConversation.upsert({
      where: { phone },
      create: { phone, landlordId },
      update: {},
    });
  }

  async appendMessage(
    phone: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> {
    const existing = await this.getMemory(phone);
    const messages = [
      ...existing.recentMessages,
      { role, content, timestamp: new Date().toISOString() },
    ].slice(-MAX_RECENT_MESSAGES);

    await this.prisma.whatsappConversation.update({
      where: { phone },
      data: { recentMessages: messages },
    });
  }

  async setPendingConfirmation(
    phone: string,
    action: string,
    params: Record<string, unknown>,
    humanReadable: string,
  ): Promise<void> {
    await this.prisma.whatsappConversation.update({
      where: { phone },
      data: {
        pendingConfirmationAction: action,
        pendingConfirmationParams: params as any,
        pendingConfirmationText: humanReadable,
        pendingConfirmationExpiry: new Date(Date.now() + CONFIRMATION_TTL_MS),
      },
    });
  }

  async clearPendingConfirmation(phone: string): Promise<void> {
    await this.prisma.whatsappConversation.update({
      where: { phone },
      data: {
        pendingConfirmationAction: null,
        pendingConfirmationParams: null,
        pendingConfirmationText: null,
        pendingConfirmationExpiry: null,
      },
    });
  }

  async getPendingConfirmation(phone: string): Promise<{
    action: string;
    params: Record<string, unknown>;
    humanReadable: string;
  } | null> {
    const memory = await this.getMemory(phone);
    if (
      !memory.pendingConfirmationAction ||
      !memory.pendingConfirmationExpiry ||
      new Date() > memory.pendingConfirmationExpiry
    ) {
      if (memory.pendingConfirmationAction) {
        // Expired — clean up
        await this.clearPendingConfirmation(phone).catch(() => {});
      }
      return null;
    }

    return {
      action: memory.pendingConfirmationAction,
      params: memory.pendingConfirmationParams ?? {},
      humanReadable: memory.pendingConfirmationText ?? "",
    };
  }

  async isRateLimited(phone: string, limit?: number): Promise<boolean> {
    const memory = await this.getMemory(phone);
    const maxMessages = limit ?? RATE_LIMIT_DEFAULT;

    // Reset daily count if it's a new day
    const resetAt = memory.pendingConfirmationExpiry
      ? new Date(memory.pendingConfirmationExpiry)
      : new Date(0);

    const record = await this.prisma.whatsappConversation.findUnique({
      where: { phone },
      select: { messageCountResetAt: true, messageCountToday: true },
    });

    if (record) {
      const lastReset = record.messageCountResetAt;
      const now = new Date();
      const isSameDay =
        lastReset.getFullYear() === now.getFullYear() &&
        lastReset.getMonth() === now.getMonth() &&
        lastReset.getDate() === now.getDate();

      if (!isSameDay) {
        // Reset count for new day
        await this.prisma.whatsappConversation.update({
          where: { phone },
          data: { messageCountToday: 0, messageCountResetAt: now },
        });
        return false;
      }

      return record.messageCountToday >= maxMessages;
    }

    return false;
  }

  async incrementMessageCount(phone: string): Promise<void> {
    await this.prisma.whatsappConversation.update({
      where: { phone },
      data: { messageCountToday: { increment: 1 } },
    });
  }

  async updateMentioned(
    phone: string,
    tenantName?: string,
    propertyName?: string,
  ): Promise<void> {
    await this.prisma.whatsappConversation.update({
      where: { phone },
      data: {
        ...(tenantName ? { lastTenantMentioned: tenantName } : {}),
        ...(propertyName ? { lastPropertyMentioned: propertyName } : {}),
      },
    });
  }
}
