import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UserRole } from "../../common/enums";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Normalize email to lowercase
    const normalizedEmail = createUserDto.email.toLowerCase().trim();

    const existingUser = await this.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const user = this.userRepository.create({
      ...createUserDto,
      email: normalizedEmail, // Store normalized email
      emailVerificationToken: uuidv4(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return this.userRepository.save(user);
  }

  async findAll(currentUser: User): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    // Super admin can see all users
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return queryBuilder.orderBy("user.createdAt", "DESC").getMany();
    }

    // Admin can see visitors and managers
    if (currentUser.role === UserRole.ADMIN) {
      return queryBuilder
        .where("user.role IN (:...roles)", {
          roles: [UserRole.VISITOR, UserRole.MANAGER],
        })
        .orderBy("user.createdAt", "DESC")
        .getMany();
    }

    // Manager can only see visitors
    if (currentUser.role === UserRole.MANAGER) {
      return queryBuilder
        .where("user.role = :role", { role: UserRole.VISITOR })
        .orderBy("user.createdAt", "DESC")
        .getMany();
    }

    // Visitors can only see themselves
    return queryBuilder
      .where("user.id = :id", { id: currentUser.id })
      .getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    return this.userRepository.findOne({ where: { email: normalizedEmail } });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { refreshToken } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Check permissions
    this.checkUpdatePermissions(currentUser, user, updateUserDto);

    // Check email uniqueness if updating email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException("User with this email already exists");
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.findOne(id);

    // Cannot delete yourself
    if (user.id === currentUser.id) {
      throw new ForbiddenException("You cannot delete yourself");
    }

    // Super admin can delete anyone except other super admins
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException("Cannot delete another super admin");
      }
      await this.userRepository.remove(user);
      return;
    }

    // Admin can delete visitors and managers
    if (currentUser.role === UserRole.ADMIN) {
      if (user.role !== UserRole.VISITOR && user.role !== UserRole.MANAGER) {
        throw new ForbiddenException(
          "Admins can only delete visitors and managers",
        );
      }
      await this.userRepository.remove(user);
      return;
    }

    // Manager can only delete visitors
    if (currentUser.role === UserRole.MANAGER) {
      if (user.role !== UserRole.VISITOR) {
        throw new ForbiddenException("Managers can only delete visitors");
      }
      await this.userRepository.remove(user);
      return;
    }

    throw new ForbiddenException("You do not have permission to delete users");
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    // Hash the refresh token before storing for security
    const hashedToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.userRepository.update(userId, { refreshToken: hashedToken });
  }

  /**
   * Validate a refresh token against the stored hash
   */
  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findOne(userId);
    if (!user.refreshToken) {
      return false;
    }
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);
  }

  async setPasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    await this.userRepository.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    return token;
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async setEmailVerificationToken(userId: string): Promise<string> {
    const token = uuidv4();
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    return token;
  }

  async deactivate(id: string, currentUser: User): Promise<User> {
    const user = await this.findOne(id);

    // Cannot deactivate yourself
    if (user.id === currentUser.id) {
      throw new ForbiddenException("You cannot deactivate yourself");
    }

    // Check permissions based on role
    if (currentUser.role === UserRole.ADMIN) {
      if (user.role !== UserRole.VISITOR && user.role !== UserRole.MANAGER) {
        throw new ForbiddenException(
          "Admins can only deactivate visitors and managers",
        );
      }
    } else if (currentUser.role === UserRole.MANAGER) {
      if (user.role !== UserRole.VISITOR) {
        throw new ForbiddenException("Managers can only deactivate visitors");
      }
    }

    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  private checkUpdatePermissions(
    currentUser: User,
    targetUser: User,
    updateDto: UpdateUserDto,
  ): void {
    // Super admin can update anyone
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Users can update themselves (except role and isActive)
    if (currentUser.id === targetUser.id) {
      if (updateDto.role || updateDto.isActive !== undefined) {
        throw new ForbiddenException(
          "You cannot change your own role or active status",
        );
      }
      return;
    }

    // Admin can update visitors and managers
    if (currentUser.role === UserRole.ADMIN) {
      if (
        targetUser.role !== UserRole.VISITOR &&
        targetUser.role !== UserRole.MANAGER
      ) {
        throw new ForbiddenException(
          "Admins can only update visitors and managers",
        );
      }
      // Admin cannot promote users to admin or super_admin
      if (
        updateDto.role &&
        updateDto.role !== UserRole.VISITOR &&
        updateDto.role !== UserRole.MANAGER
      ) {
        throw new ForbiddenException(
          "Admins cannot promote users to admin roles",
        );
      }
      return;
    }

    // Manager can only update visitors
    if (currentUser.role === UserRole.MANAGER) {
      if (targetUser.role !== UserRole.VISITOR) {
        throw new ForbiddenException("Managers can only update visitors");
      }
      // Manager cannot change roles
      if (updateDto.role && updateDto.role !== UserRole.VISITOR) {
        throw new ForbiddenException("Managers cannot change user roles");
      }
      return;
    }

    throw new ForbiddenException(
      "You do not have permission to update this user",
    );
  }
}
