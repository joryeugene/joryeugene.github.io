import { GeorgieRoom } from "./georgie-room.js";

function allowedOrigins(request, env) {
  const configured = (env.GEORGIE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  configured.push(new URL(request.url).origin);
  return new Set(configured);
}

export { GeorgieRoom };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/presence") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected websocket upgrade", { status: 426 });
    }

    const origin = request.headers.get("Origin");
    if (!origin || !allowedOrigins(request, env).has(origin)) {
      return new Response("Origin not allowed", { status: 403 });
    }

    return env.GEORGIE_ROOM.getByName("lobby-v1").fetch(request);
  },
};
