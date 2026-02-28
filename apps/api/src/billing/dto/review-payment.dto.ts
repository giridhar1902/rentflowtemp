import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export enum PaymentReviewAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export class ReviewPaymentDto {
  @IsEnum(PaymentReviewAction)
  action!: PaymentReviewAction;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
