import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@Injectable()
@WebSocketGateway({
  namespace: "/public",
  transports: ["websocket", "polling"],
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = process.env.FRONTEND_URL?.split(",").map((url) =>
        url.trim(),
      ) ?? [];
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: false,
    methods: ["GET", "POST"],
  },
})
export class PublicWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger("PublicWebSocketGateway");

  afterInit() {
    this.logger.log("Public WebSocket Gateway initialized");
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Public client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Public client disconnected: ${client.id}`);
  }

  private emit(event: string, data: Record<string, unknown>) {
    this.server.emit(event, { ...data, timestamp: new Date() });
  }

  emitMenuUpdate(
    type: "category" | "item" | "primaryCategory",
    action: "created" | "updated" | "deleted",
  ) {
    this.emit("menu:update", { type, action });
  }

  emitSpecialUpdate(action: "created" | "updated" | "deleted") {
    this.emit("special:update", { action });
  }

  emitEventUpdate(action: "created" | "updated" | "deleted") {
    this.emit("event:update", { action });
  }

  emitOpeningHoursUpdate() {
    this.emit("openingHours:update", {});
  }

  emitGalleryUpdate(action: "created" | "updated" | "deleted") {
    this.emit("gallery:update", { action });
  }
}
