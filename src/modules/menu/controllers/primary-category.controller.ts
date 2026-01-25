import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PrimaryCategoryService } from "../services/primary-category.service";
import {
  CreatePrimaryCategoryDto,
  UpdatePrimaryCategoryDto,
  ReorderDto,
} from "../dto/category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { UserRole } from "../../../common/enums";

@ApiTags("Menu - Primary Categories")
@Controller("menu/primary-categories")
export class PrimaryCategoryController {
  constructor(
    private readonly primaryCategoryService: PrimaryCategoryService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new primary category" })
  @ApiResponse({ status: 201, description: "Primary category created" })
  async create(@Body() createDto: CreatePrimaryCategoryDto) {
    return this.primaryCategoryService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all primary categories" })
  @ApiResponse({ status: 200, description: "List of primary categories" })
  async findAll() {
    return this.primaryCategoryService.findAll();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a primary category by ID" })
  @ApiResponse({ status: 200, description: "Primary category details" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.primaryCategoryService.findOne(id);
  }

  @Patch("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder primary categories" })
  @ApiResponse({ status: 200, description: "Primary categories reordered" })
  async reorder(@Body() reorderDto: ReorderDto) {
    await this.primaryCategoryService.reorder(reorderDto);
    return { message: "Primary categories reordered successfully" };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a primary category" })
  @ApiResponse({ status: 200, description: "Primary category updated" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePrimaryCategoryDto
  ) {
    return this.primaryCategoryService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a primary category" })
  @ApiResponse({ status: 200, description: "Primary category deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.primaryCategoryService.remove(id);
    return { message: "Primary category deleted successfully" };
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle primary category active status" })
  @ApiResponse({ status: 200, description: "Status toggled" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.primaryCategoryService.toggleActive(id);
  }
}
