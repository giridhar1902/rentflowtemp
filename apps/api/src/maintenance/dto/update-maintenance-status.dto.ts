import { MaintenanceStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
