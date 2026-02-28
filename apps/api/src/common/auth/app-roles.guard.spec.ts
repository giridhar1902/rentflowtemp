import { ForbiddenException } from "@nestjs/common";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { AppRolesGuard } from "./app-roles.guard";

const createExecutionContext = (request: Record<string, unknown>) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe("AppRolesGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new AppRolesGuard(reflector);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("allows requests when route has no role metadata", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(createExecutionContext({}))).toBe(true);
  });

  it("allows requests when user role matches route metadata", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
      UserRole.LANDLORD,
    ]);

    expect(
      guard.canActivate(
        createExecutionContext({ user: { role: UserRole.LANDLORD } }),
      ),
    ).toBe(true);
  });

  it("rejects requests when user role does not match route metadata", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
    ]);

    expect(() =>
      guard.canActivate(
        createExecutionContext({ user: { role: UserRole.TENANT } }),
      ),
    ).toThrow(new ForbiddenException("Insufficient role permissions"));
  });
});
