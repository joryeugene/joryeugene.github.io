const ATLAS_ROWS = {
  right: 0,
  "front-right": 1,
  front: 2,
  "rear-right": 3,
  rear: 4,
  "bone-wag": 5,
};

const STILL_FRAMES = {
  right: 0,
  "front-right": 1,
  front: 2,
  "rear-right": 3,
  rear: 4,
};

const DIRECTION_ASSETS = {
  right: ["right", false],
  left: ["right", true],
  front: ["front", false],
  rear: ["rear", false],
  "front-right": ["front-right", false],
  "front-left": ["front-right", true],
  "rear-right": ["rear-right", false],
  "rear-left": ["rear-right", true],
};

const TRAVEL_SPEED_PX_PER_SECOND = 440;
const MIN_TRAVEL_MS = 180;
const MAX_TRAVEL_MS = 2_200;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizedDistanceInPixels(from, to, bounds) {
  return Math.hypot(
    (to.x - from.x) * bounds.width,
    (to.y - from.y) * bounds.height,
  );
}

export function travelDurationMs(from, to, bounds, speed = TRAVEL_SPEED_PX_PER_SECOND) {
  const distance = normalizedDistanceInPixels(from, to, bounds);
  if (distance < 1) return 0;
  return clamp((distance / speed) * 1_000, MIN_TRAVEL_MS, MAX_TRAVEL_MS);
}

export class GeorgieActionController {
  constructor({ arena, dog, sprite, reducedMotion = false, position }) {
    this.arena = arena;
    this.dog = dog;
    this.sprite = sprite;
    this.reducedMotion = reducedMotion;
    this.position = { ...position };
    this.direction = "right";
    this.phase = "settle";
    this.activeAction = null;
    this.actionId = 0;
    this.place(this.position);
    this.showStill(this.direction);
  }

  setPhase(phase) {
    this.phase = phase;
    this.dog.dataset.actionPhase = phase;
  }

  place(position) {
    this.position = { ...position };
    this.dog.style.left = `${position.x * 100}%`;
    this.dog.style.top = `${position.y * 100}%`;
  }

  visiblePosition() {
    if (!this.activeAction) return { ...this.position };
    const arenaBounds = this.arena.getBoundingClientRect();
    const dogBounds = this.dog.getBoundingClientRect();
    if (!arenaBounds.width || !arenaBounds.height) return { ...this.position };
    return {
      x: (dogBounds.left + dogBounds.width / 2 - arenaBounds.left) / arenaBounds.width,
      y: (dogBounds.top + dogBounds.height / 2 - arenaBounds.top) / arenaBounds.height,
    };
  }

  setSprite({ row, frame = 0, mirrored = false, motion }) {
    this.sprite.style.setProperty("--georgie-row", row);
    this.sprite.style.setProperty("--georgie-frame", frame);
    this.sprite.classList.toggle("is-mirrored", mirrored);
    this.sprite.dataset.motion = motion;
  }

  showRun(direction) {
    const [assetDirection, mirrored] = DIRECTION_ASSETS[direction] || DIRECTION_ASSETS.right;
    this.direction = direction;
    this.dog.dataset.direction = direction;
    this.setSprite({ row: ATLAS_ROWS[assetDirection], mirrored, motion: "run" });
  }

  showStill(direction = this.direction) {
    const [assetDirection, mirrored] = DIRECTION_ASSETS[direction] || DIRECTION_ASSETS.right;
    this.direction = direction;
    this.dog.dataset.direction = direction;
    this.setSprite({
      row: 6,
      frame: STILL_FRAMES[assetDirection],
      mirrored,
      motion: "still",
    });
    this.dog.classList.remove("is-travelling");
  }

  showReaction(name, direction = this.direction) {
    this.cancel({ settle: false });
    const mirrored = direction === "left";
    this.direction = direction;
    this.dog.dataset.direction = direction;
    this.setPhase("enter");
    this.setSprite({ row: ATLAS_ROWS[name], mirrored, motion: "reaction" });
    this.dog.classList.remove("is-travelling");
    this.setPhase("settle");
  }

  settle(direction = this.direction) {
    this.cancel({ settle: false });
    this.setPhase("enter");
    this.showStill(direction);
    this.setPhase("settle");
  }

  cancel({ settle = true } = {}) {
    const action = this.activeAction;
    if (!action) return null;

    const visible = this.visiblePosition();
    this.activeAction = null;
    action.animation.onfinish = null;
    action.animation.oncancel = null;
    action.animation.cancel();
    this.place(visible);
    this.setPhase("cancel");
    this.dog.classList.remove("is-travelling");
    if (settle) {
      this.showStill(action.direction);
      this.setPhase("settle");
    }
    action.resolve({
      status: "cancelled",
      position: { ...visible },
      duration: action.duration,
    });
    return visible;
  }

  moveTo(target, { direction, easing = "cubic-bezier(0.25, 0.78, 0.3, 1)" } = {}) {
    const redirectedFrom = this.cancel({ settle: false });
    if (!redirectedFrom && this.phase === "settle") this.setPhase("exit");
    const from = redirectedFrom || this.visiblePosition();
    this.place(from);
    this.setPhase("enter");
    this.showRun(direction || this.direction);

    const arenaBounds = this.arena.getBoundingClientRect();
    const duration = this.reducedMotion
      ? 0
      : travelDurationMs(from, target, arenaBounds);

    if (duration === 0) {
      this.place(target);
      this.setPhase("arrive");
      this.showStill(direction || this.direction);
      this.setPhase("settle");
      return Promise.resolve({ status: "arrived", position: { ...target }, duration });
    }

    this.dog.classList.add("is-travelling");
    this.setPhase("move");
    const animation = this.dog.animate([
      { left: `${from.x * 100}%`, top: `${from.y * 100}%` },
      { left: `${target.x * 100}%`, top: `${target.y * 100}%` },
    ], {
      duration,
      easing,
      fill: "forwards",
    });

    return new Promise((resolve) => {
      const action = {
        id: ++this.actionId,
        animation,
        direction: direction || this.direction,
        duration,
        resolve,
      };
      this.activeAction = action;
      animation.onfinish = () => {
        if (this.activeAction?.id !== action.id) return;
        animation.onfinish = null;
        animation.oncancel = null;
        this.activeAction = null;
        this.place(target);
        animation.cancel();
        this.setPhase("arrive");
        requestAnimationFrame(() => {
          if (this.activeAction) return;
          this.showStill(action.direction);
          this.setPhase("settle");
          resolve({ status: "arrived", position: { ...target }, duration });
        });
      };
    });
  }
}
