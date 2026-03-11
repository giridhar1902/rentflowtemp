import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { PropertiesService } from "./properties.service";

@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get("status")
  getStatus() {
    return { module: "properties", status: "ok" };
  }

  @Get()
  list(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.propertiesService.listProperties(user);
  }

  @Post()
  create(@Req() request: Request, @Body() payload: CreatePropertyDto) {
    const user = getRequestUser(request);
    return this.propertiesService.createProperty(user, payload);
  }

  @Get(":propertyId")
  getById(@Req() request: Request, @Param("propertyId") propertyId: string) {
    const user = getRequestUser(request);
    return this.propertiesService.getPropertyById(user, propertyId);
  }

  @Patch(":propertyId")
  update(
    @Req() request: Request,
    @Param("propertyId") propertyId: string,
    @Body() payload: UpdatePropertyDto,
  ) {
    const user = getRequestUser(request);
    return this.propertiesService.updateProperty(user, propertyId, payload);
  }

  @Get(":propertyId/invitations")
  listInvitations(
    @Req() request: Request,
    @Param("propertyId") propertyId: string,
  ) {
    const user = getRequestUser(request);
    return this.propertiesService.listInvitations(user, propertyId);
  }

  @Post(":propertyId/invitations")
  createInvitation(
    @Req() request: Request,
    @Param("propertyId") propertyId: string,
    @Body() payload: CreateInvitationDto,
  ) {
    const user = getRequestUser(request);
    return this.propertiesService.createInvitation(user, propertyId, payload);
  }
}
