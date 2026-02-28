import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface UserContext {
      id?: string;
      sub: string;
      role?: UserRole;
      email?: string;
    }

    interface Request {
      requestId?: string;
      user?: UserContext;
      rawBody?: Buffer;
    }
  }
}

export {};
