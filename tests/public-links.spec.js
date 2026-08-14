import { test, expect } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';

const allowedPublicRepositories = new Set([
  'ai-dev-tooling',
  'calmhive-cli',
  'dadbod-grip.nvim',
  'georgie-phalene-codex-pet',
  'heavy-handed',
  'keephive',
  'tripod'
]);

const blogRoutes = readdirSync('blog', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(`blog/${entry.name}/index.html`))
  .map((entry) => `/blog/${entry.name}/`);

const publicRoutes = ['/', '/process/', '/blog/', '/contact/', '/vim/', ...blogRoutes];

function linkedJoryRepository(href) {
  const url = new URL(href);
  if (url.hostname !== 'github.com') return null;

  const [owner, repository] = url.pathname.split('/').filter(Boolean);
  if (owner?.toLowerCase() !== 'joryeugene' || !repository) return null;
  return repository.replace(/\.git$/i, '');
}

test('public routes do not link to a private Jory repository', async ({ page }) => {
  const privateDestinations = [];

  for (const route of publicRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
      href: anchor.href,
      label: (anchor.textContent || anchor.getAttribute('aria-label') || '').trim()
    })));

    for (const link of links) {
      const repository = linkedJoryRepository(link.href);
      if (repository && !allowedPublicRepositories.has(repository)) {
        privateDestinations.push({ route, repository, ...link });
      }
    }
  }

  expect(privateDestinations).toEqual([]);
});
