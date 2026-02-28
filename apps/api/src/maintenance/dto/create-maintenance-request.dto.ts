import { MaintenancePriority } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateMaintenanceRequestDto {
  @IsString()
  @MinLength(1)
  propertyId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unitId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  leaseId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  details!: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsBoolean()
  emergency?: boolean;
}
