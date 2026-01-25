import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

// WebSocket event data types
interface WebSocketEventData {
  timestamp: Date;
  [key: string]: unknown;
}

interface MenuUpdateData extends WebSocketEventData {
  type: "category" | "item" | "primaryCategory";
  action: "created" | "updated" | "deleted";
  data: Record<string, unknown>;
}

interface NewsletterUpdateData extends WebSocketEventData {
  type: "subscriber" | "campaign";
  action: "created" | "updated" | "deleted" | "sent";
  data: Record<string, unknown>;
}

@Injectable()
@WebSocketGateway({
  namespace: "/admin",
  transports: ["websocket", "polling"],
})
export class AdminWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger("AdminWebSocketGateway");
  private readonly connectedClients = new Map<string, { userId?: string }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    // Configure CORS dynamically from environment
    const frontendUrl = this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173",
    );
    const allowedOrigins = frontendUrl.split(",").map((url) => url.trim());

    server.engine.on(
      "initial_headers",
      (
        headers: Record<string, string>,
        req: { headers: { origin?: string } },
      ) => {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
          headers["Access-Control-Allow-Origin"] = origin;
          headers["Access-Control-Allow-Credentials"] = "true";
        }
      },
    );

    this.logger.log("WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token) {
        const payload = await this.jwtService.verifyAsync(token);
        this.connectedClients.set(client.id, { userId: payload.sub });
        this.logger.log(
          `Authenticated client connected: ${client.id} (User: ${payload.sub})`,
        );
      } else {
        // Allow anonymous connections for public data
        this.connectedClients.set(client.id, {});
        this.logger.log(`Anonymous client connected: ${client.id}`);
      }
    } catch (error) {
      this.logger.warn(`Client ${client.id} connection with invalid token`);
      this.connectedClients.set(client.id, {});
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emit events to all connected clients
  emitToAll(event: string, data: WebSocketEventData) {
    this.server.emit(event, data);
  }

  // Menu events
  emitMenuUpdate(
    type: "category" | "item" | "primaryCategory",
    action: "created" | "updated" | "deleted",
    data: Record<string, unknown>,
  ) {
    const payload: MenuUpdateData = {
      type,
      action,
      data,
      timestamp: new Date(),
    };
    this.emitToAll("menu:update", payload);
  }

  // Newsletter events
  emitNewsletterUpdate(
    type: "subscriber" | "campaign",
    action: "created" | "updated" | "deleted" | "sent",
    data: Record<string, unknown>,
  ) {
    const payload: NewsletterUpdateData = {
      type,
      action,
      data,
      timestamp: new Date(),
    };
    this.emitToAll("newsletter:update", payload);
  }

  // Events module events
  emitEventUpdate(
    action: "created" | "updated" | "deleted",
    data: Record<string, unknown>,
  ) {
    this.emitToAll("event:update", { action, data, timestamp: new Date() });
  }

  // Specials events
  emitSpecialUpdate(
    action: "created" | "updated" | "deleted",
    data: Record<string, unknown>,
  ) {
    this.emitToAll("special:update", { action, data, timestamp: new Date() });
  }

  // Opening hours events
  emitOpeningHoursUpdate(data: Record<string, unknown>) {
    this.emitToAll("openingHours:update", { data, timestamp: new Date() });
  }

  // User events
  emitUserUpdate(
    action: "created" | "updated" | "deleted",
    data: Record<string, unknown>,
  ) {
    this.emitToAll("user:update", { action, data, timestamp: new Date() });
  }

  // Get connected client count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
