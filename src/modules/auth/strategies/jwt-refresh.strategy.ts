import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh"
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    const refreshSecret = configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET environment variable is required");
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: Request) => {
          const token = request?.cookies?.refresh_token;
          if (!token) {
            const logger = new Logger("JwtRefreshStrategy");
            logger.debug(`No refresh_token cookie found. Cookies: ${JSON.stringify(Object.keys(request?.cookies || {}))}`);
          }
          return token;
        },
        // Then try from body
        (request: Request) => {
          return request?.body?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true as const,
    });
  }

  async validate(request: Request, payload: { sub: string; email: string }) {
    this.logger.debug(`Validating refresh token for user: ${payload.email}`);
    
    const refreshToken =
      request?.cookies?.refresh_token || request?.body?.refreshToken;

    if (!refreshToken) {
      this.logger.warn("Refresh token not found in cookies or body");
      throw new UnauthorizedException("Refresh token not found");
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      this.logger.warn(`User not found or inactive: ${payload.sub}`);
      throw new UnauthorizedException("User not found or inactive");
    }

    // Validate refresh token using secure hash comparison
    const isValidToken = await this.usersService.validateRefreshToken(payload.sub, refreshToken);
    if (!isValidToken) {
      this.logger.warn("Refresh token mismatch");
      throw new UnauthorizedException("Invalid refresh token");
    }

    return user;
  }
}
