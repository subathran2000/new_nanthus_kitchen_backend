import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SpecialType, DayOfWeek, SpecialCategory } from "../../../common/enums";

/**
 * DTO for creating a new Special
 *
 * Design Notes:
 * - Daily specials: Set dayOfWeek to specify which day the special is active
 * - Late night specials: Set specialCategory to 'late_night' (shown all day)
 * - Seasonal/limited: Use displayStartDate and displayEndDate (date only, no time)
 */
export class CreateSpecialDto {
  @ApiProperty({ example: "Monday Special: Biryani" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Enjoy our special Biryani every Monday" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: SpecialType,
    description:
      "Type of special: daily (day-based), game_time, day_time, chef, or seasonal",
  })
  @IsEnum(SpecialType)
  type: SpecialType;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    description:
      "Required for daily specials. The special will be shown all day on this day.",
  })
  @IsEnum(DayOfWeek)
  @IsOptional()
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({
    enum: SpecialCategory,
    description:
      "Category: regular or late_night. Late night specials are displayed all day.",
  })
  @IsEnum(SpecialCategory)
  @IsOptional()
  specialCategory?: SpecialCategory;

  @ApiPropertyOptional({
    example: "2024-12-01",
    description:
      "Optional start date for limited-time promotions (YYYY-MM-DD format)",
  })
  @IsDateString()
  @IsOptional()
  displayStartDate?: string;

  @ApiPropertyOptional({
    example: "2024-12-31",
    description:
      "Optional end date for limited-time promotions (YYYY-MM-DD format)",
  })
  @IsDateString()
  @IsOptional()
  displayEndDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

/**
 * DTO for updating an existing Special
 */
export class UpdateSpecialDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: SpecialType })
  @IsEnum(SpecialType)
  @IsOptional()
  type?: SpecialType;

  @ApiPropertyOptional({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  @IsOptional()
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ enum: SpecialCategory })
  @IsEnum(SpecialCategory)
  @IsOptional()
  specialCategory?: SpecialCategory;

  @ApiPropertyOptional({ description: "Date in YYYY-MM-DD format" })
  @IsDateString()
  @IsOptional()
  displayStartDate?: string;

  @ApiPropertyOptional({ description: "Date in YYYY-MM-DD format" })
  @IsDateString()
  @IsOptional()
  displayEndDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

/**
 * Query parameters for fetching specials
 */
export class SpecialQueryDto {
  @ApiPropertyOptional({ enum: SpecialType })
  @IsEnum(SpecialType)
  @IsOptional()
  type?: SpecialType;

  @ApiPropertyOptional({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  @IsOptional()
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ enum: SpecialCategory })
  @IsEnum(SpecialCategory)
  @IsOptional()
  specialCategory?: SpecialCategory;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for reordering specials
 */
export class ReorderSpecialsDto {
  @ApiProperty({ example: [{ id: "uuid-1", sortOrder: 0 }] })
  @IsArray()
  items: { id: string; sortOrder: number }[];
}
