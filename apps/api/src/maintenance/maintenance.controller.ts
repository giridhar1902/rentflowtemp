import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { AddMaintenanceCommentDto } from "./dto/add-maintenance-comment.dto";
import { CreateMaintenanceRequestDto } from "./dto/create-maintenance-request.dto";
import { ListMaintenanceRequestsDto } from "./dto/list-maintenance-requests.dto";
import { UpdateMaintenanceStatusDto } from "./dto/update-maintenance-status.dto";
import { MaintenanceService } from "./maintenance.service";

@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get("status")
  getStatus() {
    return { module: "maintenance", status: "ok" };
  }

  @Get("requests")
  listRequests(
    @Req() request: Request,
    @Query() query: ListMaintenanceRequestsDto,
  ) {
    const user = getRequestUser(request);
    return this.maintenanceService.listRequests(user, query);
  }

  @Post("requests")
  createRequest(
    @Req() request: Request,
    @Body() payload: CreateMaintenanceRequestDto,
  ) {
    const user = getRequestUser(request);
    return this.maintenanceService.createRequest(user, payload);
  }

  @Get("requests/:requestId")
  getById(@Req() request: Request, @Param("requestId") requestId: string) {
    const user = getRequestUser(request);
    return this.maintenanceService.getRequestById(user, requestId);
  }

  @Patch("requests/:requestId/status")
  updateStatus(
    @Req() request: Request,
    @Param("requestId") requestId: string,
    @Body() payload: UpdateMaintenanceStatusDto,
  ) {
    const user = getRequestUser(request);
    return this.maintenanceService.updateStatus(user, requestId, payload);
  }

  @Get("requests/:requestId/comments")
  listComments(@Req() request: Request, @Param("requestId") requestId: string) {
    const user = getRequestUser(request);
    return this.maintenanceService.listComments(user, requestId);
  }

  @Post("requests/:requestId/comments")
  addComment(
    @Req() request: Request,
    @Param("requestId") requestId: string,
    @Body() payload: AddMaintenanceCommentDto,
  ) {
    const user = getRequestUser(request);
    return this.maintenanceService.addComment(user, requestId, payload);
  }
}
