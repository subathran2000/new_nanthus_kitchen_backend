import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UsersService } from "../../users/users.service";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: Request) => {
          const token = request?.cookies?.access_token;
          if (!token) {
            // Log when token is missing for debugging
            const logger = new Logger("JwtStrategy");
            logger.debug(`No access_token cookie found. Cookies: ${JSON.stringify(Object.keys(request?.cookies || {}))}`);
          }
          return token;
        },
        // Then try Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    this.logger.debug(`Validating JWT for user: ${payload.email}`);
    
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      this.logger.warn(`User not found or inactive: ${payload.sub}`);
      throw new UnauthorizedException("User not found or inactive");
    }

    return user;
  }
}
