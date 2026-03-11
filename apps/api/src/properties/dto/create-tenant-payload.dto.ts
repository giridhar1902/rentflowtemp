import { IsEmail, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTenantPayloadDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNumber()
  @Min(0)
  rentAmount: number;

  @IsNumber()
  @Min(0)
  depositAmount: number;

  @IsString()
  startDate: string;

  @IsString()
  unitLabel: string;

  @IsOptional()
  @IsString()
  bedLabel?: string;
}
