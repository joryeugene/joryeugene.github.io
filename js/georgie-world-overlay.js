import { startGeorgieWorld } from "./georgie-world.js";

const STYLE_ID = "georgie-world-overlay-styles";

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "/css/georgie-world-overlay.css";
  document.head.append(link);
}

function createOverlay() {
  if (document.querySelector("[data-georgie-overlay]")) return null;

  const root = document.createElement("aside");
  root.className = "georgie-overlay";
  root.dataset.georgieOverlay = "";
  root.dataset.georgieWorld = "";
  root.dataset.state = "peeking";
  root.setAttribute("aria-label", "Georgie's corner of the page");
  root.innerHTML = `
    <div class="georgie-overlay__room" data-georgie-arena>
      <span class="georgie-overlay__moth" data-presence-kind="moth" data-x="0.28" data-y="0.31" style="--moth-x:28;--moth-y:31;--moth-speed:3.1s" aria-hidden="true"></span>
      <span class="georgie-overlay__moth" data-presence-kind="moth" data-x="0.61" data-y="0.24" style="--moth-x:61;--moth-y:24;--moth-speed:3.8s" aria-hidden="true"></span>
      <span class="georgie-overlay__moth" data-presence-kind="moth" data-x="0.76" data-y="0.55" style="--moth-x:76;--moth-y:55;--moth-speed:2.7s" aria-hidden="true"></span>

      <button class="georgie-overlay__bone" type="button" data-georgie-bone data-found="false" aria-label="Georgie's hidden bone"><span aria-hidden="true"></span></button>

      <button class="georgie-overlay__dog" type="button" data-georgie-dog data-invite-georgie data-direction="right" aria-label="Invite Georgie over">
        <span class="georgie-overlay__sprite" data-georgie-sprite data-motion="still" role="img" aria-label="Pixel Georgie, a small white and chestnut Phalene"></span>
        <span class="georgie-overlay__hearts" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
      <span class="georgie-overlay__live" data-georgie-reaction aria-live="polite">Georgie is deciding what to do.</span>

      <details class="georgie-overlay__presence">
        <summary aria-label="Open Georgie's room details">
          <span class="georgie-overlay__visitor-row" data-visitor-lights></span>
          <strong class="georgie-overlay__aggregate" data-presence-aggregate hidden></strong>
          <span data-room-copy>Just Georgie tonight</span>
        </summary>
        <div class="georgie-overlay__memory">
          <span data-recognition-copy>This browser is new to Georgie.</span>
          <button type="button" data-forget-georgie>Forget me</button>
        </div>
      </details>
    </div>`;

  document.body.append(root);
  return root;
}

addStyles();
const root = createOverlay();
if (root) startGeorgieWorld(root);
