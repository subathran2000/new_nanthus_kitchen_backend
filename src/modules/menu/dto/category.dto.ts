import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Primary Category DTOs
export class CreatePrimaryCategoryDto {
  @ApiProperty({ example: "Appetizers" })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: "Start your meal with our delicious appetizers",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePrimaryCategoryDto {
  @ApiPropertyOptional({ example: "Appetizers" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ReorderDto {
  @ApiProperty({
    example: [
      { id: "uuid-1", sortOrder: 0 },
      { id: "uuid-2", sortOrder: 1 },
    ],
  })
  @IsArray()
  items: { id: string; sortOrder: number }[];
}

// Menu Category DTOs
export class CreateMenuCategoryDto {
  @ApiProperty({ example: "Vegetarian Starters" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Delicious vegetarian appetizers" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsUUID()
  primaryCategoryId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMenuCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  primaryCategoryId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Measurement Type DTOs
export class CreateMeasurementTypeDto {
  @ApiProperty({ example: "Half Plate" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "1/2" })
  @IsString()
  @IsOptional()
  shortName?: string;
}

export class UpdateMeasurementTypeDto {
  @ApiPropertyOptional({ example: "Full Plate" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Full" })
  @IsString()
  @IsOptional()
  shortName?: string;
}
