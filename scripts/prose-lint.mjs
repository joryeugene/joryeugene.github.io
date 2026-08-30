#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');
const errors = [];
const PUBLIC_PAGES = ['index.html', 'process/index.html', 'blog/index.html', 'contact/index.html'];
const RETIRED_COPY = [
  'In this frame',
  'Visual QA',
  'Flagship',
  'Local first',
  'Playable',
  'Selected history',
  'Four systems presented different constraints',
  'could evolve without maintaining a second interface',
  'one place to examine',
  'a DuckDB path',
  'AI adoption assessment',
  'Prototype replaced in production',
  'Dadbod remains responsible for connections',
  'The calendar is compiled before publication',
  'Calendar prepared before publication',
  'incomplete appointments stay out of the schedule',
  'active database CLI still decides',
  'Install the March Release',
  'dadbod-grip v3.3.3'
];

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

for (const relativePath of PUBLIC_PAGES) {
  const file = join(ROOT, relativePath);
  const text = await readFile(file, 'utf8');
  if (text.includes('—')) errors.push(`${file}: public copy contains an em dash`);
  for (const phrase of RETIRED_COPY) {
    if (text.includes(phrase)) errors.push(`${file}: retired public phrase remains: ${phrase}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Prose lint passed');
