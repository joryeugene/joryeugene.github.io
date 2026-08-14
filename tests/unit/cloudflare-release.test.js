import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("Cloudflare deployment cannot run before the verified site build", async () => {
  const workflow = await readFile(".github/workflows/deploy-cloudflare.yml", "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /verify:\s*[\s\S]*npm run build:site/);
  assert.match(workflow, /deploy:\s*[\s\S]*needs: verify/);
  assert.match(workflow, /npm run test:site-artifact/);
  assert.match(workflow, /npx playwright test --workers=1/);
  assert.match(workflow, /wrangler pages deploy --cwd cloudflare-pages --branch master/);
});

test("Pages deploys from its own configuration instead of the multiplayer Worker configuration", async () => {
  const pagesConfigPath = path.resolve("cloudflare-pages", "wrangler.jsonc");
  const [pagesConfigSource, workerConfigSource, workflow] = await Promise.all([
    readFile(pagesConfigPath, "utf8"),
    readFile("wrangler.jsonc", "utf8"),
    readFile(".github/workflows/deploy-cloudflare.yml", "utf8"),
  ]);
  const pagesConfig = JSON.parse(pagesConfigSource);
  const workerConfig = JSON.parse(workerConfigSource);

  assert.equal(pagesConfig.name, "jorypestorious-preview");
  assert.equal(
    path.resolve(path.dirname(pagesConfigPath), pagesConfig.pages_build_output_dir),
    path.resolve("site-dist"),
  );
  assert.equal(workerConfig.name, "jorypestorious-site");
  assert.equal("pages_build_output_dir" in workerConfig, false);
  assert.match(workflow, /wrangler pages deploy --cwd cloudflare-pages --branch master/);
});
