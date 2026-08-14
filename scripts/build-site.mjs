import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PUBLIC_DIRECTORIES = [
  "assets",
  "blog",
  "contact",
  "css",
  "georgie-lab",
  "jpg",
  "js",
  "process",
  "svg",
  "vim",
];

const PUBLIC_FILES = [
  "404.html",
  "apple-touch-icon.png",
  "favicon.png",
  "index.html",
  "resume/Jory-Pestorious-Resume.pdf",
  "resume/georgie-lounging.png",
];

async function countFiles(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) count += await countFiles(path.join(directory, entry.name));
    else if (entry.isFile()) count += 1;
  }
  return count;
}

function validateOutput(rootDir, outputDir) {
  const root = path.resolve(rootDir);
  const output = path.resolve(outputDir);
  if (path.dirname(output) !== root || path.basename(output) !== "site-dist") {
    throw new Error(`Refusing to replace unexpected site output: ${output}`);
  }
  return { root, output };
}

export async function buildSite({ rootDir, outputDir }) {
  const { root, output } = validateOutput(rootDir, outputDir);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  for (const directory of PUBLIC_DIRECTORIES) {
    await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
  }

  for (const file of PUBLIC_FILES) {
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(root, file), destination);
  }

  const fileCount = await countFiles(output);
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: root });
  const manifestPath = path.join(root, "site-dist-manifest.json");
  const manifest = {
    builtAt: new Date().toISOString(),
    fileCount,
    publicDirectories: PUBLIC_DIRECTORIES,
    publicFiles: PUBLIC_FILES,
    sourceCommit: stdout.trim(),
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { ...manifest, manifestPath, outputDir: output };
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await buildSite({ rootDir, outputDir: path.join(rootDir, "site-dist") });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
