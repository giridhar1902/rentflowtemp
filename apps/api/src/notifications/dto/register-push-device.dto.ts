import { PushPlatform } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterPushDeviceDto {
  @IsEnum(PushPlatform)
  platform!: PushPlatform;

  @IsString()
  @MinLength(20)
  @MaxLength(1024)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;
}
