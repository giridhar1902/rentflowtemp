import { Type } from "class-transformer";
import { UnitStatus } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  occupancy!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  furnishing?: string;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyRent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  securityDeposit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maintenanceFee?: number;
}
