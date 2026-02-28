import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { SignJWT } from "jose";
import { createSecretKey, generateKeyPairSync } from "node:crypto";
import { SupabaseJwtService } from "./supabase-jwt.service";

const TEST_SECRET = "phase-2-jwt-secret";

const signToken = async (
  payload: Record<string, unknown>,
  subject = "auth-user-1",
) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(createSecretKey(Buffer.from(TEST_SECRET, "utf8")));

const signEs256Token = async (payload: Record<string, unknown>) => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "ES256" })
    .setSubject("auth-user-1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
};

describe("SupabaseJwtService", () => {
  const get = jest.fn();
  const configService = { get } as unknown as ConfigService;
  const service = new SupabaseJwtService(configService);

  beforeEach(() => {
    jest.resetAllMocks();
    get.mockImplementation((key: string) => {
      if (key === "SUPABASE_JWT_SECRET") {
        return TEST_SECRET;
      }
      if (key === "SUPABASE_URL") {
        return "https://example.supabase.co";
      }
      return undefined;
    });
  });

  it("rejects when SUPABASE_JWT_SECRET is missing", async () => {
    const token = await signToken({ role: "tenant" });
    get.mockImplementation((key: string) => {
      if (key === "SUPABASE_JWT_SECRET") {
        return undefined;
      }
      if (key === "SUPABASE_URL") {
        return "https://example.supabase.co";
      }
      return undefined;
    });

    await expect(service.verify(token)).rejects.toThrow(
      new UnauthorizedException(
        "SUPABASE_JWT_SECRET is not configured for HS256 token verification",
      ),
    );
  });

  it("rejects non-HS token when SUPABASE_URL is missing", async () => {
    const token = await signEs256Token({ role: "tenant" });
    get.mockImplementation((key: string) => {
      if (key === "SUPABASE_JWT_SECRET") {
        return TEST_SECRET;
      }
      if (key === "SUPABASE_URL") {
        return undefined;
      }
      return undefined;
    });

    await expect(service.verify(token)).rejects.toThrow(
      new UnauthorizedException(
        "SUPABASE_URL is not configured for JWKS token verification",
      ),
    );
  });

  it("verifies token and uses app_metadata role", async () => {
    const token = await signToken({
      email: "tenant@example.com",
      app_metadata: { role: "landlord" },
      user_metadata: { role: "admin" },
    });

    await expect(service.verify(token)).resolves.toEqual({
      sub: "auth-user-1",
      email: "tenant@example.com",
      rawRole: "landlord",
      role: UserRole.LANDLORD,
    });
  });

  it("falls back to top-level role when app_metadata role is missing", async () => {
    const token = await signToken({ role: "admin" });

    await expect(service.verify(token)).resolves.toEqual({
      sub: "auth-user-1",
      email: undefined,
      rawRole: "admin",
      role: UserRole.ADMIN,
    });
  });

  it("rejects invalid token signature", async () => {
    const token = await new SignJWT({ role: "tenant" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("auth-user-1")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(createSecretKey(Buffer.from("wrong-secret", "utf8")));

    await expect(service.verify(token)).rejects.toThrow(
      new UnauthorizedException("Invalid access token"),
    );
  });
});
