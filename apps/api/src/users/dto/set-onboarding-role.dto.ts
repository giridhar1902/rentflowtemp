import { UserRole } from "@prisma/client";
import { IsEnum } from "class-validator";

export class SetOnboardingRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
