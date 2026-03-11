import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class SubmitOfflinePaymentDto {
  @IsString()
  propertyId!: string;

  @IsString()
  unitId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  rentMonth!: string;

  @IsDateString()
  paymentDate!: string;

  @IsString()
  paymentMode!: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsString()
  status!: "PENDING_APPROVAL";
}
