import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SpecialsService } from "./specials.service";
import {
  CreateSpecialDto,
  UpdateSpecialDto,
  SpecialQueryDto,
  ReorderSpecialsDto,
} from "./dto/special.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Specials")
@Controller("specials")
@UseGuards(JwtAuthGuard)
export class SpecialsController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new special" })
  @ApiResponse({ status: 201, description: "Special created successfully" })
  create(@Body() createDto: CreateSpecialDto) {
    return this.specialsService.create(createDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all specials with optional filters" })
  @ApiResponse({ status: 200, description: "List of specials" })
  findAll(@Query() query: SpecialQueryDto) {
    return this.specialsService.findAll(query);
  }

  @Get("current")
  @Public()
  @ApiOperation({ summary: "Get currently active specials for today" })
  @ApiResponse({ status: 200, description: "List of current specials" })
  findCurrent() {
    return this.specialsService.findCurrent();
  }

  @Get("daily")
  @Public()
  @ApiOperation({ summary: "Get daily specials organized by day of week" })
  @ApiResponse({ status: 200, description: "Daily specials by day" })
  getDailySpecials() {
    return this.specialsService.getDailySpecials();
  }

  @Get("statistics")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get specials statistics" })
  @ApiResponse({ status: 200, description: "Specials statistics" })
  getStatistics() {
    return this.specialsService.getStatistics();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a special by ID" })
  @ApiResponse({ status: 200, description: "The special details" })
  @ApiResponse({ status: 404, description: "Special not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.specialsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a special" })
  @ApiResponse({ status: 200, description: "Special updated successfully" })
  @ApiResponse({ status: 404, description: "Special not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSpecialDto,
  ) {
    return this.specialsService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a special" })
  @ApiResponse({ status: 204, description: "Special deleted successfully" })
  @ApiResponse({ status: 404, description: "Special not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.specialsService.remove(id);
  }

  @Patch(":id/toggle-active")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle special active status" })
  @ApiResponse({ status: 200, description: "Special status toggled" })
  @ApiResponse({ status: 404, description: "Special not found" })
  toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.specialsService.toggleActive(id);
  }

  @Post("reorder")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reorder specials" })
  @ApiResponse({ status: 204, description: "Specials reordered successfully" })
  reorder(@Body() reorderDto: ReorderSpecialsDto) {
    return this.specialsService.reorder(reorderDto);
  }
}
