import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateNriSettingsDto {
  @IsBoolean()
  @IsOptional()
  isNRI?: boolean;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  nroAccountFlag?: boolean;

  @IsString()
  @IsOptional()
  poaHolderPhone?: string;
}
