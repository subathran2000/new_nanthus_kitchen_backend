import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { UploadFolder, FileResponseDto } from "./dto/upload.dto";
import { sanitizeFilename } from "../../common/utils/sanitize";

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>("UPLOAD_PATH") || "./uploads";
    this.baseUrl =
      this.configService.get<string>("UPLOAD_BASE_URL") || "/uploads";
    this.maxFileSize =
      this.configService.get<number>("MAX_FILE_SIZE") || 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    // Ensure upload directories exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    const folders = Object.values(UploadFolder);
    for (const folder of folders) {
      const folderPath = path.join(this.uploadPath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder,
    customFilename?: string
  ): Promise<FileResponseDto> {
    this.validateFile(file);

    const ext = path.extname(file.originalname);
    
    // Sanitize custom filename to prevent path traversal attacks
    const safeCustomFilename = customFilename ? sanitizeFilename(customFilename) : null;
    const filename = safeCustomFilename
      ? `${safeCustomFilename}${ext}`
      : `${uuidv4()}${ext}`;

    const folderPath = path.join(this.uploadPath, folder);
    const filePath = path.join(folderPath, filename);

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    const relativePath = `${folder}/${filename}`;
    const url = `${this.baseUrl}/${relativePath}`;

    return {
      originalName: file.originalname,
      filename,
      path: relativePath,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: UploadFolder
  ): Promise<FileResponseDto[]> {
    const results: FileResponseDto[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
    }

    return results;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadPath, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    // Security check: ensure path is within upload directory
    const normalizedFullPath = path.normalize(fullPath);
    const normalizedUploadPath = path.normalize(this.uploadPath);

    if (!normalizedFullPath.startsWith(normalizedUploadPath)) {
      throw new BadRequestException("Invalid file path");
    }

    fs.unlinkSync(fullPath);
  }

  async deleteMultiple(
    filePaths: string[]
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const filePath of filePaths) {
      try {
        await this.deleteFile(filePath);
        deleted.push(filePath);
      } catch {
        failed.push(filePath);
      }
    }

    return { deleted, failed };
  }

  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    created?: Date;
    url?: string;
  }> {
    const fullPath = path.join(this.uploadPath, filePath);

    // Security check: ensure path is within upload directory
    const normalizedFullPath = path.normalize(fullPath);
    const normalizedUploadPath = path.normalize(this.uploadPath);

    if (!normalizedFullPath.startsWith(normalizedUploadPath)) {
      throw new BadRequestException("Invalid file path");
    }

    if (!fs.existsSync(fullPath)) {
      return { exists: false };
    }

    const stats = fs.statSync(fullPath);

    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      url: `${this.baseUrl}/${filePath}`,
    };
  }

  async listFiles(folder: UploadFolder): Promise<string[]> {
    // Validate folder is a known enum value to prevent path traversal
    if (!Object.values(UploadFolder).includes(folder)) {
      throw new BadRequestException("Invalid folder");
    }

    const folderPath = path.join(this.uploadPath, folder);

    // Security check: ensure resolved path is within uploads directory
    const normalizedFolderPath = path.normalize(folderPath);
    const normalizedUploadPath = path.normalize(this.uploadPath);

    if (!normalizedFolderPath.startsWith(normalizedUploadPath)) {
      throw new BadRequestException("Invalid folder path");
    }

    if (!fs.existsSync(folderPath)) {
      return [];
    }

    const files = fs.readdirSync(folderPath);
    return files.map((file) => `${folder}/${file}`);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(", ")}`
      );
    }
  }

  // Utility to get URL from stored path
  getUrl(filePath: string): string {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    return `${this.baseUrl}/${filePath}`;
  }

  // Process image URLs for entity
  processImageUrls(imageUrls: string[] | null): string[] {
    if (!imageUrls || !Array.isArray(imageUrls)) return [];
    return imageUrls.map((url) => this.getUrl(url));
  }
}
