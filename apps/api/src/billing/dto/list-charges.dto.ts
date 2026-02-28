import { ChargeStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListChargesDto {
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  @IsOptional()
  @IsString()
  leaseId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
