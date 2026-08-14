import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Cloudflare deployment cannot run before the verified site build", async () => {
  const workflow = await readFile(".github/workflows/deploy-cloudflare.yml", "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /verify:\s*[\s\S]*npm run build:site/);
  assert.match(workflow, /deploy:\s*[\s\S]*needs: verify/);
  assert.match(workflow, /npm run test:site-artifact/);
  assert.match(workflow, /npx playwright test --workers=1/);
  assert.match(workflow, /wrangler pages deploy site-dist --project-name jorypestorious-preview/);
});
