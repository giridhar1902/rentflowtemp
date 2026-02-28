import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { ListNotificationsDto } from "./dto/list-notifications.dto";
import { RegisterPushDeviceDto } from "./dto/register-push-device.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("status")
  getStatus() {
    return { module: "notifications", status: "ok" };
  }

  @Get()
  list(@Req() request: Request, @Query() query: ListNotificationsDto) {
    const user = getRequestUser(request);
    return this.notificationsService.listNotifications(user, query);
  }

  @Patch(":notificationId/read")
  markRead(
    @Req() request: Request,
    @Param("notificationId") notificationId: string,
  ) {
    const user = getRequestUser(request);
    return this.notificationsService.markRead(user, notificationId);
  }

  @Post("read-all")
  markAllRead(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.notificationsService.markAllRead(user);
  }

  @Get("push-devices")
  listPushDevices(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.notificationsService.listPushDevices(user);
  }

  @Post("push-devices")
  registerPushDevice(
    @Req() request: Request,
    @Body() payload: RegisterPushDeviceDto,
  ) {
    const user = getRequestUser(request);
    return this.notificationsService.registerPushDevice(user, payload);
  }

  @Delete("push-devices/:deviceId")
  removePushDevice(
    @Req() request: Request,
    @Param("deviceId") deviceId: string,
  ) {
    const user = getRequestUser(request);
    return this.notificationsService.removePushDevice(user, deviceId);
  }
}
