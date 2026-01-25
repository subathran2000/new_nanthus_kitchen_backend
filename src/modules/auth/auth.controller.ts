import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  AuthResponseDto,
  UpdateProfileDto,
} from "./dto/auth.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { User } from "../users/entities/user.entity";
import { UserRole } from "../../common/enums";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 900000 } }) // 50 attempts per 15 minutes
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(user);

    // Set cookies
    response.cookie(
      "access_token",
      result.accessToken,
      this.authService.getCookieOptions(),
    );
    response.cookie(
      "refresh_token",
      result.refreshToken,
      this.authService.getCookieOptions(true),
    );

    return result;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(user.id);

    // Clear cookies
    response.clearCookie("access_token");
    response.clearCookie("refresh_token");

    return result;
  }

  @Post("register")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register new user (admin only)" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  async register(
    @Body() registerDto: RegisterDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.authService.register(registerDto, currentUser);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  async getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post("refresh")
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 1000, ttl: 60000 } }) // Very high limit for refresh endpoint
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Tokens refreshed" })
  async refreshTokens(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens(user);

    // Set new cookies
    response.cookie(
      "access_token",
      tokens.accessToken,
      this.authService.getCookieOptions(),
    );
    response.cookie(
      "refresh_token",
      tokens.refreshToken,
      this.authService.getCookieOptions(true),
    );

    return tokens;
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post("forgot-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900000 } }) // 20 attempts per 15 minutes
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Password reset email sent" })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("reset-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post("verify-email")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email with token" })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post("resend-verification")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900000 } }) // 20 attempts per 15 minutes
  @ApiOperation({ summary: "Resend verification email" })
  @ApiResponse({ status: 200, description: "Verification email sent" })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(resendVerificationDto);
  }
}
