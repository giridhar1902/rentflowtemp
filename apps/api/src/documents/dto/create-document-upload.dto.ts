import { DocumentType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateDocumentUploadDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(25_000_000)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  leaseId?: string;

  @IsOptional()
  @IsString()
  maintenanceRequestId?: string;
}
