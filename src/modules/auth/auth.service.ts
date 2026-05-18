import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { EmailService } from "../email/email.service";
import { User } from "../users/entities/user.entity";
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { UserRole } from "../../common/enums";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new ForbiddenException("Your account has been deactivated");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async register(registerDto: RegisterDto, currentUser?: User) {
    // Determine the role based on who's creating and what's provided
    let role = UserRole.VISITOR;

    if (currentUser) {
      if (currentUser.role === UserRole.SUPER_ADMIN) {
        // Super admin can create any role they specify
        role = registerDto.role || UserRole.VISITOR;
      } else if (currentUser.role === UserRole.ADMIN) {
        // Admin can create visitors and managers
        if (registerDto.role && 
            registerDto.role !== UserRole.VISITOR && 
            registerDto.role !== UserRole.MANAGER) {
          throw new ForbiddenException(
            "Admins can only create visitor or manager accounts",
          );
        }
        role = registerDto.role || UserRole.VISITOR;
      } else if (currentUser.role === UserRole.MANAGER) {
        // Manager can only create visitors
        if (registerDto.role && registerDto.role !== UserRole.VISITOR) {
          throw new ForbiddenException(
            "Managers can only create visitor accounts",
          );
        }
        role = UserRole.VISITOR;
      }
    }

    const user = await this.usersService.create({
      ...registerDto,
      role,
      isActive:
        registerDto.isActive !== undefined ? registerDto.isActive : true,
    });

    // Send verification email
    if (user.emailVerificationToken) {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        user.emailVerificationToken,
      );
    }

    return {
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: "Logged out successfully" };
  }

  async refreshTokens(user: User) {
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);

    const isPasswordValid = await user.comparePassword(
      changePasswordDto.currentPassword,
    );

    if (!isPasswordValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    await this.usersService.updatePassword(
      userId,
      changePasswordDto.newPassword,
    );

    return { message: "Password changed successfully" };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    // Normalize email for lookup
    const normalizedEmail = forgotPasswordDto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      // Don't reveal whether email exists
      return {
        message: "If the email exists, a password reset link has been sent",
      };
    }

    const resetToken = await this.usersService.setPasswordResetToken(user.id);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
    );

    return {
      message: "If the email exists, a password reset link has been sent",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    await this.usersService.updatePassword(
      user.id,
      resetPasswordDto.newPassword,
    );

    return { message: "Password reset successfully" };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findByEmailVerificationToken(
      verifyEmailDto.token,
    );

    if (!user) {
      throw new BadRequestException("Invalid verification token");
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException("Verification token has expired");
    }

    await this.usersService.verifyEmail(user.id);

    return { message: "Email verified successfully" };
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto) {
    const user = await this.usersService.findByEmail(
      resendVerificationDto.email,
    );

    if (!user) {
      // Don't reveal whether email exists
      return {
        message:
          "If the email exists and is not verified, a new verification link has been sent",
      };
    }

    if (user.isEmailVerified) {
      return { message: "Email is already verified" };
    }

    const verificationToken = await this.usersService.setEmailVerificationToken(
      user.id,
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken,
    );

    return {
      message:
        "If the email exists and is not verified, a new verification link has been sent",
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findOne(userId);

    // Check email uniqueness if updating email
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
      if (existingUser) {
        throw new BadRequestException("Email is already in use");
      }
    }

    const updatedUser = await this.usersService.update(
      userId,
      updateProfileDto,
      user,
    );

    return {
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
    };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const jwtRefreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");

    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    if (!jwtRefreshSecret) {
      throw new Error("JWT_REFRESH_SECRET environment variable is required");
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: 86400, // 24 hours in seconds
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: 604800, // 7 days in seconds
      }),
    ]);

    return { accessToken, refreshToken };
  }

  getCookieOptions(isRefreshToken = false) {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const isProduction = nodeEnv === "production";
    
    // Get URLs for cross-origin detection
    const frontendUrl = this.configService.get<string>("FRONTEND_URL", "");
    const backendUrl = this.configService.get<string>("BACKEND_URL", "");
    
    // Check if we're using HTTPS (secure context)
    // Also check for FORCE_HTTPS env variable for reverse proxy setups (nginx with SSL termination)
    const forceHttps = this.configService.get<string>("FORCE_HTTPS", "false") === "true";
    const isHttps = forceHttps || backendUrl.startsWith("https://") || frontendUrl.startsWith("https://");
    
    // Check if frontend and backend are on the same origin (same domain/subdomain)
    // When using nginx proxy, both will be same-origin, enabling lax cookies
    const isSameOrigin = this.configService.get<string>("SAME_ORIGIN_COOKIES", "true") === "true";
    
    // Cookie configuration for different deployment scenarios:
    // 1. Same-origin (nginx proxy): sameSite: "lax" works perfectly on HTTP or HTTPS
    // 2. Cross-origin with HTTPS: sameSite: "none" + secure: true required
    // 3. Cross-origin with HTTP: Cookies won't work properly (browser limitation)
    
    // For VPS/PM2 deployment with nginx proxy (same-origin):
    // - Use sameSite: "lax" which works on HTTP
    // - Don't require secure flag unless HTTPS
    
    let sameSite: "lax" | "strict" | "none";
    let secure: boolean;
    
    if (isSameOrigin) {
      // Same-origin setup (nginx proxying /api to backend)
      // This is the recommended VPS setup - works on HTTP or HTTPS
      sameSite = "lax";
      secure = isHttps;
    } else if (isHttps) {
      // Cross-origin with HTTPS - required for cross-site cookies
      sameSite = "none";
      secure = true;
    } else {
      // Cross-origin without HTTPS - this won't work well
      // Modern browsers block cross-site cookies without secure flag
      // Log a warning in production
      if (isProduction) {
        console.warn(
          "[Auth] Cross-origin cookies on HTTP are not supported by modern browsers. " +
          "Either use HTTPS or configure nginx to proxy API requests (same-origin)."
        );
      }
      sameSite = "lax";
      secure = false;
    }
    
    return {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: isRefreshToken
        ? 7 * 24 * 60 * 60 * 1000 // 7 days
        : 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
      // Domain setting - only set if explicitly configured for subdomain cookies
      ...(this.configService.get<string>("COOKIE_DOMAIN") && {
        domain: this.configService.get<string>("COOKIE_DOMAIN"),
      }),
    };
  }
}
