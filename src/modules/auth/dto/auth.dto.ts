import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../../common/enums";

export class LoginDto {
  @ApiProperty({ example: "admin@nanthuskitchen.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Admin@123!" })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Password123!" })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number or special character",
  })
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, required: false, example: UserRole.VISITOR })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "CurrentPassword123!" })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number or special character",
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number or special character",
  })
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: "John", required: false })
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({ example: "Doe", required: false })
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({ example: "john.doe@example.com", required: false })
  @IsEmail()
  email?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
}
