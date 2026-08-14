import { DurableObject } from "cloudflare:workers";

const INVITE_COOLDOWN_MS = 10_000;
const MAX_MESSAGE_BYTES = 256;
const SCENE_ID = "georgie-notices-the-room-v1";

function isValidSessionId(value) {
  return /^[A-Za-z0-9_-]{8,64}$/.test(value || "");
}

function isOpen(socket) {
  return socket.readyState === WebSocket.OPEN;
}

export class GeorgieRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_scene (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          scene_id TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          last_invite_at INTEGER NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(
        "INSERT OR IGNORE INTO room_scene (singleton, scene_id, started_at, last_invite_at) VALUES (1, ?, ?, 0)",
        SCENE_ID,
        Date.now(),
      );
    });
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  activeSockets() {
    return this.ctx.getWebSockets().filter(isOpen);
  }

  scene() {
    return this.ctx.storage.sql
      .exec(
        "SELECT scene_id AS sceneId, started_at AS sceneStartedAt FROM room_scene WHERE singleton = 1",
      )
      .one();
  }

  resetScene(startedAt) {
    this.ctx.storage.sql.exec(
      "UPDATE room_scene SET scene_id = ?, started_at = ? WHERE singleton = 1",
      SCENE_ID,
      startedAt,
    );
  }

  stateMessage() {
    const occupancy = this.activeSockets().length;
    return {
      type: "state",
      occupancy,
      renderedLights: Math.min(occupancy, 4),
      aggregateLabel: occupancy > 4 ? "5+ here" : null,
      ...this.scene(),
    };
  }

  send(socket, message) {
    if (isOpen(socket)) socket.send(JSON.stringify(message));
  }

  broadcast(message) {
    for (const socket of this.activeSockets()) this.send(socket, message);
  }

  broadcastState() {
    this.broadcast(this.stateMessage());
  }

  async fetch(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session");
    if (!isValidSessionId(sessionId)) {
      return new Response("Invalid session", { status: 400 });
    }

    for (const socket of this.activeSockets()) {
      if (socket.deserializeAttachment()?.sessionId === sessionId) {
        socket.close(1012, "Session reconnected");
      }
    }

    if (this.activeSockets().length === 0) this.resetScene(Date.now());

    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [`session:${sessionId}`]);
    server.serializeAttachment({ sessionId });
    this.broadcastState();

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket, rawMessage) {
    if (typeof rawMessage !== "string" || rawMessage.length > MAX_MESSAGE_BYTES) {
      this.send(socket, { type: "error", code: "unsupported_message" });
      return;
    }

    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch {
      this.send(socket, { type: "error", code: "unsupported_message" });
      return;
    }

    if (
      !message ||
      message.type !== "invite" ||
      Object.keys(message).length !== 1
    ) {
      this.send(socket, { type: "error", code: "unsupported_message" });
      return;
    }

    const now = Date.now();
    const { lastInviteAt } = this.ctx.storage.sql
      .exec(
        "SELECT last_invite_at AS lastInviteAt FROM room_scene WHERE singleton = 1",
      )
      .one();
    if (now - lastInviteAt < INVITE_COOLDOWN_MS) {
      this.send(socket, { type: "error", code: "invite_rate_limited" });
      return;
    }

    this.ctx.storage.sql.exec(
      "UPDATE room_scene SET last_invite_at = ? WHERE singleton = 1",
      now,
    );
    this.broadcast({ type: "invitation", at: now });
  }

  webSocketClose(socket, code, reason) {
    socket.close(code, reason);
    this.broadcastState();
  }

  webSocketError(socket) {
    socket.close(1011, "Room connection failed");
    this.broadcastState();
  }
}
