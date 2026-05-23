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
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MenuCategoryService } from "../services/menu-category.service";
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  ReorderDto,
} from "../dto/category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { UserRole } from "../../../common/enums";

@ApiTags("Menu - Categories")
@Controller("menu/categories")
export class MenuCategoryController {
  constructor(private readonly menuCategoryService: MenuCategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new menu category" })
  @ApiResponse({ status: 201, description: "Menu category created" })
  async create(@Body() createDto: CreateMenuCategoryDto) {
    return this.menuCategoryService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all menu categories" })
  @ApiQuery({ name: "primaryCategoryId", required: false })
  @ApiQuery({ name: "location", required: false, enum: ["scarborough", "markham"] })
  @ApiResponse({ status: 200, description: "List of menu categories" })
  async findAll(
    @Query("primaryCategoryId") primaryCategoryId?: string,
    @Query("location") location?: string,
  ) {
    return this.menuCategoryService.findAll(primaryCategoryId, location);
  }

  @Get("statistics")
  @Public()
  @ApiOperation({ summary: "Get menu categories statistics" })
  @ApiResponse({ status: 200, description: "Category statistics" })
  async getStatistics() {
    return this.menuCategoryService.getStatistics();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a menu category by ID" })
  @ApiResponse({ status: 200, description: "Menu category details" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.menuCategoryService.findOne(id);
  }

  @Patch("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder menu categories" })
  @ApiResponse({ status: 200, description: "Menu categories reordered" })
  async reorder(@Body() reorderDto: ReorderDto) {
    await this.menuCategoryService.reorder(reorderDto);
    return { message: "Menu categories reordered successfully" };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a menu category" })
  @ApiResponse({ status: 200, description: "Menu category updated" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMenuCategoryDto,
  ) {
    return this.menuCategoryService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a menu category" })
  @ApiResponse({ status: 200, description: "Menu category deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.menuCategoryService.remove(id);
    return { message: "Menu category deleted successfully" };
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle menu category active status" })
  @ApiResponse({ status: 200, description: "Status toggled" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.menuCategoryService.toggleActive(id);
  }
}
