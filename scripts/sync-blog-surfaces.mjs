#!/usr/bin/env node
/*
 * sync-blog-surfaces.mjs
 *
 * blog/index.html is the single source of truth for the site's post list.
 * This script regenerates the three derived surfaces from it:
 *   1. blog/feed.xml           (Atom feed entries + feed-level updated)
 *   2. js/blog-common.js       (PostNavigation.posts array)
 *   3. README.md               (Writing section)
 *
 * Usage:
 *   node scripts/sync-blog-surfaces.mjs
 *     Regenerate all three surfaces in place. Idempotent.
 *
 *   node scripts/sync-blog-surfaces.mjs --check
 *     Exit 0 if surfaces already match. Exit 1 with a diff if they drift.
 *     Intended for pre-commit hooks.
 *
 * Dates: each <li class="blog-item"> may carry a data-pub-date="YYYY-MM-DD".
 * If absent, the date is looked up in the existing feed.xml by slug. A slug
 * that exists in blog/index.html but has no date anywhere causes exit 1.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const PATHS = {
  blogIndex: join(ROOT, 'blog/index.html'),
  feed: join(ROOT, 'blog/feed.xml'),
  blogCommon: join(ROOT, 'js/blog-common.js'),
  readme: join(ROOT, 'README.md')
};

const CHECK_MODE = process.argv.includes('--check');

// Parse blog/index.html to an ordered list of { slug, title, summary, date }.
async function readPosts() {
  const html = await readFile(PATHS.blogIndex, 'utf8');
  const posts = [];
  const itemRe = /<li class="blog-item"[^>]*>[\s\S]*?<\/li>/g;
  const hrefRe = /href="\/blog\/([^/"]+)\/?"/;
  const titleRe = /<h3>([\s\S]*?)<\/h3>/;
  const summaryRe = /<p>([\s\S]*?)<\/p>/;
  const dateRe = /data-pub-date="(\d{4}-\d{2}-\d{2})"/;

  const items = html.match(itemRe) || [];
  for (const item of items) {
    const href = item.match(hrefRe);
    const title = item.match(titleRe);
    const summary = item.match(summaryRe);
    const date = item.match(dateRe);
    if (!href) continue;
    posts.push({
      slug: href[1],
      title: title ? decodeEntities(stripTags(title[1].trim())) : '',
      summary: summary ? decodeEntities(stripTags(summary[1].trim())) : '',
      date: date ? date[1] : null
    });
  }
  return posts;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Read existing feed.xml dates by slug so we can preserve them when pub-date
// is not present in the HTML.
async function readExistingDates() {
  const xml = await readFile(PATHS.feed, 'utf8');
  const map = new Map();
  const entryRe = /<entry>[\s\S]*?<\/entry>/g;
  for (const entry of xml.match(entryRe) || []) {
    const href = entry.match(/blog\/([^/"]+)\//);
    const updated = entry.match(/<updated>(\d{4}-\d{2}-\d{2})/);
    if (href && updated) map.set(href[1], updated[1]);
  }
  return map;
}

function buildFeed(posts) {
  const newestDate = posts[0]?.date || '2026-01-01';
  const header = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Jory Pestorious - Engineering Notes</title>
  <subtitle>What emerges when complexity reaches sufficient scale?</subtitle>
  <link href="https://jorypestorious.com/blog/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="https://jorypestorious.com/blog/" rel="alternate" type="text/html"/>
  <id>https://jorypestorious.com/blog/</id>
  <updated>${newestDate}T00:00:00Z</updated>
  <author>
    <name>Jory Pestorious</name>
    <uri>https://jorypestorious.com</uri>
  </author>
`;

  const entries = posts.map(p => `
  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="https://jorypestorious.com/blog/${p.slug}/" rel="alternate" type="text/html"/>
    <id>https://jorypestorious.com/blog/${p.slug}/</id>
    <updated>${p.date}T00:00:00Z</updated>
    <summary>${escapeXml(p.summary)}</summary>
  </entry>`).join('\n');

  return header + entries + '\n\n</feed>\n';
}

function buildPostNavArray(posts) {
  const lines = posts.map(p => {
    const escTitle = p.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `    { slug: '${p.slug}', title: '${escTitle}' }`;
  });
  return lines.join(',\n') + (lines.length ? ',' : '');
}

const NAV_BEGIN = '//>>>PostNavigation.posts.begin';
const NAV_END = '//<<<PostNavigation.posts.end';

async function rewritePostNav(posts) {
  const src = await readFile(PATHS.blogCommon, 'utf8');
  const beginIdx = src.indexOf(NAV_BEGIN);
  const endIdx = src.indexOf(NAV_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(
      `Marker comments missing in js/blog-common.js. Expected lines containing ${NAV_BEGIN} and ${NAV_END} around the PostNavigation.posts array.`
    );
  }
  const beforeBegin = src.slice(0, beginIdx + NAV_BEGIN.length);
  const afterEnd = src.slice(endIdx);
  const body = '\n' + buildPostNavArray(posts) + '\n    ';
  return beforeBegin + body + afterEnd;
}

const WRITING_BEGIN = '<!--WRITING_BEGIN-->';
const WRITING_END = '<!--WRITING_END-->';

function buildReadmeSection(posts) {
  const lines = posts.map(p => `- [${p.title}](https://jorypestorious.com/blog/${p.slug}/) (${p.date})`);
  return WRITING_BEGIN + '\n\n## Writing\n\n' + lines.join('\n') + '\n\n' + WRITING_END;
}

async function rewriteReadme(posts) {
  let src = await readFile(PATHS.readme, 'utf8');
  const section = buildReadmeSection(posts);
  const beginIdx = src.indexOf(WRITING_BEGIN);
  const endIdx = src.indexOf(WRITING_END);
  if (beginIdx === -1 || endIdx === -1) {
    return src.trimEnd() + '\n\n' + section + '\n';
  }
  return src.slice(0, beginIdx) + section + src.slice(endIdx + WRITING_END.length);
}

async function main() {
  const posts = await readPosts();
  const existingDates = await readExistingDates();

  const missing = [];
  for (const p of posts) {
    if (!p.date) p.date = existingDates.get(p.slug) || null;
    if (!p.date) missing.push(p.slug);
  }
  if (missing.length) {
    console.error(`Missing publication dates for slugs: ${missing.join(', ')}`);
    console.error('Add a data-pub-date="YYYY-MM-DD" attribute to each <li class="blog-item"> in blog/index.html.');
    process.exit(1);
  }

  const newFeed = buildFeed(posts);
  const newBlogCommon = await rewritePostNav(posts);
  const newReadme = await rewriteReadme(posts);

  const [oldFeed, oldBlogCommon, oldReadme] = await Promise.all([
    readFile(PATHS.feed, 'utf8'),
    readFile(PATHS.blogCommon, 'utf8'),
    readFile(PATHS.readme, 'utf8')
  ]);

  const changed = [];
  if (newFeed !== oldFeed) changed.push('blog/feed.xml');
  if (newBlogCommon !== oldBlogCommon) changed.push('js/blog-common.js');
  if (newReadme !== oldReadme) changed.push('README.md');

  if (CHECK_MODE) {
    if (changed.length) {
      console.error(`Drift detected in: ${changed.join(', ')}`);
      console.error('Run: node scripts/sync-blog-surfaces.mjs');
      process.exit(1);
    }
    process.exit(0);
  }

  if (!changed.length) return;

  await Promise.all([
    writeFile(PATHS.feed, newFeed),
    writeFile(PATHS.blogCommon, newBlogCommon),
    writeFile(PATHS.readme, newReadme)
  ]);
  console.log(`Regenerated: ${changed.join(', ')}`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
