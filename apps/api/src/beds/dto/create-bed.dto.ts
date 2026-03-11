import { IsNotEmpty, IsString } from "class-validator";

export class CreateBedDto {
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;
}
