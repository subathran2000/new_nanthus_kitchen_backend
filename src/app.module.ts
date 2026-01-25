import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

// Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { MenuModule } from "./modules/menu/menu.module";
import { EventsModule } from "./modules/events/events.module";
import { SpecialsModule } from "./modules/specials/specials.module";
import { OpeningHoursModule } from "./modules/opening-hours/opening-hours.module";
import { NewsletterModule } from "./modules/newsletter/newsletter.module";
import { UploadModule } from "./modules/upload/upload.module";
import { EmailModule } from "./modules/email/email.module";
import { WebSocketModule } from "./modules/websocket/websocket.module";
import { HealthModule } from "./modules/health/health.module";

// Configuration
import configuration from "./config/configuration";
import { databaseConfig } from "./config/database.config";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("THROTTLE_TTL", 60000),
            limit: config.get<number>("THROTTLE_LIMIT", 100),
          },
        ],
      }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    MenuModule,
    EventsModule,
    SpecialsModule,
    OpeningHoursModule,
    NewsletterModule,
    UploadModule,
    EmailModule,
    WebSocketModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
