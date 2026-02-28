import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { SupabaseJwtService } from "../../auth/supabase-jwt.service";
import { UsersService } from "../../users/users.service";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseJwtService: SupabaseJwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Invalid bearer token");
    }

    const claims = await this.supabaseJwtService.verify(token);
    const user = await this.usersService.upsertFromAuthClaims(claims);

    request.user = {
      id: user.id,
      sub: user.authUserId,
      role: user.role,
      email: user.email ?? undefined,
    };
    return true;
  }
}
