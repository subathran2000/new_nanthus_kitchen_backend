import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { DietaryInfo, Allergen } from "../../../common/enums";

export class MenuItemMeasurementDto {
  @ApiProperty()
  @IsUUID()
  measurementTypeId: string;

  @ApiProperty({ example: 12.99 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: "Butter Chicken" })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: "Tender chicken in a rich, creamy tomato-based curry",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15.99 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: Allergen, isArray: true })
  @IsArray()
  @IsEnum(Allergen, { each: true })
  @IsOptional()
  allergens?: Allergen[];

  @ApiPropertyOptional({ enum: DietaryInfo, isArray: true })
  @IsArray()
  @IsEnum(DietaryInfo, { each: true })
  @IsOptional()
  dietaryInfo?: DietaryInfo[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

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

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  hasMeasurements?: boolean;

  @ApiPropertyOptional({ type: [MenuItemMeasurementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemMeasurementDto)
  @IsOptional()
  measurements?: MenuItemMeasurementDto[];
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: Allergen, isArray: true })
  @IsArray()
  @IsEnum(Allergen, { each: true })
  @IsOptional()
  allergens?: Allergen[];

  @ApiPropertyOptional({ enum: DietaryInfo, isArray: true })
  @IsArray()
  @IsEnum(DietaryInfo, { each: true })
  @IsOptional()
  dietaryInfo?: DietaryInfo[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

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

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasMeasurements?: boolean;

  @ApiPropertyOptional({ type: [MenuItemMeasurementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemMeasurementDto)
  @IsOptional()
  measurements?: MenuItemMeasurementDto[];
}

export class ToggleAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable: boolean;
}

export class MenuItemQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DietaryInfo })
  @IsEnum(DietaryInfo)
  @IsOptional()
  dietaryInfo?: DietaryInfo;
}
