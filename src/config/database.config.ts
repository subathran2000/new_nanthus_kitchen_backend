import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const password = configService.get<string>("DATABASE_PASSWORD");
  if (!password) {
    throw new Error("DATABASE_PASSWORD environment variable is required");
  }

  return {
    type: "postgres",
    host: configService.get<string>("DATABASE_HOST", "localhost"),
    port: configService.get<number>("DATABASE_PORT", 5432),
    username: configService.get<string>("DATABASE_USER", "postgres"),
    password,
    database: configService.get<string>("DATABASE_NAME", "nanthus_kitchen"),
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    synchronize: false, // Always use migrations
    logging:
      configService.get<string>("NODE_ENV") === "development"
        ? true
        : ["error", "warn"], // Log errors in production
    ssl:
      configService.get<string>("NODE_ENV") === "production"
        ? {
            rejectUnauthorized:
              configService.get<string>("DATABASE_SSL_REJECT_UNAUTHORIZED") !== "false",
            ca: configService.get<string>("DATABASE_SSL_CA") || undefined,
          }
        : false,
    // Connection pool settings
    extra: {
      max: configService.get<number>("DATABASE_POOL_SIZE", 20),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };
};
