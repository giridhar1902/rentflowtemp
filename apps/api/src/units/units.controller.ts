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
import { UnitsService } from "./units.service";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { AppAuthGuard } from "../common/auth/app-auth.guard";
import { AppRolesGuard } from "../common/auth/app-roles.guard";
import { Roles } from "../common/auth/roles.decorator";
import { getRequestUser } from "../common/auth/request-user";

@Controller()
@UseGuards(AppAuthGuard, AppRolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post("units")
  @Roles("LANDLORD", "ADMIN")
  createUnit(@Req() request: Request, @Body() payload: CreateUnitDto) {
    const user = getRequestUser(request);
    return this.unitsService.createUnit(user.id, payload);
  }

  @Get("properties/:propertyId/units")
  @Roles("LANDLORD", "ADMIN")
  listUnits(@Req() request: Request, @Param("propertyId") propertyId: string) {
    const user = getRequestUser(request);
    return this.unitsService.listUnits(user.id, propertyId);
  }
}
