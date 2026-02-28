import { Controller, Get, Req } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import { Public } from "../common/auth/public.decorator";
import { Roles } from "../common/auth/roles.decorator";

@Controller("auth")
export class AuthController {
  @Public()
  @Get("public")
  getPublicRoute() {
    return {
      module: "auth",
      route: "public",
      status: "ok",
    };
  }

  @Get("protected")
  getProtectedRoute(@Req() request: Request) {
    return {
      module: "auth",
      route: "protected",
      status: "ok",
      subject: request.user?.sub ?? null,
      role: request.user?.role ?? null,
      internalUserId: request.user?.id ?? null,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get("admin-only")
  getAdminOnlyRoute(@Req() request: Request) {
    return {
      module: "auth",
      route: "admin-only",
      status: "ok",
      role: request.user?.role ?? null,
    };
  }
}
