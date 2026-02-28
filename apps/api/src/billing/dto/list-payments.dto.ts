import { PaymentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListPaymentsDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  chargeId?: string;
}
