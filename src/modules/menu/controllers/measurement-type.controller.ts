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
import { MeasurementTypeService } from "../services/measurement-type.service";
import {
  CreateMeasurementTypeDto,
  UpdateMeasurementTypeDto,
} from "../dto/category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { UserRole } from "../../../common/enums";

@ApiTags("Menu - Measurement Types")
@Controller("measurements")
export class MeasurementTypeController {
  constructor(
    private readonly measurementTypeService: MeasurementTypeService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new measurement type" })
  @ApiResponse({ status: 201, description: "Measurement type created" })
  async create(@Body() createDto: CreateMeasurementTypeDto) {
    return this.measurementTypeService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Get all measurement types" })
  @ApiResponse({ status: 200, description: "List of measurement types" })
  async findAll() {
    return this.measurementTypeService.findAll();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a measurement type by ID" })
  @ApiResponse({ status: 200, description: "Measurement type details" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.measurementTypeService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a measurement type" })
  @ApiResponse({ status: 200, description: "Measurement type updated" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMeasurementTypeDto
  ) {
    return this.measurementTypeService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a measurement type" })
  @ApiResponse({ status: 200, description: "Measurement type deleted" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.measurementTypeService.remove(id);
    return { message: "Measurement type deleted successfully" };
  }
}
