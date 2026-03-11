import { IsEnum } from "class-validator";
import { OfflineRentPaymentStatus } from "@prisma/client";

export class ReviewOfflinePaymentDto {
  @IsEnum(OfflineRentPaymentStatus)
  action!: OfflineRentPaymentStatus;
}
