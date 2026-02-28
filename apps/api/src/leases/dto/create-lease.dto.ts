import { Type } from "class-transformer";
import { LeaseStatus } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateLeaseDto {
  @IsString()
  propertyId!: string;

  @IsString()
  unitId!: string;

  @IsString()
  tenantUserId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyRent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  securityDeposit?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @IsOptional()
  @IsEnum(LeaseStatus)
  status?: LeaseStatus;

  @IsOptional()
  @IsBoolean()
  partialPaymentsAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  cashPaymentsAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  cashApprovalRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRemindersEnabled?: boolean;
}
