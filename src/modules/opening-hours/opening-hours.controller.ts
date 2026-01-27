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
  ApiQuery,
} from "@nestjs/swagger";
import { OpeningHoursService } from "./opening-hours.service";
import {
  CreateOpeningHoursDto,
  UpdateOpeningHoursDto,
  BulkUpdateOpeningHoursDto,
  OpeningHoursQueryDto,
} from "./dto/opening-hours.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Opening Hours")
@Controller("opening-hours")
@UseGuards(JwtAuthGuard)
export class OpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create opening hours entry" })
  @ApiResponse({
    status: 201,
    description: "Opening hours created successfully",
  })
  create(@Body() createDto: CreateOpeningHoursDto) {
    return this.openingHoursService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all opening hours" })
  @ApiResponse({ status: 200, description: "List of opening hours" })
  findAll(@Query() query: OpeningHoursQueryDto) {
    return this.openingHoursService.findAll(query);
  }

  @Get("today/:location")
  @Public()
  @ApiOperation({ summary: "Get today's hours for a location" })
  @ApiResponse({ status: 200, description: "Today's opening hours" })
  getToday(@Param("location") location: "markham" | "scarborough") {
    return this.openingHoursService.getToday(location);
  }

  @Get("status/:location")
  @Public()
  @ApiOperation({ summary: "Check if currently open" })
  @ApiResponse({ status: 200, description: "Open/closed status" })
  isCurrentlyOpen(@Param("location") location: "markham" | "scarborough") {
    return this.openingHoursService.isCurrentlyOpen(location);
  }

  @Get("location/:location")
  @Public()
  @ApiOperation({ summary: "Get all hours for a location" })
  @ApiResponse({
    status: 200,
    description: "List of opening hours for location",
  })
  findByLocation(@Param("location") location: "markham" | "scarborough") {
    return this.openingHoursService.findByLocation(location);
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get opening hours by ID" })
  @ApiResponse({ status: 200, description: "The opening hours details" })
  @ApiResponse({ status: 404, description: "Opening hours not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.openingHoursService.findOne(id);
  }

  @Patch("bulk")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk update opening hours" })
  @ApiResponse({
    status: 200,
    description: "Opening hours updated successfully",
  })
  bulkUpdate(@Body() bulkDto: BulkUpdateOpeningHoursDto) {
    return this.openingHoursService.bulkUpdate(bulkDto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update opening hours" })
  @ApiResponse({
    status: 200,
    description: "Opening hours updated successfully",
  })
  @ApiResponse({ status: 404, description: "Opening hours not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOpeningHoursDto,
  ) {
    return this.openingHoursService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete opening hours" })
  @ApiResponse({
    status: 204,
    description: "Opening hours deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Opening hours not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.openingHoursService.remove(id);
  }

  @Post("initialize/:location")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Initialize default hours for a location" })
  @ApiResponse({ status: 201, description: "Default hours initialized" })
  initializeDefault(@Param("location") location: "markham" | "scarborough") {
    return this.openingHoursService.initializeDefault(location);
  }

  @Post("cleanup-duplicates")
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Clean up duplicate opening hours records" })
  @ApiResponse({
    status: 200,
    description: "Duplicates cleaned up successfully",
  })
  cleanupDuplicates() {
    return this.openingHoursService.cleanupDuplicates();
  }
}
