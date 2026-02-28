import { PropertyOwnership, PropertyStatus } from "@prisma/client";
import {
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsArray,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  propertyType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  floors?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  totalUnits?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  amenities?: string[];

  @IsOptional()
  @IsEnum(PropertyOwnership)
  ownership?: PropertyOwnership;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;
}
