import { DurableObject } from "cloudflare:workers";

const INVITE_COOLDOWN_MS = 10_000;
const BONE_COOLDOWN_MS = 5_000;
const MAX_MESSAGE_BYTES = 256;
const HEARTBEAT_SWEEP_MS = 15_000;
const STALE_SESSION_MS = 45_000;
const SCENE_ID = "georgie-notices-the-room-v1";
const MAX_ROOM_SESSIONS = 500;

export function roomCanAccept(activeSessions) {
  return activeSessions < MAX_ROOM_SESSIONS;
}

export function presenceChangeNeedsBroadcast(before, after) {
  return Math.min(before, 5) !== Math.min(after, 5);
}

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
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_event_cooldown (
          event_type TEXT PRIMARY KEY,
          last_at INTEGER NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(
        "INSERT OR IGNORE INTO room_event_cooldown (event_type, last_at) VALUES ('bone', 0)",
      );
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_event_sequence (
          event_type TEXT PRIMARY KEY,
          event_count INTEGER NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(
        "INSERT OR IGNORE INTO room_event_sequence (event_type, event_count) VALUES ('invite', 0)",
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
    this.ctx.storage.sql.exec(
      "UPDATE room_event_sequence SET event_count = 0 WHERE event_type = 'invite'",
    );
  }

  stateMessage(sockets = this.activeSockets()) {
    const occupancy = sockets.length;
    return {
      type: "state",
      occupancy,
      renderedLights: Math.min(occupancy, 4),
      aggregateLabel: occupancy > 4 ? "5+ here" : null,
      ...this.scene(),
      serverTime: Date.now(),
    };
  }

  send(socket, message) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A socket can close between enumeration and delivery.
    }
  }

  broadcast(message) {
    for (const socket of this.activeSockets()) this.send(socket, message);
  }

  broadcastExceptSession(excludedSessionId, message) {
    for (const socket of this.activeSockets()) {
      if (socket.deserializeAttachment()?.sessionId !== excludedSessionId) {
        this.send(socket, message);
      }
    }
  }

  broadcastState(excludedSessionId = null) {
    const sockets = this.activeSockets().filter(
      (socket) => socket.deserializeAttachment()?.sessionId !== excludedSessionId,
    );
    const message = this.stateMessage(sockets);
    for (const socket of sockets) this.send(socket, message);
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

    if (!roomCanAccept(this.activeSockets().length)) {
      return new Response("Room at capacity", { status: 503 });
    }

    if (this.activeSockets().length === 0) this.resetScene(Date.now());

    const beforeAccept = this.activeSockets().length;
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server, [`session:${sessionId}`]);
    server.serializeAttachment({ sessionId, lastSeenAt: Date.now() });
    await this.ctx.storage.setAlarm(Date.now() + STALE_SESSION_MS);
    const sockets = this.activeSockets();
    if (presenceChangeNeedsBroadcast(beforeAccept, sockets.length)) {
      this.broadcastState();
    } else {
      this.send(server, this.stateMessage(sockets));
    }

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

    if (message?.type === "heartbeat" && Object.keys(message).length === 1) {
      const attachment = socket.deserializeAttachment();
      socket.serializeAttachment({
        sessionId: attachment.sessionId,
        lastSeenAt: Date.now(),
      });
      return;
    }

    if (message?.type === "bone" && Object.keys(message).length === 1) {
      const now = Date.now();
      const { lastAt } = this.ctx.storage.sql
        .exec(
          "SELECT last_at AS lastAt FROM room_event_cooldown WHERE event_type = 'bone'",
        )
        .one();
      if (now - lastAt < BONE_COOLDOWN_MS) {
        this.send(socket, { type: "error", code: "bone_rate_limited" });
        return;
      }
      this.ctx.storage.sql.exec(
        "UPDATE room_event_cooldown SET last_at = ? WHERE event_type = 'bone'",
        now,
      );
      this.broadcastExceptSession(
        socket.deserializeAttachment()?.sessionId,
        { type: "bone", at: now },
      );
      return;
    }

    if (message?.type === "leave" && Object.keys(message).length === 1) {
      const active = this.activeSockets();
      const remaining = active.filter((candidate) => candidate !== socket);
      if (presenceChangeNeedsBroadcast(active.length, remaining.length)) {
        const state = this.stateMessage(remaining);
        for (const candidate of remaining) this.send(candidate, state);
      }
      socket.close(1000, "Session left room");
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
    this.ctx.storage.sql.exec(
      "UPDATE room_event_sequence SET event_count = event_count + 1 WHERE event_type = 'invite'",
    );
    const { eventCount } = this.ctx.storage.sql
      .exec(
        "SELECT event_count AS eventCount FROM room_event_sequence WHERE event_type = 'invite'",
      )
      .one();
    const reactions = ["watches", "ignores", "leaves"];
    this.broadcast({
      type: "invitation",
      at: now,
      reaction: reactions[(eventCount - 1) % reactions.length],
    });
  }

  webSocketClose(socket, code, reason) {
    socket.close(code, reason);
    const remaining = this.activeSockets();
    if (presenceChangeNeedsBroadcast(remaining.length + 1, remaining.length)) {
      this.broadcastState();
    }
  }

  webSocketError(socket) {
    socket.close(1011, "Room connection failed");
    const remaining = this.activeSockets();
    if (presenceChangeNeedsBroadcast(remaining.length + 1, remaining.length)) {
      this.broadcastState();
    }
  }

  async alarm() {
    const now = Date.now();
    const activeBeforeSweep = this.activeSockets().length;
    const retained = [];

    for (const socket of this.activeSockets()) {
      const lastSeenAt = socket.deserializeAttachment()?.lastSeenAt;
      if (!Number.isFinite(lastSeenAt) || now - lastSeenAt > STALE_SESSION_MS) {
        socket.close(1001, "Presence heartbeat timed out");
      } else {
        retained.push(socket);
      }
    }

    if (presenceChangeNeedsBroadcast(activeBeforeSweep, retained.length)) {
      const state = this.stateMessage(retained);
      for (const socket of retained) this.send(socket, state);
    }

    if (retained.length) {
      await this.ctx.storage.setAlarm(now + HEARTBEAT_SWEEP_MS);
    }
  }
}
