import { IsString, MaxLength, MinLength } from "class-validator";

export class AddMaintenanceCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  comment!: string;
}
