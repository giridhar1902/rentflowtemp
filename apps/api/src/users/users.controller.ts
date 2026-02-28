import { Body, Controller, Get, Patch, Post, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import {
  assertAllowedRoles,
  getRequestUser,
} from "../common/auth/request-user";
import { SetOnboardingRoleDto } from "./dto/set-onboarding-role.dto";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("status")
  getStatus() {
    return { module: "users", status: "ok" };
  }

  @Get("me")
  me(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.usersService.getMe(user.id);
  }

  @Patch("me")
  updateMe(@Req() request: Request, @Body() payload: UpdateMeDto) {
    const user = getRequestUser(request);
    return this.usersService.updateMe(user.id, payload);
  }

  @Post("me/role")
  setOnboardingRole(
    @Req() request: Request,
    @Body() payload: SetOnboardingRoleDto,
  ) {
    const user = getRequestUser(request);
    assertAllowedRoles(user, [UserRole.TENANT, UserRole.LANDLORD]);
    return this.usersService.setOnboardingRole(user.id, payload.role);
  }
}
