import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildSite } from "../../scripts/build-site.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputDir = path.join(rootDir, "site-dist");

test("builds only the public site artifact", async () => {
  const result = await buildSite({ rootDir, outputDir });

  for (const publicPath of [
    "index.html",
    "process/index.html",
    "blog/endgame-keyboard/index.html",
    "blog/endgame-keyboard/endgame-keyboard.md",
    "assets/georgie/run-right.gif",
    "georgie-lab/index.html",
    "resume/Jory-Pestorious-Resume.pdf",
  ]) {
    await access(path.join(outputDir, publicPath));
  }

  for (const privatePath of [
    ".git",
    ".github",
    ".writing-audit",
    "docs",
    "tests",
    "worker",
    "scripts",
    "package.json",
    "playwright.config.js",
    "resume/build_resume.py",
    "site-manifest.json",
  ]) {
    await assert.rejects(access(path.join(outputDir, privatePath)));
  }

  const manifest = JSON.parse(await readFile(result.manifestPath, "utf8"));
  assert.equal(manifest.fileCount, result.fileCount);
  assert.ok(manifest.fileCount > 100);
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
});
