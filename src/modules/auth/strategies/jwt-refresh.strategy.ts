import { Injectable, UnauthorizedException } from "@nestjs/common";
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
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    const refreshSecret =
      configService.get<string>("JWT_REFRESH_SECRET") ||
      "default-refresh-secret";
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: Request) => {
          return request?.cookies?.refresh_token;
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
    const refreshToken =
      request?.cookies?.refresh_token || request?.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return user;
  }
}
