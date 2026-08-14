import assert from "node:assert/strict";
import test from "node:test";

import {
  GeorgieBehavior,
  directionForDelta,
  forgetRecognition,
  presenceView,
  readRecognition,
  rememberVisit,
  sharedSceneAt,
} from "../../js/georgie-world-model.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("maps travel vectors to all eight Georgie directions", () => {
  assert.equal(directionForDelta(120, 2), "right");
  assert.equal(directionForDelta(-120, 2), "left");
  assert.equal(directionForDelta(2, 120), "front");
  assert.equal(directionForDelta(2, -120), "rear");
  assert.equal(directionForDelta(80, 70), "front-right");
  assert.equal(directionForDelta(-80, 70), "front-left");
  assert.equal(directionForDelta(80, -70), "rear-right");
  assert.equal(directionForDelta(-80, -70), "rear-left");
});

test("renders at most four real visitor lights and aggregates the rest", () => {
  assert.deepEqual(presenceView(0), {
    occupancy: 0,
    renderedLights: 0,
    aggregateLabel: null,
  });
  assert.deepEqual(presenceView(4), {
    occupancy: 4,
    renderedLights: 4,
    aggregateLabel: null,
  });
  assert.deepEqual(presenceView(500), {
    occupancy: 500,
    renderedLights: 4,
    aggregateLabel: "5+ here",
  });
});

test("recognizes this browser for seven days and supports Forget me", () => {
  const storage = new MemoryStorage();
  const firstSeen = Date.UTC(2026, 7, 14);

  assert.equal(readRecognition(storage, firstSeen), null);
  assert.deepEqual(rememberVisit(storage, firstSeen), {
    lastSeenAt: firstSeen,
    visits: 1,
  });

  const returnTime = firstSeen + (6 * 24 * 60 * 60 * 1000);
  assert.deepEqual(readRecognition(storage, returnTime), {
    lastSeenAt: firstSeen,
    visits: 1,
  });
  assert.deepEqual(rememberVisit(storage, returnTime), {
    lastSeenAt: returnTime,
    visits: 2,
  });

  forgetRecognition(storage);
  assert.equal(readRecognition(storage, returnTime), null);
});

test("expires local recognition after seven days", () => {
  const storage = new MemoryStorage();
  const firstSeen = Date.UTC(2026, 7, 1);
  rememberVisit(storage, firstSeen);

  const afterWindow = firstSeen + (8 * 24 * 60 * 60 * 1000);
  assert.equal(readRecognition(storage, afterWindow), null);
});

test("Georgie can ignore invitations and leaves when they become annoying", () => {
  let now = 1_000;
  const georgie = new GeorgieBehavior({
    now: () => now,
    random: () => 0.1,
  });

  assert.equal(georgie.invite().reaction, "ignores");
  now += 1_000;
  assert.equal(georgie.invite().reaction, "watches");
  now += 1_000;
  assert.equal(georgie.invite().reaction, "leaves");
  assert.equal(georgie.state, "gone");
  assert.equal(georgie.invite().reaction, "absent");
});

test("an empty site still gives Georgie autonomous routines", () => {
  const draws = [0.05, 0.38, 0.56, 0.76, 0.95];
  const routines = draws.map((draw) => {
    const georgie = new GeorgieBehavior({ random: () => draw });
    return georgie.chooseRoutine(0);
  });

  assert.deepEqual(routines, ["wander", "watch", "chase-moth", "rest", "hide"]);
});

test("connected visitors derive the same Georgie scene from one room clock", () => {
  const startedAt = Date.UTC(2026, 7, 14, 1, 0, 0);
  const firstViewer = sharedSceneAt(startedAt, startedAt + 2_000);
  const secondViewer = sharedSceneAt(startedAt, startedAt + 2_000);
  const nextBeat = sharedSceneAt(startedAt, startedAt + 6_100);

  assert.deepEqual(firstViewer, secondViewer);
  assert.equal(firstViewer.beat, 0);
  assert.equal(firstViewer.nextAt, startedAt + 6_000);
  assert.equal(nextBeat.beat, 1);
  assert.notDeepEqual(
    { x: nextBeat.x, y: nextBeat.y, routine: nextBeat.routine },
    { x: firstViewer.x, y: firstViewer.y, routine: firstViewer.routine },
  );
});
