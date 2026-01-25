import { Module, Global } from "@nestjs/common";
import { AdminWebSocketGateway } from "./websocket.gateway";

@Global()
@Module({
  providers: [AdminWebSocketGateway],
  exports: [AdminWebSocketGateway],
})
export class WebSocketModule {}
