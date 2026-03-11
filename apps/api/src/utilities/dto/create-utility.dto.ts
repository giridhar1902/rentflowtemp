import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { UtilityType, UtilitySplitMethod } from "@prisma/client";

export class CreateUtilityDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsEnum(UtilityType)
  @IsNotEmpty()
  type!: UtilityType;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  billingMonth!: string;

  @IsEnum(UtilitySplitMethod)
  @IsNotEmpty()
  splitMethod!: UtilitySplitMethod;
}
