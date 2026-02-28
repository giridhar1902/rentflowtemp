import { UserRole } from "@prisma/client";

export type AuthClaims = {
  sub: string;
  email?: string;
  role?: UserRole;
  rawRole?: string;
};
