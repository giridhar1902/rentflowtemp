import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Request } from "express";

export type RequestUser = {
  id: string;
  sub: string;
  role: UserRole;
  email?: string;
};

export const getRequestUser = (request: Request): RequestUser => {
  const user = request.user;
  if (!user?.id || !user.sub || !user.role) {
    throw new UnauthorizedException("Authenticated user context is missing");
  }

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.LANDLORD &&
    user.role !== UserRole.TENANT
  ) {
    throw new UnauthorizedException("Authenticated user role is invalid");
  }

  return {
    id: user.id,
    sub: user.sub,
    role: user.role,
    email: user.email,
  };
};

export const assertAllowedRoles = (
  user: RequestUser,
  allowedRoles: UserRole[],
): void => {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenException("Insufficient role permissions");
  }
};
