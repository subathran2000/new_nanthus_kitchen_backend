import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService } from "./health.service";

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

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }

  @Get("live")
  @Public()
  @ApiOperation({ summary: "Liveness probe" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  live(): { status: string } {
    return { status: "ok" };
  }

  @Get("ready")
  @Public()
  @ApiOperation({ summary: "Readiness probe" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async ready(): Promise<{ status: string; database: string }> {
    const dbStatus = await this.healthService.checkDatabase();
    return {
      status: dbStatus ? "ok" : "error",
      database: dbStatus ? "connected" : "disconnected",
    };
  }
}
