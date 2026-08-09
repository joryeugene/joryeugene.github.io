#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const errors = [];

async function collectMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectMarkdown(path));
    else if (entry.isFile() && extname(entry.name) === '.md') files.push(path);
  }
  return files;
}

function isExternal(url) {
  return /^(https?:|mailto:|tel:|#)/i.test(url);
}

function withoutFragment(url) {
  return url.split('#')[0];
}

function resolveLocalLink(file, rawUrl) {
  const url = decodeURI(withoutFragment(rawUrl).trim());
  if (!url || isExternal(url)) return null;
  if (url.startsWith('/')) return join(ROOT, url.slice(1));
  if (isAbsolute(url)) return url;
  return join(dirname(file), url);
}

function checkLinks(file, text) {
  const linkRe = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of text.matchAll(linkRe)) {
    const target = resolveLocalLink(file, match[1]);
    if (!target) continue;
    const normalized = normalize(target);
    if (!existsSync(normalized)) {
      errors.push(`${file}: missing local link target ${match[1]}`);
    }
  }
}

function checkBalancedFences(file, text) {
  const fences = text.match(/^```/gm)?.length || 0;
  if (fences % 2 !== 0) errors.push(`${file}: unbalanced fenced code block`);
}

for (const file of await collectMarkdown(BLOG)) {
  const text = await readFile(file, 'utf8');
  checkBalancedFences(file, text);
  checkLinks(file, text);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Prose lint passed');
