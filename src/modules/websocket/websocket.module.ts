import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminWebSocketGateway } from "./websocket.gateway";

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error("JWT_SECRET environment variable is required");
        }
        return {
          secret,
          signOptions: {
            expiresIn: 86400, // 24 hours in seconds
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AdminWebSocketGateway],
  exports: [AdminWebSocketGateway],
})
export class WebSocketModule {}
