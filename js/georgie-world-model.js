const RECOGNITION_KEY = "georgie-world-recognition-v1";
const RECOGNITION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const QUICK_INVITE_MS = 5_000;

export function directionForDelta(dx, dy) {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);

  if (horizontal > vertical * 1.6) return dx >= 0 ? "right" : "left";
  if (vertical > horizontal * 1.6) return dy >= 0 ? "front" : "rear";
  if (dy >= 0) return dx >= 0 ? "front-right" : "front-left";
  return dx >= 0 ? "rear-right" : "rear-left";
}

export function presenceView(rawOccupancy) {
  const occupancy = Number.isFinite(rawOccupancy)
    ? Math.max(0, Math.floor(rawOccupancy))
    : 0;

  return {
    occupancy,
    renderedLights: Math.min(occupancy, 4),
    aggregateLabel: occupancy > 4 ? "5+ here" : null,
  };
}

export function readRecognition(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(RECOGNITION_KEY));
    if (
      !value
      || !Number.isFinite(value.lastSeenAt)
      || !Number.isInteger(value.visits)
      || value.visits < 1
      || now - value.lastSeenAt > RECOGNITION_WINDOW_MS
      || value.lastSeenAt > now
    ) {
      storage.removeItem(RECOGNITION_KEY);
      return null;
    }
    return { lastSeenAt: value.lastSeenAt, visits: value.visits };
  } catch {
    return null;
  }
}

export function rememberVisit(storage, now = Date.now()) {
  const remembered = readRecognition(storage, now);
  const next = {
    lastSeenAt: now,
    visits: remembered ? remembered.visits + 1 : 1,
  };
  try {
    storage.setItem(RECOGNITION_KEY, JSON.stringify(next));
  } catch {
    // Recognition is optional. Georgie still works when storage is unavailable.
  }
  return next;
}

export function forgetRecognition(storage) {
  try {
    storage.removeItem(RECOGNITION_KEY);
  } catch {
    // A blocked storage API already leaves no recognition to forget.
  }
}

export class GeorgieBehavior {
  constructor({ now = () => Date.now(), random = Math.random } = {}) {
    this.now = now;
    this.random = random;
    this.state = "peeking";
    this.invitationCount = 0;
    this.annoyance = 0;
    this.lastInviteAt = null;
  }

  invite() {
    if (this.state === "gone") return { reaction: "absent", state: this.state };

    const invitedAt = this.now();
    const quickRepeat = this.lastInviteAt !== null
      && invitedAt - this.lastInviteAt < QUICK_INVITE_MS;
    this.lastInviteAt = invitedAt;
    this.invitationCount += 1;
    this.annoyance += quickRepeat ? 2 : 1;

    if (this.annoyance >= 4) {
      this.state = "gone";
      return { reaction: "leaves", state: this.state };
    }

    if (this.invitationCount === 1 && this.random() < 0.35) {
      this.state = "watching";
      return { reaction: "ignores", state: this.state };
    }

    this.state = "watching";
    return { reaction: "watches", state: this.state };
  }

  chooseRoutine(occupancy = 0) {
    if (this.state === "gone") return "gone";
    const draw = this.random();

    if (draw < 0.32) return "wander";
    if (draw < 0.5) return "watch";
    if (draw < (occupancy > 0 ? 0.75 : 0.7)) return "chase-moth";
    if (draw < 0.9) return "rest";
    return "hide";
  }
}

export const GeorgieWorldMemory = Object.freeze({
  key: RECOGNITION_KEY,
  windowMs: RECOGNITION_WINDOW_MS,
});
