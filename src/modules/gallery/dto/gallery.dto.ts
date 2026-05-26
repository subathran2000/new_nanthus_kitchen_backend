import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  Min,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { GalleryMediaType } from "../entities/gallery-item.entity";

// ── Category DTOs ─────────────────────────────────────────────────────────────

export class CreateGalleryCategoryDto {
  @ApiProperty({ description: "Display name for the category / section title" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: "URL-safe slug (auto-generated from name if omitted)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "Slug must be lowercase letters, numbers and hyphens only" })
  slug?: string;

  @ApiPropertyOptional({ description: "Optional description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateGalleryCategoryDto extends PartialType(CreateGalleryCategoryDto) {}

export class GalleryCategoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;
}

// ── Item DTOs ─────────────────────────────────────────────────────────────────

export class CreateGalleryItemDto {
  @ApiProperty({ description: "Title for the gallery item" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Optional description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Category UUID (null = uncategorised)" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: GalleryMediaType, default: GalleryMediaType.IMAGE })
  @IsEnum(GalleryMediaType)
  mediaType: GalleryMediaType;

  @ApiProperty({ description: "Relative file path returned by the upload endpoint" })
  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @ApiPropertyOptional({ description: "Thumbnail path (auto-set to mediaUrl for images)" })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateGalleryItemDto extends PartialType(CreateGalleryItemDto) {}

export class GalleryItemQueryDto {
  @ApiPropertyOptional({ description: "Filter by category UUID" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: GalleryMediaType })
  @IsOptional()
  @IsEnum(GalleryMediaType)
  mediaType?: GalleryMediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;
}
