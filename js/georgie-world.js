import {
  GeorgieBehavior,
  directionForDelta,
  forgetRecognition,
  presenceView,
  readRecognition,
  rememberVisit,
  sharedSceneAt,
} from "./georgie-world-model.js";

const ASSET_ROOT = "/assets/georgie";
const PRESENCE_URL = "wss://jorypestorious-site.jorypestorious-48d.workers.dev/api/presence";
const HEARTBEAT_MS = 15_000;

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

const BONE_HIDING_PLACES = [
  { x: 0.07, y: 0.79 },
  { x: 0.84, y: 0.72 },
  { x: 0.62, y: 0.84 },
  { x: 0.28, y: 0.76 },
  { x: 0.9, y: 0.54 },
  { x: 0.47, y: 0.69 },
];

export function bonePositionForPath(pathname) {
  const index = Array.from(pathname).reduce((sum, character) => sum + character.codePointAt(0), 0)
    % BONE_HIDING_PLACES.length;
  return BONE_HIDING_PLACES[index];
}

function randomSessionId() {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join("").slice(0, 32);
}

function roomCopy({ occupancy, aggregateLabel }) {
  if (aggregateLabel) return "A small crowd is here";
  if (occupancy === 0) return "Just Georgie tonight";
  if (occupancy === 1) return "One visitor light is here";
  return `${occupancy} visitor lights are here`;
}

export class GeorgieWorld {
  constructor(root) {
    this.root = root;
    this.arena = root.querySelector("[data-georgie-arena]");
    this.dog = root.querySelector("[data-georgie-dog]");
    this.sprite = root.querySelector("[data-georgie-sprite]");
    this.reaction = root.querySelector("[data-georgie-reaction]");
    this.roomCopy = root.querySelector("[data-room-copy]");
    this.visitorLights = root.querySelector("[data-visitor-lights]");
    this.aggregate = root.querySelector("[data-presence-aggregate]");
    this.recognitionCopy = root.querySelector("[data-recognition-copy]");
    this.bone = root.querySelector("[data-georgie-bone]");
    this.behavior = new GeorgieBehavior();
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.position = { x: 0.16, y: 0.68 };
    this.presence = presenceView(0);
    this.routineTimer = 0;
    this.sayTimer = 0;
    this.socket = null;
    this.heartbeatTimer = 0;
    this.sharedSceneTimer = 0;
    this.connectedToRoom = false;
    this.sceneStartedAt = null;
    this.serverClockOffset = 0;
    this.isLeavingPage = false;
    this.draggingBone = false;
    this.bonePosition = root.hasAttribute("data-georgie-overlay")
      ? bonePositionForPath(location.pathname)
      : { x: 0.08, y: 0.8 };
    this.bone.style.left = `${this.bonePosition.x * 100}%`;
    this.bone.style.top = `${this.bonePosition.y * 100}%`;
    this.testMode = new URLSearchParams(location.search).has("test");
  }

  start() {
    const remembered = readRecognition(localStorage);
    rememberVisit(localStorage);
    this.renderRecognition(remembered);
    this.setPresence(0);
    this.setDirection("right", !this.reducedMotion);
    this.setPosition(this.position.x, this.position.y, false);
    this.root.dataset.state = "wandering";

    this.root.querySelector("[data-invite-georgie]")
      .addEventListener("click", () => this.invite());
    this.root.querySelector("[data-forget-georgie]")
      .addEventListener("click", () => this.forget());
    this.bindBone();

    if (!new URLSearchParams(location.search).has("offline")) this.connectPresence();
    if (!this.testMode && !this.reducedMotion) this.scheduleRoutine(900);
  }

  renderRecognition(remembered) {
    this.recognitionCopy.textContent = remembered
      ? "Georgie remembers this browser from an earlier visit."
      : "This browser is new to Georgie.";
  }

  forget() {
    forgetRecognition(localStorage);
    this.renderRecognition(null);
    this.say("Georgie forgot this browser. Nothing else left the page.");
  }

  say(message, duration = 3_600) {
    this.reaction.textContent = message;
    this.root.dataset.speaking = "true";
    window.clearTimeout(this.sayTimer);
    this.sayTimer = window.setTimeout(() => {
      delete this.root.dataset.speaking;
    }, duration);
  }

  setPresence(occupancy) {
    this.presence = presenceView(occupancy);
    this.visitorLights.replaceChildren();

    for (let index = 0; index < this.presence.renderedLights; index += 1) {
      const light = document.createElement("span");
      light.className = "georgie-presence__visitor";
      light.dataset.presenceKind = "visitor";
      light.style.setProperty("--visitor-index", index);
      light.setAttribute("aria-hidden", "true");
      this.visitorLights.append(light);
    }

    this.aggregate.textContent = this.presence.aggregateLabel || "";
    this.aggregate.hidden = !this.presence.aggregateLabel;
    this.roomCopy.textContent = roomCopy(this.presence);
  }

  bindBone() {
    this.bone.addEventListener("pointerdown", (event) => {
      if (this.behavior.state === "gone") return;
      this.draggingBone = true;
      this.bone.dataset.found = "true";
      this.bone.setPointerCapture(event.pointerId);
      window.clearTimeout(this.routineTimer);
      this.followBone(event);
    });

    this.bone.addEventListener("pointermove", (event) => {
      if (this.draggingBone) this.followBone(event);
    });

    const release = (event) => {
      if (!this.draggingBone) return;
      this.draggingBone = false;
      if (this.bone.hasPointerCapture(event.pointerId)) this.bone.releasePointerCapture(event.pointerId);
      this.root.dataset.state = "bone-found";
      this.showBoneWag();
      this.say("Georgie found his bone. His tail is still going.", 5_000);
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "bone" }));
      }
      if (this.connectedToRoom) {
        this.scheduleSharedScene(2_600, true);
      } else if (!this.testMode && !this.reducedMotion) {
        this.scheduleRoutine(2_600);
      }
    };
    this.bone.addEventListener("pointerup", release);
    this.bone.addEventListener("pointercancel", release);
  }

  followBone(event) {
    const bounds = this.arena.getBoundingClientRect();
    const x = Math.max(0.04, Math.min(0.96, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0.1, Math.min(0.86, (event.clientY - bounds.top) / bounds.height));
    this.bone.style.left = `${x * 100}%`;
    this.bone.style.top = `${y * 100}%`;
    this.bonePosition = { x, y };
    this.moveTo(x > this.position.x ? x - 0.12 : x + 0.12, y + 0.14);
    this.root.dataset.state = "following-bone";
    this.say("The bone has Georgie's full attention. His tail is wagging.");
  }

  showBoneWag() {
    const mirrored = this.bonePosition.x < this.position.x;
    this.dog.dataset.direction = mirrored ? "left" : "right";
    this.dog.classList.remove("is-travelling");
    this.sprite.classList.toggle("is-mirrored", mirrored);
    this.sprite.src = `${ASSET_ROOT}/${this.reducedMotion ? "still-bone-wag.png" : "bone-wag.gif"}`;
  }

  connectPresence() {
    let sessionId = sessionStorage.getItem("georgie-room-session-v1");
    if (!sessionId) {
      sessionId = randomSessionId();
      sessionStorage.setItem("georgie-room-session-v1", sessionId);
    }

    const socket = new WebSocket(`${PRESENCE_URL}?session=${encodeURIComponent(sessionId)}`);
    this.socket = socket;
    socket.addEventListener("open", () => {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "heartbeat" }));
        }
      }, HEARTBEAT_MS);
    });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "state") {
          this.setPresence(message.occupancy);
          this.syncSharedScene(message);
        }
        if (message.type === "invitation") this.say("A visitor invited Georgie. He will decide.");
        if (message.type === "bone") this.receiveSharedBone();
      } catch {
        // A malformed presence message cannot stop the solo scene.
      }
    });
    const disconnect = () => {
      window.clearInterval(this.heartbeatTimer);
      window.clearTimeout(this.sharedSceneTimer);
      this.connectedToRoom = false;
      this.setPresence(0);
      if (!this.isLeavingPage && !this.testMode && !this.reducedMotion && this.behavior.state !== "gone") {
        this.scheduleRoutine(900);
      }
    };
    socket.addEventListener("close", disconnect);
    socket.addEventListener("error", disconnect);
    window.addEventListener("pagehide", () => {
      this.isLeavingPage = true;
      window.clearInterval(this.heartbeatTimer);
      window.clearTimeout(this.sharedSceneTimer);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }));
        socket.close(1000, "Page left room");
      }
    }, { once: true });
  }

  receiveSharedBone() {
    if (this.behavior.state === "gone" || this.root.dataset.state === "leaving") return;
    this.root.dataset.state = "bone-found";
    this.showBoneWag();
    this.say("Someone found Georgie's bone. He knows.", 5_000);
    if (this.connectedToRoom) this.scheduleSharedScene(2_600, true);
  }

  syncSharedScene(message) {
    if (!Number.isFinite(message.sceneStartedAt) || !Number.isFinite(message.serverTime)) return;
    this.connectedToRoom = true;
    this.sceneStartedAt = message.sceneStartedAt;
    this.serverClockOffset = message.serverTime - Date.now();
    window.clearTimeout(this.routineTimer);
    this.applySharedScene();
  }

  scheduleSharedScene(delay, force = false) {
    window.clearTimeout(this.sharedSceneTimer);
    this.sharedSceneTimer = window.setTimeout(() => this.applySharedScene(force), delay);
  }

  applySharedScene(force = false) {
    if (!this.connectedToRoom || !Number.isFinite(this.sceneStartedAt)) return;
    const serverNow = Date.now() + this.serverClockOffset;
    const scene = sharedSceneAt(this.sceneStartedAt, serverNow);
    const remaining = Math.max(150, scene.nextAt - serverNow + 30);
    this.root.dataset.sharedBeat = String(scene.beat);

    if (
      this.draggingBone
      || (!force && this.root.dataset.state === "bone-found")
      || this.root.dataset.state === "leaving"
      || this.root.dataset.state === "gone"
    ) {
      this.scheduleSharedScene(Math.min(2_600, remaining));
      return;
    }

    const moved = Math.abs(scene.x - this.position.x) > 0.01
      || Math.abs(scene.y - this.position.y) > 0.01;
    if (moved) {
      const direction = directionForDelta(scene.x - this.position.x, scene.y - this.position.y);
      this.setDirection(direction, !this.reducedMotion);
      this.setPosition(scene.x, scene.y, true);
    } else {
      this.setDirection(scene.direction || "right", false);
      this.dog.classList.remove("is-travelling");
    }

    this.root.dataset.state = scene.routine;
    this.say(scene.message);
    this.scheduleSharedScene(remaining);
  }

  invite() {
    const result = this.behavior.invite();
    if (result.reaction === "ignores") {
      this.setDirection("rear", false);
      this.dog.classList.remove("is-travelling");
      this.say("Georgie heard you. He is pretending he did not.");
    } else if (result.reaction === "watches") {
      this.setDirection("front", false);
      this.dog.classList.remove("is-travelling");
      this.say("Georgie looked over. That is not the same as coming.");
    } else if (result.reaction === "leaves") {
      window.clearTimeout(this.routineTimer);
      window.clearTimeout(this.sharedSceneTimer);
      const leavesLeft = this.position.x < 0.5;
      this.root.dataset.state = "leaving";
      this.setDirection(leavesLeft ? "left" : "right", !this.reducedMotion);
      this.setPosition(leavesLeft ? -0.12 : 1.12, Math.min(0.88, this.position.y + 0.04), true);
      this.say("Georgie has had enough. He left.", 5_000);
      window.setTimeout(() => {
        this.root.dataset.state = "gone";
        this.dog.hidden = true;
      }, this.reducedMotion ? 0 : 1_250);
    } else {
      this.say("Georgie is still gone.");
    }

    if (this.socket?.readyState === WebSocket.OPEN && result.reaction !== "absent") {
      this.socket.send(JSON.stringify({ type: "invite" }));
    }
  }

  setDirection(direction, animated = true) {
    const [assetDirection, mirrored] = DIRECTION_ASSETS[direction];
    const prefix = animated ? "run" : "still";
    const extension = animated ? "gif" : "png";
    this.dog.dataset.direction = direction;
    this.sprite.classList.toggle("is-mirrored", mirrored);
    this.sprite.src = `${ASSET_ROOT}/${prefix}-${assetDirection}.${extension}`;
  }

  setPosition(x, y, animate = true) {
    this.position = { x, y };
    this.dog.classList.toggle("is-travelling", animate && !this.reducedMotion);
    this.dog.style.left = `${x * 100}%`;
    this.dog.style.top = `${y * 100}%`;
  }

  moveTo(x, y) {
    if (this.behavior.state === "gone") return;
    const next = {
      x: Math.max(0.05, Math.min(0.95, x)),
      y: Math.max(0.12, Math.min(0.88, y)),
    };
    const direction = directionForDelta(next.x - this.position.x, next.y - this.position.y);
    this.setDirection(direction, !this.reducedMotion);
    this.setPosition(next.x, next.y, true);
    this.root.dataset.state = "wandering";
    this.say("Georgie chose somewhere else to be.", 2_800);
  }

  scheduleRoutine(delay = 3_000 + Math.random() * 2_500) {
    window.clearTimeout(this.routineTimer);
    this.routineTimer = window.setTimeout(() => this.runRoutine(), delay);
  }

  runRoutine() {
    const routine = this.behavior.chooseRoutine(this.presence.occupancy);
    this.root.dataset.state = routine;

    if (routine === "wander") {
      this.moveTo(0.08 + Math.random() * 0.84, 0.18 + Math.random() * 0.65);
    } else if (routine === "chase-moth") {
      const moths = Array.from(this.arena.querySelectorAll('[data-presence-kind="moth"]'));
      const moth = moths[Math.floor(Math.random() * moths.length)];
      this.moveTo(Number(moth.dataset.x), Number(moth.dataset.y));
      this.say("A moth made a terrible tactical decision.");
    } else if (routine === "watch") {
      this.setDirection(this.position.x > 0.5 ? "left" : "right", false);
      this.dog.classList.remove("is-travelling");
      this.say("Georgie is watching the room, not obeying it.");
    } else if (routine === "rest") {
      this.setDirection("right", false);
      this.dog.classList.remove("is-travelling");
      this.say("Georgie stopped exactly where he wanted.");
    } else if (routine === "hide") {
      this.moveTo(Math.random() < 0.5 ? 0.05 : 0.95, 0.72);
      this.say("Only most of Georgie is visible.");
    }

    this.scheduleRoutine();
  }
}

export function startGeorgieWorld(root = document.querySelector("[data-georgie-world]")) {
  if (!root) return null;
  const world = new GeorgieWorld(root);
  world.start();
  window.__georgieWorld = world;
  return world;
}

startGeorgieWorld();
