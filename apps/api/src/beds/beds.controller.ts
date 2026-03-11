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
import { BedsService } from "./beds.service";
import { CreateBedDto } from "./dto/create-bed.dto";
import { AppAuthGuard } from "../common/auth/app-auth.guard";
import { AppRolesGuard } from "../common/auth/app-roles.guard";
import { Roles } from "../common/auth/roles.decorator";
import { getRequestUser } from "../common/auth/request-user";

@Controller()
@UseGuards(AppAuthGuard, AppRolesGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post("beds")
  @Roles("LANDLORD", "ADMIN")
  createBed(@Req() request: Request, @Body() payload: CreateBedDto) {
    const user = getRequestUser(request);
    return this.bedsService.createBed(user.id, payload);
  }

  @Get("units/:unitId/beds")
  @Roles("LANDLORD", "ADMIN")
  listBeds(@Req() request: Request, @Param("unitId") unitId: string) {
    const user = getRequestUser(request);
    return this.bedsService.listBeds(user.id, unitId);
  }
}
