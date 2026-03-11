import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { UtilitiesService } from "./utilities.service";
import { CreateUtilityDto } from "./dto/create-utility.dto";
import { AppAuthGuard } from "../common/auth/app-auth.guard";
import { AppRolesGuard } from "../common/auth/app-roles.guard";
import { Roles } from "../common/auth/roles.decorator";
import { getRequestUser } from "../common/auth/request-user";

@Controller()
@UseGuards(AppAuthGuard, AppRolesGuard)
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  @Post("utilities")
  @Roles("LANDLORD", "ADMIN")
  createUtility(@Req() request: Request, @Body() payload: CreateUtilityDto) {
    const user = getRequestUser(request);
    return this.utilitiesService.createUtility(user.id, payload);
  }

  @Get("properties/:propertyId/utilities")
  @Roles("LANDLORD", "ADMIN")
  listUtilities(
    @Req() request: Request,
    @Param("propertyId") propertyId: string,
  ) {
    const user = getRequestUser(request);
    return this.utilitiesService.listUtilities(user.id, propertyId);
  }
}
