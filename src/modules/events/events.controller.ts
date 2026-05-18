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
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { EventsService } from "./events.service";
import { CreateEventDto, UpdateEventDto, EventQueryDto } from "./dto/event.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new event" })
  @ApiResponse({ status: 201, description: "Event created" })
  async create(@Body() createDto: CreateEventDto) {
    return this.eventsService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all events with filters" })
  @ApiResponse({ status: 200, description: "List of events" })
  async findAll(@Query() query: EventQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Get("upcoming")
  @Public()
  @ApiOperation({ summary: "Get upcoming events (public)" })
  @ApiResponse({ status: 200, description: "List of upcoming events" })
  async findUpcoming(@Query("limit") limit?: number) {
    return this.eventsService.findUpcoming(limit || 10);
  }

  @Get("statistics")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get event statistics" })
  @ApiResponse({ status: 200, description: "Event statistics" })
  async getStatistics() {
    return this.eventsService.getStatistics();
  }

  @Get("calendar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get events for calendar view" })
  @ApiResponse({ status: 200, description: "Events for calendar" })
  async getCalendarEvents(
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid date format for start or end parameter");
    }

    return this.eventsService.findByDateRange(startDate, endDate);
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get an event by ID" })
  @ApiResponse({ status: 200, description: "Event details" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update an event" })
  @ApiResponse({ status: 200, description: "Event updated" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete an event" })
  @ApiResponse({ status: 200, description: "Event deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.eventsService.remove(id);
    return { message: "Event deleted successfully" };
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle event active status" })
  @ApiResponse({ status: 200, description: "Status toggled" })
  async toggleActive(@Param("id", ParseUUIDPipe) id: string) {
    return this.eventsService.toggleActive(id);
  }
}
