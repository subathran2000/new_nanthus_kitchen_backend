import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  environment: string;
  database: {
    status: "connected" | "disconnected";
    responseTime?: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  version: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<HealthCheckResponse> {
    const dbCheck = await this.checkDatabaseWithTiming();
    const memoryUsage = process.memoryUsage();

    const status = dbCheck.status === "connected" ? "ok" : "error";

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.get<string>("NODE_ENV", "development"),
      database: dbCheck,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      version: "1.0.0",
    };
  }

  async checkDatabase(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        return false;
      }
      await this.dataSource.query("SELECT 1");
      return true;
    } catch (error) {
      this.logger.error("Database health check failed", error);
      return false;
    }
  }

  private async checkDatabaseWithTiming(): Promise<{
    status: "connected" | "disconnected";
    responseTime?: number;
  }> {
    const start = Date.now();
    try {
      if (!this.dataSource.isInitialized) {
        return { status: "disconnected" };
      }
      await this.dataSource.query("SELECT 1");
      return {
        status: "connected",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error("Database health check failed", error);
      return { status: "disconnected" };
    }
  }
}
