import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import * as cookieParser from "cookie-parser";
import { join } from "path";
import * as express from "express";
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { CustomLogger } from "./common/logger/custom-logger";

async function bootstrap() {
  const customLogger = new CustomLogger("Bootstrap");
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === "production"
        ? ["error", "warn", "log"]
        : ["error", "warn", "log", "debug", "verbose"],
  });
  const configService = app.get(ConfigService);

  // Validate required environment variables
  const requiredEnvVars = [
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "DATABASE_PASSWORD",
  ];
  for (const envVar of requiredEnvVars) {
    const value = configService.get<string>(envVar);
    if (!value) {
      logger.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
    // Validate JWT secrets are strong enough (at least 32 characters)
    if (
      (envVar === "JWT_SECRET" || envVar === "JWT_REFRESH_SECRET") &&
      value.length < 32
    ) {
      logger.error(
        `${envVar} must be at least 32 characters long for security`,
      );
      process.exit(1);
    }
  }

  // Security - configure helmet with comprehensive headers
  const isProduction = configService.get<string>("NODE_ENV") === "production";
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isProduction ? undefined : false,
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
    }),
  );
  app.use(cookieParser());

  // Request timeout middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(30000, () => {
      res.status(408).json({ message: "Request timeout" });
    });
    next();
  });

  // CORS
  const frontendUrl = configService.get<string>(
    "FRONTEND_URL",
    "http://localhost:5173",
  );
  const allowedOrigins = frontendUrl.split(",").map((url) => url.trim());

  // Log configured origins for debugging
  logger.log(`Configured CORS origins: ${allowedOrigins.join(", ")}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, log but allow the request
        if (!isProduction) {
          logger.warn(
            `CORS: Allowing unlisted origin in development: ${origin}`,
          );
          callback(null, true);
        } else {
          logger.warn(
            `CORS: Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`,
          );
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // Global prefix
  const apiPrefix = configService.get<string>("API_PREFIX", "api");
  app.setGlobalPrefix(apiPrefix);

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Ensure upload directories exist
  const uploadsPath = join(__dirname, "..", "uploads");
  const uploadDirs = ["events", "general", "menu", "newsletter", "specials"];
  for (const dir of uploadDirs) {
    const dirPath = join(uploadsPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.log(`Created upload directory: ${dirPath}`);
    }
  }

  // Static files for uploads with CORS headers
  app.use(
    "/uploads",
    (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );

      // Handle preflight
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    },
    express.static(uploadsPath),
  );

  // Swagger documentation
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("New Nanthu's Kitchen API")
      .setDescription("Restaurant Management System API Documentation")
      .setVersion("1.0")
      .addBearerAuth()
      .addCookieAuth("access_token")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const port = configService.get<number>("PORT", 3000);

  // Graceful shutdown
  const server = await app.listen(port);

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      logger.log("HTTP server closed");
      await app.close();
      logger.log("Application closed");
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error(
        "Could not close connections in time, forcefully shutting down",
      );
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  if (!isProduction) {
    logger.log(
      `📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}

bootstrap();
