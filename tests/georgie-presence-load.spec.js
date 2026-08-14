import { expect, test } from "@playwright/test";

test.skip(process.env.GEORGIE_LOAD_TEST !== "1", "Run only against the Cloudflare preview");
test.setTimeout(180_000);

test("keeps one calm room signal during a 500-visitor burst", async ({ browser }, testInfo) => {
  const baseUrl = process.env.GEORGIE_PREVIEW_BASE_URL;
  const workerUrl = process.env.GEORGIE_WORKER_URL;
  if (!baseUrl || !workerUrl) throw new Error("Preview and Worker URLs are required");

  const contexts = await Promise.all(Array.from({ length: 4 }, () => browser.newContext()));
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  await Promise.all(pages.map((page) => page.goto(baseUrl)));

  let results;
  let overflowResult;
  try {
    results = await Promise.all(pages.map((page, group) => page.evaluate(
      async ({ endpoint, total, startIndex, count }) => {
        const sockets = [];
        const runId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
        let messages = 0;
        let maxOccupancy = 0;
        const startedAt = performance.now();

        const connect = (index) => new Promise((resolve, reject) => {
          const socket = new WebSocket(
            `${endpoint}/api/presence?session=load-${runId}-${String(index).padStart(3, "0")}`,
          );
          const timer = setTimeout(() => reject(new Error(`Socket ${index} timed out`)), 20_000);
          socket.addEventListener("open", () => {
            clearTimeout(timer);
            sockets.push(socket);
            resolve();
          }, { once: true });
          socket.addEventListener("error", () => {
            clearTimeout(timer);
            reject(new Error(`Socket ${index} failed`));
          }, { once: true });
          socket.addEventListener("message", (event) => {
            messages += 1;
            try {
              const message = JSON.parse(event.data);
              if (message.type === "state") maxOccupancy = Math.max(maxOccupancy, message.occupancy);
            } catch {
              // Only valid JSON is relevant to this measurement.
            }
          });
        });

        for (let start = 0; start < count; start += 20) {
          const batch = Array.from(
            { length: Math.min(20, count - start) },
            (_, offset) => connect(startIndex + start + offset),
          );
          await Promise.all(batch);
        }

        const connectedMs = performance.now() - startedAt;
        const deadline = performance.now() + 30_000;
        while (maxOccupancy < total && performance.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        return {
          connected: sockets.length,
          connectedMs,
          observedAtMs: performance.now() - startedAt,
          maxOccupancy,
          messages,
        };
      },
      { endpoint: workerUrl, total: 500, startIndex: group * 125, count: 125 },
    )));

    overflowResult = await pages[0].evaluate((endpoint) => new Promise((resolve) => {
      const socket = new WebSocket(`${endpoint}/api/presence?session=load-overflow-501`);
      const timer = setTimeout(() => resolve("timed-out"), 10_000);
      socket.addEventListener("open", () => {
        clearTimeout(timer);
        socket.close(1000, "unexpected capacity");
        resolve("opened");
      }, { once: true });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        resolve("rejected");
      }, { once: true });
    }), workerUrl);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }

  const result = {
    connected: results.reduce((sum, group) => sum + group.connected, 0),
    connectedMs: Math.max(...results.map((group) => group.connectedMs)),
    observedAtMs: Math.max(...results.map((group) => group.observedAtMs)),
    maxOccupancy: Math.max(...results.map((group) => group.maxOccupancy)),
    messages: results.reduce((sum, group) => sum + group.messages, 0),
    overflowResult,
    browserGroups: results,
  };

  await testInfo.attach("presence-load.json", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  console.log(`GEORGIE_LOAD_RESULT ${JSON.stringify(result)}`);

  expect(result.connected).toBe(500);
  expect(result.maxOccupancy).toBeGreaterThanOrEqual(500);
  expect(result.observedAtMs).toBeLessThan(60_000);
  expect(result.overflowResult).toBe("rejected");
});
