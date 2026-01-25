import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  IsUrl,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EventType } from "../../../common/enums";

export class CreateEventDto {
  @ApiProperty({ example: "Live Music Night" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Enjoy live music with your meal" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ example: "2026-01-15T00:00:00.000Z" })
  @IsDateString()
  displayStartDate: string;

  @ApiProperty({ example: "2026-01-20T23:59:59.000Z" })
  @IsDateString()
  displayEndDate: string;

  @ApiProperty({ example: "2026-01-18T19:00:00.000Z" })
  @IsDateString()
  eventStartDate: string;

  @ApiProperty({ example: "2026-01-18T22:00:00.000Z" })
  @IsDateString()
  eventEndDate: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ example: "https://tickets.example.com/event123" })
  @IsUrl()
  @IsOptional()
  ticketLink?: string;

  @ApiPropertyOptional({ example: "Markham Location" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  registrationRequired?: boolean;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  displayStartDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  displayEndDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  eventStartDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  eventEndDate?: string;

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
  @IsUrl()
  @IsOptional()
  ticketLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  registrationRequired?: boolean;
}

export class EventQueryDto {
  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
