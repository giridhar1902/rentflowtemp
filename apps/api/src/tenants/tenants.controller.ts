import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { AppAuthGuard } from "../common/auth/app-auth.guard";
import { AppRolesGuard } from "../common/auth/app-roles.guard";
import { Roles } from "../common/auth/roles.decorator";
import { getRequestUser } from "../common/auth/request-user";

@Controller()
@UseGuards(AppAuthGuard, AppRolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post("tenants")
  @Roles("LANDLORD", "ADMIN")
  createTenant(@Req() request: Request, @Body() payload: CreateTenantDto) {
    const user = getRequestUser(request);
    return this.tenantsService.createTenant(user.id, payload);
  }

  @Get("units/:unitId/tenants")
  @Roles("LANDLORD", "ADMIN")
  listTenants(@Req() request: Request, @Param("unitId") unitId: string) {
    const user = getRequestUser(request);
    return this.tenantsService.listTenants(user.id, unitId);
  }

  @Get("tenants/:tenantId/payments")
  @Roles("TENANT", "LANDLORD", "ADMIN")
  listTenantPayments(
    @Req() request: Request,
    @Param("tenantId") tenantId: string,
  ) {
    const user = getRequestUser(request);
    return this.tenantsService.listTenantPayments(user, tenantId);
  }

  @Get("tenants/:tenantId/utilities")
  @Roles("TENANT", "LANDLORD", "ADMIN")
  listTenantUtilities(
    @Req() request: Request,
    @Param("tenantId") tenantId: string,
  ) {
    const user = getRequestUser(request);
    return this.tenantsService.listTenantUtilities(user, tenantId);
  }

  @Delete("tenants/:tenantId")
  @Roles("LANDLORD", "ADMIN")
  deleteTenant(@Req() request: Request, @Param("tenantId") tenantId: string) {
    const user = getRequestUser(request);
    return this.tenantsService.deleteTenant(user.id, tenantId);
  }
}
