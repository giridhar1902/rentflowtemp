import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  meterNumber?: string;
}
