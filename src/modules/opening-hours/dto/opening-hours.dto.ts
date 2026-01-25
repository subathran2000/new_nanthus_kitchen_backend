import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  MaxLength,
  Matches,
  ValidateNested,
  IsArray,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { DayOfWeek } from "../../../common/enums";

/**
 * Opening Hours DTOs
 *
 * IMPORTANT: Time Format
 * - All times use HH:mm format (24-hour, e.g., "11:00", "23:30")
 * - Times are stored as PostgreSQL TIME type
 * - All time comparisons use America/Toronto timezone
 *
 * Structure for Each Location:
 * - Create 7 records (one per day) for each location (markham/scarborough)
 * - Each record can have:
 *   1. Regular hours: openTime -> closeTime
 *   2. Overnight hours: If closeTime < openTime (e.g., open="22:00", close="02:00"), hours cross midnight
 *   3. Closed days: Set isClosed = true, leave times null
 *
 * Examples:
 * - Monday, Markham: openTime="11:00", closeTime="22:00" (regular hours)
 * - Friday, Markham: openTime="11:00", closeTime="02:00" (overnight - closes at 2 AM next day)
 * - Sunday, Scarborough: isClosed=true
 */

export class CreateOpeningHoursDto {
  @ApiProperty({ enum: DayOfWeek, description: "Day of the week" })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiPropertyOptional({
    description: "Opening time (HH:mm format)",
    example: "11:00",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "openTime must be in HH:mm format",
  })
  openTime?: string;

  @ApiPropertyOptional({
    description: "Closing time (HH:mm format)",
    example: "21:00",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "closeTime must be in HH:mm format",
  })
  closeTime?: string;

  @ApiPropertyOptional({ description: "Whether the restaurant is closed" })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ description: "Whether these are special hours" })
  @IsOptional()
  @IsBoolean()
  isSpecialHours?: boolean;

  @ApiPropertyOptional({
    description: "Special note (e.g., holiday hours explanation)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialNote?: string;

  @ApiPropertyOptional({
    enum: ["markham", "scarborough"],
    description: "Restaurant location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough"])
  location?: "markham" | "scarborough";
}

export class UpdateOpeningHoursDto extends PartialType(CreateOpeningHoursDto) {}

export class BulkUpdateOpeningHoursItemDto {
  @ApiProperty({ description: "Opening hours ID" })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: "Opening time (HH:mm format)",
    example: "11:00",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "openTime must be in HH:mm format",
  })
  openTime?: string;

  @ApiPropertyOptional({
    description: "Closing time (HH:mm format)",
    example: "21:00",
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "closeTime must be in HH:mm format",
  })
  closeTime?: string;

  @ApiPropertyOptional({ description: "Whether the restaurant is closed" })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ description: "Whether these are special hours" })
  @IsOptional()
  @IsBoolean()
  isSpecialHours?: boolean;

  @ApiPropertyOptional({ description: "Special note" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialNote?: string;
}

export class BulkUpdateOpeningHoursDto {
  @ApiProperty({ type: [BulkUpdateOpeningHoursItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateOpeningHoursItemDto)
  items: BulkUpdateOpeningHoursItemDto[];
}

export class OpeningHoursQueryDto {
  @ApiPropertyOptional({
    enum: ["markham", "scarborough"],
    description: "Filter by location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough"])
  location?: "markham" | "scarborough";
}
