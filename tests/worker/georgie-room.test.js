import { SELF, env, evictDurableObject } from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";

const TEST_ORIGIN = "https://jorypestorious-site.test";
const openSockets = new Set();

function nextJson(socket, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for a matching room message"));
    }, 2_000);

    function onMessage(event) {
      const message = JSON.parse(event.data);
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      resolve(message);
    }

    socket.addEventListener("message", onMessage);
  });
}

async function connect(sessionId) {
  const response = await SELF.fetch(
    `${TEST_ORIGIN}/api/presence?session=${sessionId}`,
    {
      headers: {
        Origin: TEST_ORIGIN,
        Upgrade: "websocket",
      },
    },
  );

  expect(response.status).toBe(101);
  const socket = response.webSocket;
  expect(socket).toBeTruthy();
  socket.accept();
  openSockets.add(socket);
  return socket;
}

async function connectToRoom(stub, sessionId) {
  const response = await stub.fetch(
    `${TEST_ORIGIN}/api/presence?session=${sessionId}`,
    { headers: { Upgrade: "websocket" } },
  );
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  socket.accept();
  openSockets.add(socket);
  return socket;
}

afterEach(() => {
  for (const socket of openSockets) {
    if (socket.readyState < WebSocket.CLOSING) socket.close(1000, "test done");
  }
  openSockets.clear();
});

describe("Georgie presence room", () => {
  it("rejects a websocket upgrade from an unrelated origin", async () => {
    const response = await SELF.fetch(
      `${TEST_ORIGIN}/api/presence?session=visitor-a`,
      {
        headers: {
          Origin: "https://attacker.example",
          Upgrade: "websocket",
        },
      },
    );

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Origin not allowed");
  });

  it("shares one bounded anonymous state across four sessions", async () => {
    const first = await connect("visitor-a");
    await nextJson(first, (message) => message.type === "state");
    const stateAtFour = nextJson(
      first,
      (message) => message.type === "state" && message.occupancy === 4,
    );
    await connect("visitor-b");
    await connect("visitor-c");
    await connect("visitor-d");

    const state = await stateAtFour;

    expect(state).toEqual({
      type: "state",
      occupancy: 4,
      renderedLights: 4,
      aggregateLabel: null,
      sceneId: "georgie-notices-the-room-v1",
      sceneStartedAt: expect.any(Number),
    });
    expect(Object.keys(state).sort()).toEqual([
      "aggregateLabel",
      "occupancy",
      "renderedLights",
      "sceneId",
      "sceneStartedAt",
      "type",
    ]);
  });

  it("caps individual lights at four when the room has five sessions", async () => {
    const first = await connect("visitor-a");
    await nextJson(first, (message) => message.type === "state");
    const stateAtFive = nextJson(
      first,
      (message) => message.type === "state" && message.occupancy === 5,
    );
    await connect("visitor-b");
    await connect("visitor-c");
    await connect("visitor-d");
    await connect("visitor-e");

    const state = await stateAtFive;

    expect(state.renderedLights).toBe(4);
    expect(state.aggregateLabel).toBe("5+ here");
  });

  it("broadcasts one invitation and rate limits a repeated invitation", async () => {
    const first = await connect("visitor-a");
    const second = await connect("visitor-b");
    await nextJson(first, (message) => message.type === "state" && message.occupancy === 2);

    const invitationForSecond = nextJson(
      second,
      (message) => message.type === "invitation",
    );
    first.send(JSON.stringify({ type: "invite" }));

    expect(await invitationForSecond).toEqual({
      type: "invitation",
      at: expect.any(Number),
    });

    const rateLimitForFirst = nextJson(
      first,
      (message) => message.type === "error",
    );
    first.send(JSON.stringify({ type: "invite" }));

    expect(await rateLimitForFirst).toEqual({
      type: "error",
      code: "invite_rate_limited",
    });
  });

  it("rejects messages outside the one allowed invitation action", async () => {
    const socket = await connect("visitor-a");
    await nextJson(socket, (message) => message.type === "state");

    const error = nextJson(socket, (message) => message.type === "error");
    socket.send(JSON.stringify({ type: "cursor", x: 90, y: 120 }));

    expect(await error).toEqual({
      type: "error",
      code: "unsupported_message",
    });
  });

  it("replaces a reconnecting session without increasing occupancy", async () => {
    const first = await connect("visitor-a");
    await nextJson(first, (message) => message.type === "state");
    const firstClosed = new Promise((resolve) => {
      first.addEventListener("close", resolve, { once: true });
    });

    const replacement = await connect("visitor-a");
    const state = await nextJson(
      replacement,
      (message) => message.type === "state",
    );

    expect(state.occupancy).toBe(1);
    await expect(firstClosed).resolves.toBeDefined();
  });

  it("keeps the room alive across Durable Object hibernation", async () => {
    const stub = env.GEORGIE_ROOM.getByName("hibernate-test");
    const response = await stub.fetch(
      `${TEST_ORIGIN}/api/presence?session=visitor-z`,
      { headers: { Upgrade: "websocket" } },
    );
    const socket = response.webSocket;
    socket.accept();
    openSockets.add(socket);
    await nextJson(socket, (message) => message.type === "state");

    await evictDurableObject(stub);
    const invitation = nextJson(
      socket,
      (message) => message.type === "invitation",
    );
    socket.send(JSON.stringify({ type: "invite" }));

    expect(await invitation).toEqual({
      type: "invitation",
      at: expect.any(Number),
    });
  });

  it("does not let reconnecting bypass the room invitation cooldown", async () => {
    const stub = env.GEORGIE_ROOM.getByName("cooldown-reconnect-test");
    const first = await connectToRoom(stub, "visitor-a");
    await nextJson(first, (message) => message.type === "state");
    const accepted = nextJson(first, (message) => message.type === "invitation");
    first.send(JSON.stringify({ type: "invite" }));
    await accepted;

    const closed = new Promise((resolve) => {
      first.addEventListener("close", resolve, { once: true });
    });
    first.close(1000, "reconnect");
    await closed;

    const replacement = await connectToRoom(stub, "visitor-a");
    await nextJson(replacement, (message) => message.type === "state");
    const rejected = nextJson(replacement, (message) => message.type === "error");
    replacement.send(JSON.stringify({ type: "invite" }));

    expect(await rejected).toEqual({
      type: "error",
      code: "invite_rate_limited",
    });
  });
});
