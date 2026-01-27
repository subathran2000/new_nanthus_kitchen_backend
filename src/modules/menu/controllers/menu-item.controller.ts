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
} from "@nestjs/swagger";
import { MenuItemService } from "../services/menu-item.service";
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemQueryDto,
  ToggleAvailabilityDto,
} from "../dto/menu-item.dto";
import { ReorderDto } from "../dto/category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { UserRole } from "../../../common/enums";

@ApiTags("Menu - Items")
@Controller("menu/items")
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new menu item" })
  @ApiResponse({ status: 201, description: "Menu item created" })
  async create(@Body() createDto: CreateMenuItemDto) {
    return this.menuItemService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all menu items with filters" })
  @ApiResponse({ status: 200, description: "List of menu items" })
  async findAll(@Query() query: MenuItemQueryDto) {
    return this.menuItemService.findAll(query);
  }

  @Get("statistics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get menu item statistics" })
  @ApiResponse({ status: 200, description: "Menu statistics" })
  async getStatistics() {
    return this.menuItemService.getStatistics();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a menu item by ID" })
  @ApiResponse({ status: 200, description: "Menu item details" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.menuItemService.findOne(id);
  }

  @Patch("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder menu items" })
  @ApiResponse({ status: 200, description: "Menu items reordered" })
  async reorder(@Body() reorderDto: ReorderDto) {
    await this.menuItemService.reorder(reorderDto);
    return { message: "Menu items reordered successfully" };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a menu item" })
  @ApiResponse({ status: 200, description: "Menu item updated" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMenuItemDto,
  ) {
    return this.menuItemService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a menu item" })
  @ApiResponse({ status: 200, description: "Menu item deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.menuItemService.remove(id);
    return { message: "Menu item deleted successfully" };
  }

  @Patch(":id/availability")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle menu item availability" })
  @ApiResponse({ status: 200, description: "Availability toggled" })
  async toggleAvailability(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() toggleDto: ToggleAvailabilityDto,
  ) {
    return this.menuItemService.toggleAvailability(id, toggleDto.isAvailable);
  }

  @Post(":id/duplicate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Duplicate a menu item" })
  @ApiResponse({ status: 201, description: "Menu item duplicated" })
  async duplicate(@Param("id", ParseUUIDPipe) id: string) {
    return this.menuItemService.duplicate(id);
  }

  @Post("bulk-availability")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk toggle availability for menu items" })
  @ApiResponse({ status: 200, description: "Bulk availability updated" })
  async bulkToggleAvailability(
    @Body() body: { ids: string[]; isAvailable: boolean },
  ) {
    await this.menuItemService.bulkToggleAvailability(
      body.ids,
      body.isAvailable,
    );
    return { message: "Availability updated for selected items" };
  }
}
