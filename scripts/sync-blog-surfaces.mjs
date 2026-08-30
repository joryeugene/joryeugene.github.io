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
 * Dates: each feature card and writing row carries a
 * data-pub-date="YYYY-MM-DD". If absent, the date is looked up in the
 * existing feed.xml by slug. A slug with no date anywhere causes exit 1.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const PATHS = {
  blogIndex: join(ROOT, 'blog/index.html'),
  feed: join(ROOT, 'blog/feed.xml'),
  blogCommon: join(ROOT, 'js/blog-common.js'),
  readme: join(ROOT, 'README.md'),
  marked: join(ROOT, 'js/marked.min.js'),
  sitemap: join(ROOT, 'sitemap.xml'),
  robots: join(ROOT, 'robots.txt')
};

const CHECK_MODE = process.argv.includes('--check');
const normalizeNewlines = text => text.replace(/\r\n/g, '\n');
const SITE = 'https://jorypestorious.com';
const CORE_ROUTES = ['/', '/process/', '/blog/', '/contact/', '/vim/'];

async function readOrEmpty(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

// Parse blog/index.html to an ordered list of { slug, title, summary, date }.
async function readPosts() {
  const html = await readFile(PATHS.blogIndex, 'utf8');
  const posts = [];
  const itemRe = /<(article|a)\b[^>]*class="(?:writing-feature|writing-row)"[^>]*>[\s\S]*?<\/\1>/g;
  const hrefRe = /href="\/blog\/([^/"]+)\/?"/;
  const dateRe = /data-pub-date="(\d{4}-\d{2}-\d{2})"/;

  const items = html.match(itemRe) || [];
  for (const item of items) {
    const href = item.match(hrefRe);
    const isFeature = item.includes('class="writing-feature"');
    const title = item.match(isFeature
      ? /<h2>([\s\S]*?)<\/h2>/
      : /<span class="writing-row__title">([\s\S]*?)<\/span>/);
    const summary = item.match(isFeature
      ? /<div class="writing-feature__copy">[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/
      : /<span class="writing-row__excerpt">([\s\S]*?)<\/span>/);
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
  <subtitle>I write about AI systems, developer tools, and what it takes to make them useful.</subtitle>
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

async function loadMarked() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(await readFile(PATHS.marked, 'utf8'), context, { filename: PATHS.marked });
  if (typeof context.marked?.parse !== 'function') throw new Error('Unable to load the bundled Marked parser.');
  return context.marked;
}

function markdownSourceFromHtml(html, slug) {
  const authored = html.match(/data-markdown-source=["']([^"']+)["']/)?.[1];
  const legacy = html.match(/markdownPath:\s*["']([^"']+)["']/)?.[1];
  if (!authored && !legacy && slug === 'ai-dev-tooling-presentation') return null;
  const source = (authored || legacy || '').split('?')[0];
  const prefix = `/blog/${slug}/`;
  if (!source.startsWith(prefix) || !source.endsWith('.md') || source.includes('..')) {
    throw new Error(`Missing or unsafe Markdown source for ${slug}.`);
  }
  return source;
}

function indentHtml(html, spaces = 6) {
  const prefix = ' '.repeat(spaces);
  return html.trim().split('\n').map((line) => {
    const clean = line.trimEnd();
    return clean ? prefix + clean : '';
  }).join('\n');
}

function articleSchema(post, html) {
  const image = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/)?.[1]
    || `${SITE}/jpg/jory-georgie-social.png`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    image,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${SITE}/blog/${post.slug}/`,
    author: {
      '@type': 'Person',
      name: 'Jory Pestorious',
      url: `${SITE}/`
    }
  }, null, 2).replace(/</g, '\\u003c');
}

function rewriteArticle(post, html, source, rendered) {
  const articleRe = /<article\b([^>]*\bid=["']content["'][^>]*)>[\s\S]*?<\/article>/;
  if (!articleRe.test(html)) throw new Error(`Missing article#content for ${post.slug}.`);

  let next = html.replace(articleRe, (_match, attributes) => {
    const clean = attributes.replace(/\s+data-markdown-source=["'][^"']+["']/, '');
    return `<article${clean} data-markdown-source="${source}">\n${indentHtml(rendered)}\n    </article>`;
  });
  next = next.replace(/\s*<svg\b[\s\S]*?\bid=["']change["'][\s\S]*?<\/svg>\s*/g, '\n');
  next = next.replace(/\s*<script\s+src=["']\/js\/marked\.min\.js["']><\/script>\s*/g, '\n');
  next = next.replace(/^\s*markdownPath:\s*["'][^"']+["'],?\s*$/gm, '');
  next = next.replace(/^\s*backgroundSwitcher:\s*(?:true|false),?\s*$/gm, '');

  const schema = `  <script type="application/ld+json" data-article-schema>\n${indentHtml(articleSchema(post, next), 4)}\n  </script>`;
  if (/<script\b[^>]*data-article-schema[^>]*>[\s\S]*?<\/script>/.test(next)) {
    next = next.replace(/\s*<script\b[^>]*data-article-schema[^>]*>[\s\S]*?<\/script>/, `\n${schema}`);
  } else {
    next = next.replace(/\s*<\/head>/, `\n${schema}\n</head>`);
  }
  return next;
}

async function rewriteArticles(posts) {
  const marked = await loadMarked();
  const rewrites = [];
  for (const post of posts) {
    const path = join(ROOT, 'blog', post.slug, 'index.html');
    const html = await readFile(path, 'utf8');
    const source = markdownSourceFromHtml(html, post.slug);
    if (!source) continue;
    const markdown = await readFile(join(ROOT, source.slice(1)), 'utf8');
    rewrites.push({ path, label: `blog/${post.slug}/index.html`, old: html, next: rewriteArticle(post, html, source, marked.parse(markdown)) });
  }
  return rewrites;
}

function buildSitemap(posts) {
  const urls = [
    ...CORE_ROUTES.map(route => ({ route, date: posts[0]?.date })),
    ...posts.map(post => ({ route: `/blog/${post.slug}/`, date: post.date }))
  ];
  const body = urls.map(({ route, date }) => `  <url>\n    <loc>${SITE}${route}</loc>\n    <lastmod>${date}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
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
    console.error('Add a data-pub-date="YYYY-MM-DD" attribute to each writing feature or row in blog/index.html.');
    process.exit(1);
  }

  const newFeed = buildFeed(posts);
  const newBlogCommon = await rewritePostNav(posts);
  const newReadme = await rewriteReadme(posts);
  const articleRewrites = await rewriteArticles(posts);
  const newSitemap = buildSitemap(posts);
  const newRobots = buildRobots();

  const [oldFeed, oldBlogCommon, oldReadme, oldSitemap, oldRobots] = await Promise.all([
    readFile(PATHS.feed, 'utf8'),
    readFile(PATHS.blogCommon, 'utf8'),
    readFile(PATHS.readme, 'utf8'),
    readOrEmpty(PATHS.sitemap),
    readOrEmpty(PATHS.robots)
  ]);

  const changed = [];
  if (normalizeNewlines(newFeed) !== normalizeNewlines(oldFeed)) changed.push('blog/feed.xml');
  if (normalizeNewlines(newBlogCommon) !== normalizeNewlines(oldBlogCommon)) changed.push('js/blog-common.js');
  if (normalizeNewlines(newReadme) !== normalizeNewlines(oldReadme)) changed.push('README.md');
  if (normalizeNewlines(newSitemap) !== normalizeNewlines(oldSitemap)) changed.push('sitemap.xml');
  if (normalizeNewlines(newRobots) !== normalizeNewlines(oldRobots)) changed.push('robots.txt');
  for (const article of articleRewrites) {
    if (normalizeNewlines(article.next) !== normalizeNewlines(article.old)) changed.push(article.label);
  }

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
    writeFile(PATHS.readme, newReadme),
    writeFile(PATHS.sitemap, newSitemap),
    writeFile(PATHS.robots, newRobots),
    ...articleRewrites.map(article => writeFile(article.path, article.next))
  ]);
  console.log(`Regenerated: ${changed.join(', ')}`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
