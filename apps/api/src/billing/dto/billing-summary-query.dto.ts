import { IsDateString, IsOptional, IsString } from "class-validator";

export class BillingSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
