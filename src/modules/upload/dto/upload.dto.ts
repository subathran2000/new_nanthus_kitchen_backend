import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum UploadFolder {
  MENU = "menu",
  EVENTS = "events",
  SPECIALS = "specials",
  NEWSLETTER = "newsletter",
  GENERAL = "general",
}

export class UploadFileDto {
  @ApiProperty({
    enum: UploadFolder,
    description: "Folder to store the file",
    default: UploadFolder.GENERAL,
  })
  @IsEnum(UploadFolder)
  folder: UploadFolder;

  @ApiPropertyOptional({ description: "Custom filename (without extension)" })
  @IsOptional()
  @IsString()
  customFilename?: string;
}

export class DeleteFileDto {
  @ApiProperty({ description: "File path to delete" })
  @IsString()
  filePath: string;
}

export class DeleteMultipleFilesDto {
  @ApiProperty({ description: "Array of file paths to delete", type: [String] })
  @IsArray()
  @IsString({ each: true })
  filePaths: string[];
}

export class FileResponseDto {
  @ApiProperty({ description: "Original filename" })
  originalName: string;

  @ApiProperty({ description: "Stored filename" })
  filename: string;

  @ApiProperty({ description: "File path" })
  path: string;

  @ApiProperty({ description: "Full URL to access the file" })
  url: string;

  @ApiProperty({ description: "File size in bytes" })
  size: number;

  @ApiProperty({ description: "File MIME type" })
  mimetype: string;
}
