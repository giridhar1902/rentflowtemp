import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "@prisma/client";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { createSecretKey } from "node:crypto";
import { AuthClaims } from "../common/auth/auth-claims";

type JwtPayloadShape = {
  sub?: string;
  email?: string;
  role?: string;
  app_metadata?: { role?: string };
};

@Injectable()
export class SupabaseJwtService {
  private cachedJwksUrl: string | null = null;
  private cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string): Promise<AuthClaims> {
    try {
      const header = decodeProtectedHeader(token);
      const algorithm = typeof header.alg === "string" ? header.alg : "";

      const payload =
        algorithm === "HS256"
          ? await this.verifyLegacyHs256(token)
          : await this.verifyWithSupabaseJwks(token);

      const claimsPayload = payload as unknown as JwtPayloadShape;
      if (!claimsPayload.sub) {
        throw new UnauthorizedException("Token subject is missing");
      }

      // Never trust user_metadata for authorization because it is user-managed.
      const rawRole = claimsPayload.app_metadata?.role ?? claimsPayload.role;

      return {
        sub: claimsPayload.sub,
        email: claimsPayload.email,
        rawRole,
        role: normalizeRole(rawRole),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid access token");
    }
  }

  private async verifyLegacyHs256(token: string) {
    const jwtSecret = this.configService
      .get<string>("SUPABASE_JWT_SECRET")
      ?.trim();
    if (!jwtSecret) {
      throw new UnauthorizedException(
        "SUPABASE_JWT_SECRET is not configured for HS256 token verification",
      );
    }

    const { payload } = await jwtVerify(
      token,
      createSecretKey(Buffer.from(jwtSecret, "utf8")),
      { algorithms: ["HS256"] },
    );
    return payload;
  }

  private async verifyWithSupabaseJwks(token: string) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL")?.trim();
    if (!supabaseUrl) {
      throw new UnauthorizedException(
        "SUPABASE_URL is not configured for JWKS token verification",
      );
    }

    const normalizedBaseUrl = supabaseUrl.endsWith("/")
      ? supabaseUrl.slice(0, -1)
      : supabaseUrl;
    const jwksUrl = `${normalizedBaseUrl}/auth/v1/.well-known/jwks.json`;

    if (!this.cachedJwks || this.cachedJwksUrl !== jwksUrl) {
      this.cachedJwksUrl = jwksUrl;
      this.cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    const { payload } = await jwtVerify(token, this.cachedJwks, {
      algorithms: ["RS256", "ES256"],
    });

    return payload;
  }
}

const normalizeRole = (value?: string): UserRole | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toUpperCase();
  if (normalized === UserRole.LANDLORD) {
    return UserRole.LANDLORD;
  }
  if (normalized === UserRole.TENANT) {
    return UserRole.TENANT;
  }
  if (normalized === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }
  return undefined;
};
