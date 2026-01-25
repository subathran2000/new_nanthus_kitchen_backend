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
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./dto/user.dto";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    type: UserResponseDto,
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    // Admin can only create visitors
    if (currentUser.role === UserRole.ADMIN) {
      createUserDto.role = UserRole.VISITOR;
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({
    status: 200,
    description: "List of users",
    type: [UserResponseDto],
  })
  async findAll(@CurrentUser() currentUser: User): Promise<User[]> {
    return this.usersService.findAll(currentUser);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({
    status: 200,
    description: "User details",
    type: UserResponseDto,
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    // Users can only view themselves unless they're admin/super_admin
    if (currentUser.role === UserRole.VISITOR && currentUser.id !== id) {
      return this.usersService.findOne(currentUser.id);
    }
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
    type: UserResponseDto,
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User
  ): Promise<void> {
    return this.usersService.remove(id, currentUser);
  }

  @Patch(":id/deactivate")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Deactivate user" })
  @ApiResponse({
    status: 200,
    description: "User deactivated successfully",
    type: UserResponseDto,
  })
  async deactivate(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    return this.usersService.deactivate(id, currentUser);
  }

  @Patch(":id/activate")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Activate user" })
  @ApiResponse({
    status: 200,
    description: "User activated successfully",
    type: UserResponseDto,
  })
  async activate(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.activate(id);
  }
}
