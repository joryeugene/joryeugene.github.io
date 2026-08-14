import { expect, test } from "@playwright/test";

test.describe("Pixel Georgie's motion owner", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/georgie-lab/?offline=1&test=1");
  });

  test("uses one chroma-free controllable sprite atlas", async ({ page }) => {
    const atlasResponse = await page.request.get("/assets/georgie/georgie-world-atlas.webp");
    expect(atlasResponse.status()).toBe(200);

    const atlas = await page.evaluate(async () => {
      const image = new Image();
      image.src = "/assets/georgie/georgie-world-atlas.webp";
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let greenPixels = 0;
      const greenSamples = [];
      for (let index = 0; index < pixels.length; index += 4) {
        const [red, green, blue, alpha] = pixels.subarray(index, index + 4);
        if (alpha > 16 && green > 120 && green > red * 1.45 && green > blue * 1.2) {
          greenPixels += 1;
          if (greenSamples.length < 8) {
            const pixel = index / 4;
            greenSamples.push({
              x: pixel % canvas.width,
              y: Math.floor(pixel / canvas.width),
              rgba: [red, green, blue, alpha],
            });
          }
        }
      }
      return { width: canvas.width, height: canvas.height, greenPixels, greenSamples };
    });

    expect(atlas.width).toBe(1536);
    expect(atlas.height).toBe(1456);
    expect(atlas.greenPixels, JSON.stringify(atlas.greenSamples)).toBe(0);
  });

  test("keeps every still pose grounded, unclipped, and the same visible scale as locomotion", async ({ page }) => {
    const cells = await page.evaluate(async () => {
      const image = new Image();
      image.src = "/assets/georgie/georgie-world-atlas.webp";
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const boxes = [];

      for (let row = 0; row < 7; row += 1) {
        const frameCount = row === 6 ? 5 : 8;
        for (let frame = 0; frame < frameCount; frame += 1) {
          let xMin = 192;
          let yMin = 208;
          let xMax = -1;
          let yMax = -1;
          for (let y = 0; y < 208; y += 1) {
            for (let x = 0; x < 192; x += 1) {
              const atlasX = frame * 192 + x;
              const atlasY = row * 208 + y;
              const alpha = pixels[(atlasY * canvas.width + atlasX) * 4 + 3];
              if (alpha <= 16) continue;
              xMin = Math.min(xMin, x);
              yMin = Math.min(yMin, y);
              xMax = Math.max(xMax, x);
              yMax = Math.max(yMax, y);
            }
          }
          boxes.push({
            row,
            frame,
            xMin,
            yMin,
            xMax,
            yMax,
            width: xMax - xMin + 1,
            height: yMax - yMin + 1,
          });
        }
      }
      return boxes;
    });

    for (const cell of cells) {
      expect(cell.xMin, JSON.stringify(cell)).toBeGreaterThanOrEqual(2);
      expect(cell.yMin, JSON.stringify(cell)).toBeGreaterThanOrEqual(2);
      expect(cell.xMax, JSON.stringify(cell)).toBeLessThanOrEqual(189);
      expect(cell.yMax, JSON.stringify(cell)).toBeLessThanOrEqual(205);
    }

    const stills = cells.filter(({ row }) => row === 6);
    expect(Math.max(...stills.map(({ yMax }) => yMax)) - Math.min(...stills.map(({ yMax }) => yMax)))
      .toBeLessThanOrEqual(1);
    stills.forEach((still, directionIndex) => {
      const moving = cells.filter(({ row }) => row === directionIndex);
      const movingMaxHeight = Math.max(...moving.map(({ height }) => height));
      const movingMaxWidth = Math.max(...moving.map(({ width }) => width));
      expect(still.height / movingMaxHeight, JSON.stringify({ still, moving })).toBeGreaterThanOrEqual(0.88);
      expect(still.height / movingMaxHeight, JSON.stringify({ still, moving })).toBeLessThanOrEqual(1.12);
      expect(still.width / movingMaxWidth, JSON.stringify({ still, moving })).toBeGreaterThanOrEqual(0.84);
      expect(still.width / movingMaxWidth, JSON.stringify({ still, moving })).toBeLessThanOrEqual(1.12);
    });
  });

  test("derives travel time from distance and settles on a grounded still", async ({ page }) => {
    const shortTrip = await page.evaluate(async () => {
      const startedAt = performance.now();
      const result = await window.__georgieWorld.moveTo(0.28, 0.68);
      return { elapsed: performance.now() - startedAt, result };
    });
    const longTrip = await page.evaluate(async () => {
      const startedAt = performance.now();
      const result = await window.__georgieWorld.moveTo(0.84, 0.2);
      return { elapsed: performance.now() - startedAt, result };
    });

    expect(shortTrip.result?.status).toBe("arrived");
    expect(longTrip.result?.status).toBe("arrived");
    expect(longTrip.elapsed).toBeGreaterThan(shortTrip.elapsed * 1.5);
    await expect(page.locator("[data-georgie-dog]")).toHaveAttribute("data-action-phase", "settle");
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "still");
    await expect(page.locator("[data-georgie-dog]")).not.toHaveClass(/is-travelling/);
  });

  test("retargets from the visible position and cancels the interrupted trip", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const dog = document.querySelector("[data-georgie-dog]");
      const firstTrip = window.__georgieWorld.moveTo(0.9, 0.18);
      await new Promise((resolve) => setTimeout(resolve, 120));
      const before = dog.getBoundingClientRect();
      const secondTrip = window.__georgieWorld.moveTo(0.22, 0.78);
      await new Promise(requestAnimationFrame);
      const after = dog.getBoundingClientRect();
      const [first, second] = await Promise.all([firstTrip, secondTrip]);
      return {
        first,
        second,
        redirectJump: Math.hypot(after.x - before.x, after.y - before.y),
      };
    });

    expect(result.first.status).toBe("cancelled");
    expect(result.second.status).toBe("arrived");
    expect(result.redirectJump).toBeLessThan(24);
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "still");
  });

  test("stops travelling before the bone wag begins", async ({ page }) => {
    const bone = page.getByRole("button", { name: "Georgie's hidden bone" });
    const arena = page.locator("[data-georgie-arena]");
    const dog = page.locator("[data-georgie-dog]");
    const boneBox = await bone.boundingBox();
    const arenaBox = await arena.boundingBox();

    await page.mouse.move(boneBox.x + boneBox.width / 2, boneBox.y + boneBox.height * 0.78);
    await page.mouse.down();
    await page.mouse.move(arenaBox.x + arenaBox.width * 0.8, arenaBox.y + arenaBox.height * 0.35, { steps: 5 });
    await page.mouse.up();

    const settled = await dog.boundingBox();
    await page.waitForTimeout(260);
    const afterWag = await dog.boundingBox();
    expect(Math.hypot(afterWag.x - settled.x, afterWag.y - settled.y)).toBeLessThan(1);
    await expect(dog).not.toHaveClass(/is-travelling/);
    await expect(page.locator("[data-georgie-sprite]")).toHaveAttribute("data-motion", "reaction");
  });
});
