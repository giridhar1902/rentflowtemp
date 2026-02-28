import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { SupabaseJwtService } from "./supabase-jwt.service";

@Module({
  controllers: [AuthController],
  providers: [SupabaseJwtService],
  exports: [SupabaseJwtService],
})
export class AuthModule {}
