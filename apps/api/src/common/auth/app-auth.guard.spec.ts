import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ExecutionContext } from "@nestjs/common";
import { SupabaseJwtService } from "../../auth/supabase-jwt.service";
import { UsersService } from "../../users/users.service";
import { AppAuthGuard } from "./app-auth.guard";

const createExecutionContext = (request: Record<string, unknown>) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe("AppAuthGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const supabaseJwtService = {
    verify: jest.fn(),
  } as unknown as SupabaseJwtService;

  const usersService = {
    upsertFromAuthClaims: jest.fn(),
  } as unknown as UsersService;

  const guard = new AppAuthGuard(reflector, supabaseJwtService, usersService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("allows public routes without token verification", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const request = { headers: {} };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(supabaseJwtService.verify).not.toHaveBeenCalled();
    expect(usersService.upsertFromAuthClaims).not.toHaveBeenCalled();
  });

  it("rejects requests with missing bearer token", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const request = { headers: {} };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(new UnauthorizedException("Missing bearer token"));
  });

  it("rejects requests with empty bearer token", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const request = { headers: { authorization: "Bearer " } };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(new UnauthorizedException("Invalid bearer token"));
  });

  it("maps verified identity into request context", async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (supabaseJwtService.verify as jest.Mock).mockResolvedValue({
      sub: "auth-user-1",
      email: "landlord@example.com",
      role: UserRole.LANDLORD,
    });
    (usersService.upsertFromAuthClaims as jest.Mock).mockResolvedValue({
      id: "internal-user-1",
      authUserId: "auth-user-1",
      role: UserRole.LANDLORD,
      email: "landlord@example.com",
    });

    const request = { headers: { authorization: "Bearer token-123" } };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(request).toEqual({
      headers: { authorization: "Bearer token-123" },
      user: {
        id: "internal-user-1",
        sub: "auth-user-1",
        role: UserRole.LANDLORD,
        email: "landlord@example.com",
      },
    });
  });
});
