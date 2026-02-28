import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { LeasesService } from "./leases.service";

@Controller("leases")
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get("status")
  getStatus() {
    return { module: "leases", status: "ok" };
  }

  @Get()
  list(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.leasesService.listLeases(user);
  }

  @Get("invitations/mine")
  listMyInvitations(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.leasesService.listMyInvitations(user);
  }

  @Get(":leaseId")
  getById(@Req() request: Request, @Param("leaseId") leaseId: string) {
    const user = getRequestUser(request);
    return this.leasesService.getLeaseById(user, leaseId);
  }

  @Post()
  create(@Req() request: Request, @Body() payload: CreateLeaseDto) {
    const user = getRequestUser(request);
    return this.leasesService.createLease(user, payload);
  }

  @Patch(":leaseId")
  update(
    @Req() request: Request,
    @Param("leaseId") leaseId: string,
    @Body() payload: UpdateLeaseDto,
  ) {
    const user = getRequestUser(request);
    return this.leasesService.updateLease(user, leaseId, payload);
  }

  @Post("invitations/accept")
  acceptInvitation(
    @Req() request: Request,
    @Body() payload: AcceptInvitationDto,
  ) {
    const user = getRequestUser(request);
    return this.leasesService.acceptInvitation(user, payload);
  }
}
