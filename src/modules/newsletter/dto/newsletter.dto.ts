import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  MaxLength,
  IsUUID,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { NewsletterStatus } from "../entities/newsletter-campaign.entity";

// Subscriber DTOs
export class SubscribeDto {
  @ApiProperty({ description: "Subscriber email address" })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({ description: "First name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: "Last name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    enum: ["markham", "scarborough", "both"],
    description: "Preferred location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough", "both"])
  preferredLocation?: "markham" | "scarborough" | "both";

  @ApiPropertyOptional({
    description: "Interests",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: "Subscription source" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}

export class UnsubscribeDto {
  @ApiProperty({ description: "Subscriber email address" })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({ description: "Unsubscribe token" })
  @IsOptional()
  @IsString()
  token?: string;
}

export class UpdateSubscriberDto extends PartialType(SubscribeDto) {
  @ApiPropertyOptional({ description: "Is active" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Admin creates subscribers with just email (user becomes verified immediately)
export class AdminCreateSubscriberDto {
  @ApiProperty({ description: "Subscriber email address" })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class SubscriberQueryDto {
  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Filter by verified status" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isVerified?: boolean;

  @ApiPropertyOptional({
    enum: ["markham", "scarborough", "both"],
    description: "Filter by preferred location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough", "both"])
  preferredLocation?: "markham" | "scarborough" | "both";

  @ApiPropertyOptional({ description: "Search by email or name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

// Campaign DTOs
export class CreateCampaignDto {
  @ApiProperty({ description: "Email subject" })
  @IsString()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ description: "Email content (HTML)" })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: "Preview text for email clients" })
  @IsOptional()
  @IsString()
  previewText?: string;

  @ApiPropertyOptional({
    enum: ["markham", "scarborough", "both"],
    description: "Target location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough", "both"])
  targetLocation?: "markham" | "scarborough" | "both";

  @ApiPropertyOptional({ description: "Scheduled send time" })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiPropertyOptional({
    enum: NewsletterStatus,
    description: "Campaign status",
  })
  @IsOptional()
  @IsEnum(NewsletterStatus)
  status?: NewsletterStatus;
}

export class CampaignQueryDto {
  @ApiPropertyOptional({
    enum: NewsletterStatus,
    description: "Filter by status",
  })
  @IsOptional()
  @IsEnum(NewsletterStatus)
  status?: NewsletterStatus;

  @ApiPropertyOptional({
    enum: ["markham", "scarborough", "both"],
    description: "Filter by target location",
  })
  @IsOptional()
  @IsEnum(["markham", "scarborough", "both"])
  targetLocation?: "markham" | "scarborough" | "both";

  @ApiPropertyOptional({ description: "Search by subject" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

export class SendTestEmailDto {
  @ApiProperty({ description: "Campaign ID" })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ description: "Test email address" })
  @IsEmail()
  testEmail: string;
}
