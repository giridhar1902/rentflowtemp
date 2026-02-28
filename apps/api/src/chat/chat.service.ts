import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MessageType,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ListChatMessagesDto } from "./dto/list-chat-messages.dto";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listThreads(user: RequestUser) {
    const where: Prisma.ChatThreadWhereInput =
      user.role === UserRole.ADMIN
        ? {}
        : {
            participants: {
              some: {
                userId: user.id,
              },
            },
          };

    return this.prisma.chatThread.findMany({
      where,
      include: chatThreadInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  async ensureLeaseThread(user: RequestUser, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException("Lease not found");
    }

    this.assertCanAccessLease(user, lease.landlordId, lease.tenantId);

    const participantIds = Array.from(
      new Set([lease.landlordId, lease.tenantId, user.id]),
    );

    const thread = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.chatThread.findFirst({
        where: { leaseId: lease.id },
        select: { id: true },
      });

      const threadId = existing
        ? existing.id
        : (
            await tx.chatThread.create({
              data: {
                leaseId: lease.id,
                propertyId: lease.propertyId,
                title: `${lease.property.name} • ${lease.unit.name}`,
              },
              select: { id: true },
            })
          ).id;

      await tx.chatThreadParticipant.createMany({
        data: participantIds.map((participantId) => ({
          threadId,
          userId: participantId,
        })),
        skipDuplicates: true,
      });

      return tx.chatThread.findUnique({
        where: { id: threadId },
        include: chatThreadInclude,
      });
    });

    if (!thread) {
      throw new NotFoundException("Thread could not be created");
    }

    return thread;
  }

  async getThreadById(user: RequestUser, threadId: string) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: chatThreadInclude,
    });

    if (!thread) {
      throw new NotFoundException("Chat thread not found");
    }

    this.assertCanAccessThread(user, thread);
    return thread;
  }

  async listMessages(
    user: RequestUser,
    threadId: string,
    query: ListChatMessagesDto,
  ) {
    await this.getThreadById(user, threadId);

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        threadId,
        ...(query.since ? { createdAt: { gt: new Date(query.since) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: query.limit ?? 100,
    });

    return messages;
  }

  async sendMessage(
    user: RequestUser,
    threadId: string,
    payload: SendChatMessageDto,
  ) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
        lease: {
          select: {
            id: true,
            property: {
              select: {
                name: true,
              },
            },
            unit: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException("Chat thread not found");
    }

    const participantSet = new Set(
      thread.participants.map((item) => item.userId),
    );

    if (!participantSet.has(user.id) && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("You are not a participant in this thread");
    }

    const messageType = payload.messageType ?? MessageType.TEXT;
    const content = payload.content.trim();

    const message = await this.prisma.$transaction(async (tx) => {
      if (!participantSet.has(user.id)) {
        await tx.chatThreadParticipant.create({
          data: {
            threadId,
            userId: user.id,
          },
        });
      }

      const created = await tx.chatMessage.create({
        data: {
          threadId,
          senderId: user.id,
          messageType,
          content,
          metadata: payload.metadata as Prisma.InputJsonValue | undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.chatThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "CHAT_THREAD",
          entityId: threadId,
          action: "CHAT_MESSAGE_SENT",
          metadata: {
            messageId: created.id,
            messageType,
          },
        },
      });

      return created;
    });

    const recipients = Array.from(participantSet).filter(
      (participantId) => participantId !== user.id,
    );

    await this.notificationsService.createInAppNotifications({
      userIds: recipients,
      type: NotificationType.CHAT_MESSAGE,
      title: "New chat message",
      body: content.slice(0, 120),
      data: {
        threadId,
        messageId: message.id,
        leaseId: thread.lease?.id,
      },
    });

    return message;
  }

  private assertCanAccessLease(
    user: RequestUser,
    landlordId: string,
    tenantId: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.LANDLORD && landlordId === user.id) {
      return;
    }

    if (user.role === UserRole.TENANT && tenantId === user.id) {
      return;
    }

    throw new ForbiddenException("You do not have access to this lease thread");
  }

  private assertCanAccessThread(
    user: RequestUser,
    thread: {
      participants: Array<{ userId: string }>;
    },
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const participantSet = new Set(
      thread.participants.map((item) => item.userId),
    );
    if (!participantSet.has(user.id)) {
      throw new ForbiddenException(
        "You do not have access to this chat thread",
      );
    }
  }
}

const chatThreadInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  },
  lease: {
    select: {
      id: true,
      property: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
        },
      },
      landlord: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} satisfies Prisma.ChatThreadInclude;
