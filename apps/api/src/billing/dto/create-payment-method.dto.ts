import { PaymentMethodType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethodType)
  type!: PaymentMethodType;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  providerRef?: string;

  @IsOptional()
  @Matches(/^[0-9]{4}$/)
  last4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  brand?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
