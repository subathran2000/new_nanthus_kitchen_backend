import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import {
  UploadFolder,
  UploadFileDto,
  DeleteFileDto,
  DeleteMultipleFilesDto,
} from "./dto/upload.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Upload")
@Controller("upload")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("single")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a single file" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        folder: {
          type: "string",
          enum: Object.values(UploadFolder),
        },
        customFilename: {
          type: "string",
        },
      },
      required: ["file", "folder"],
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file or parameters" })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.uploadService.uploadFile(file, dto.folder, dto.customFilename);
  }

  @Post("multiple")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload multiple files (max 10)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
        },
        folder: {
          type: "string",
          enum: Object.values(UploadFolder),
        },
      },
      required: ["files", "folder"],
    },
  })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid files or parameters" })
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body("folder") folder: UploadFolder,
  ) {
    return this.uploadService.uploadMultiple(files, folder);
  }

  @Delete("single")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a single file" })
  @ApiResponse({ status: 204, description: "File deleted successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  deleteFile(@Body() dto: DeleteFileDto) {
    return this.uploadService.deleteFile(dto.filePath);
  }

  @Delete("multiple")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Delete multiple files" })
  @ApiResponse({ status: 200, description: "Deletion results" })
  deleteMultiple(@Body() dto: DeleteMultipleFilesDto) {
    return this.uploadService.deleteMultiple(dto.filePaths);
  }

  @Get("info/:folder/:filename")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Get file information" })
  @ApiResponse({ status: 200, description: "File information" })
  getFileInfo(
    @Param("folder") folder: UploadFolder,
    @Param("filename") filename: string,
  ) {
    return this.uploadService.getFileInfo(`${folder}/${filename}`);
  }

  @Get("list/:folder")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "List files in a folder" })
  @ApiResponse({ status: 200, description: "List of files" })
  listFiles(@Param("folder") folder: UploadFolder) {
    return this.uploadService.listFiles(folder);
  }
}
