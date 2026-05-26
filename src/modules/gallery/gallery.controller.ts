import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GalleryService } from "./gallery.service";
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
  GalleryItemQueryDto,
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
  GalleryCategoryQueryDto,
} from "./dto/gallery.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "../../common/enums";

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER] as const;

@ApiTags("Gallery")
@Controller("gallery")
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC routes
  // ════════════════════════════════════════════════════════════════════════════

  @Get("public/grouped")
  @Public()
  @ApiOperation({ summary: "Get active gallery items grouped by section/category" })
  findPublicGrouped() {
    return this.galleryService.findPublicGrouped();
  }

  @Get("public/categories")
  @Public()
  @ApiOperation({ summary: "Get all active gallery categories" })
  findPublicCategories() {
    return this.galleryService.findPublicCategories();
  }

  @Get("public/items")
  @Public()
  @ApiOperation({ summary: "Get active gallery items (optionally filtered by categoryId)" })
  findPublicItems(@Query() query: GalleryItemQueryDto) {
    return this.galleryService.findPublicItems(query);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ADMIN — Category management
  // ════════════════════════════════════════════════════════════════════════════

  @Get("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all gallery categories (admin)" })
  findAllCategories(@Query() query: GalleryCategoryQueryDto) {
    return this.galleryService.findAllCategories(query);
  }

  @Get("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get gallery category by ID" })
  findOneCategory(@Param("id") id: string) {
    return this.galleryService.findOneCategory(id);
  }

  @Post("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create gallery category / section" })
  @ApiResponse({ status: 201, description: "Category created" })
  createCategory(@Body() dto: CreateGalleryCategoryDto) {
    return this.galleryService.createCategory(dto);
  }

  @Patch("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update gallery category" })
  updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateGalleryCategoryDto,
  ) {
    return this.galleryService.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete gallery category (items become uncategorised)" })
  removeCategory(@Param("id") id: string) {
    return this.galleryService.removeCategory(id);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ADMIN — Item management
  // ════════════════════════════════════════════════════════════════════════════

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all gallery items (admin)" })
  findAllItems(@Query() query: GalleryItemQueryDto) {
    return this.galleryService.findAllItems(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get gallery item by ID" })
  findOneItem(@Param("id") id: string) {
    return this.galleryService.findOneItem(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create gallery item" })
  @ApiResponse({ status: 201, description: "Gallery item created" })
  createItem(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.createItem(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update gallery item" })
  updateItem(@Param("id") id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.galleryService.updateItem(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete gallery item and remove its file" })
  removeItem(@Param("id") id: string) {
    return this.galleryService.removeItem(id);
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle active state" })
  toggleActive(@Param("id") id: string) {
    return this.galleryService.toggleItemActive(id);
  }
}
