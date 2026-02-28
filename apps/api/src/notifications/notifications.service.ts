import { Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationChannel,
  NotificationType,
  Prisma,
  PushPlatform,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { PrismaService } from "../prisma/prisma.service";
import { ListNotificationsDto } from "./dto/list-notifications.dto";
import { RegisterPushDeviceDto } from "./dto/register-push-device.dto";

type CreateInAppNotificationInput = {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
  channel?: NotificationChannel;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInAppNotifications(input: CreateInAppNotificationInput) {
    const uniqueUserIds = Array.from(
      new Set(
        input.userIds
          .map((userId) => userId.trim())
          .filter((userId) => userId.length > 0),
      ),
    );

    if (uniqueUserIds.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type: input.type,
        channel: input.channel ?? NotificationChannel.IN_APP,
        title: input.title.trim(),
        body: input.body.trim(),
        data: input.data,
      })),
    });
  }

  async listNotifications(user: RequestUser, query: ListNotificationsDto) {
    return this.prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(query.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: query.limit ?? 50,
    });
  }

  async markRead(user: RequestUser, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllRead(user: RequestUser) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async listPushDevices(user: RequestUser) {
    return this.prisma.pushDevice.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async registerPushDevice(user: RequestUser, payload: RegisterPushDeviceDto) {
    const token = payload.token.trim();
    const data = {
      userId: user.id,
      platform: payload.platform,
      token,
      deviceName: payload.deviceName?.trim(),
      appVersion: payload.appVersion?.trim(),
      lastSeenAt: new Date(),
    } satisfies {
      userId: string;
      platform: PushPlatform;
      token: string;
      deviceName?: string;
      appVersion?: string;
      lastSeenAt: Date;
    };

    return this.prisma.pushDevice.upsert({
      where: { token },
      create: data,
      update: data,
    });
  }

  async removePushDevice(user: RequestUser, deviceId: string) {
    const result = await this.prisma.pushDevice.deleteMany({
      where: {
        id: deviceId,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Push device not found");
    }

    return {
      removed: true,
    };
  }
}
