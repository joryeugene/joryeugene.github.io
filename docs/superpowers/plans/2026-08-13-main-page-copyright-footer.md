# Main-Page Copyright Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatically updated, centered copyright notice to the four main page footers while preserving their existing left and right content on desktop and keeping the notice visible on mobile.

**Architecture:** Add the same semantic notice markup to the four existing `.site-footer` elements. Convert that shared footer from flex to a three-column grid, collapse it to one centered column at the existing mobile breakpoint, and update marked year elements from the existing shared `portfolio.js` initializer.

**Tech Stack:** Static HTML, CSS Grid, browser JavaScript, Playwright.

## Global Constraints

- Change only Home, Process, Writing, and Contact; reader pages remain unchanged.
- Preserve every existing footer hint and the Writing essay count.
- Keep the copyright visible on mobile while keyboard hints remain hidden.
- Use `2026` as the no-JavaScript fallback and update only the numeric year at runtime.
- Add no dependency, build step, icon, badge, link, or `All rights reserved` suffix.

---

### Task 1: Prove the responsive footer behavior

**Files:**
- Modify: `tests/site-shell.spec.js`

**Interfaces:**
- Consumes: `.site-footer`, `.desktop-hints`, `.site-footer__note`, `.site-footer__copyright`, and `[data-current-year]` rendered by the four main pages.
- Produces: Playwright regression coverage for the notice text, desktop centering, mobile stacking, and untouched reader footers.

- [ ] **Step 1: Write the failing tests**

Add `const mainRoutes = ['/', '/process/', '/blog/', '/contact/'];` and tests that:

```js
test('main page footers show the current copyright year', async ({ page }) => {
  const currentYear = String(new Date().getFullYear());

  for (const route of mainRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-footer__copyright')).toHaveText(`© ${currentYear} Jory Pestorious`);
    await expect(page.locator('[data-current-year]')).toHaveAttribute('datetime', currentYear);
  }
});

test('Writing keeps its edge content around a centered copyright on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });

  const positions = await page.locator('.site-footer').evaluate((footer) => {
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, center: rect.left + rect.width / 2 };
    };

    return {
      footer: box(footer),
      left: box(footer.querySelector('.desktop-hints')),
      copyright: box(footer.querySelector('.site-footer__copyright')),
      right: box(footer.querySelector('.site-footer__note')),
    };
  });

  expect(positions.left.left).toBeCloseTo(positions.footer.left, 0);
  expect(positions.copyright.center).toBeCloseTo(positions.footer.center, 0);
  expect(positions.right.right).toBeCloseTo(positions.footer.right, 0);
});

test('main page copyright remains visible and Writing stacks on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of mainRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-footer__copyright')).toBeVisible();
    await expect(page.locator('.desktop-hints')).toBeHidden();
  }

  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  const note = await page.locator('.site-footer__note').boundingBox();
  const copyright = await page.locator('.site-footer__copyright').boundingBox();
  expect(note.y + note.height).toBeLessThanOrEqual(copyright.y);
});

test('reader footer remains article-specific', async ({ page }) => {
  await page.goto('/blog/terminal-velocity/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.footer')).toHaveText('© 2026 Jory Pestorious');
  await expect(page.locator('.site-footer__copyright')).toHaveCount(0);
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for the missing main-page notice**

Run: `npx playwright test tests/site-shell.spec.js`

Expected: the existing two tests pass and the new copyright tests fail because `.site-footer__copyright` and `.site-footer__note` do not exist.

### Task 2: Implement the shared footer notice

**Files:**
- Modify: `index.html:197-199,212-213`
- Modify: `process/index.html:169-171,181-182`
- Modify: `blog/index.html:129-132,142-143`
- Modify: `contact/index.html:84-86,96-97`
- Modify: `css/portfolio.css:848-861,2226-2228`
- Modify: `js/portfolio.js` inside `init()` and directly above it
- Test: `tests/site-shell.spec.js`

**Interfaces:**
- Consumes: the existing `.site-footer`, `.desktop-hints`, mobile `760px` breakpoint, and `init()` lifecycle.
- Produces: `.site-footer__copyright`, `.site-footer__note`, and `[data-current-year]` markup plus `initializeCopyrightYears()`.

- [ ] **Step 1: Add the four footer notices and identify Writing's right-side note**

Place this after each page's existing left hint. On Writing, keep the essay count before the copyright so it stacks above the copyright on mobile:

```html
<span class="site-footer__note">18 entries including the featured essay.</span>
<span class="site-footer__copyright">© <time datetime="2026" data-current-year>2026</time> Jory Pestorious</span>
```

Home, Process, and Contact add only the `.site-footer__copyright` span. Change the four `portfolio.css` and `portfolio.js` cache query values to `foundation-plus-5`.

- [ ] **Step 2: Replace the footer flex layout with the approved responsive grid**

Use:

```css
.site-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5) 0 var(--space-6);
  border-top: 1px solid var(--line);
  color: #73777b;
  font-size: 0.74rem;
}

.site-footer__copyright {
  grid-column: 2;
  justify-self: center;
  white-space: nowrap;
}

.site-footer__note {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  text-align: right;
}
```

At `max-width: 760px`, keep the existing hidden hints and add:

```css
.site-footer {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: var(--space-2);
  text-align: center;
}

.site-footer__copyright,
.site-footer__note {
  grid-column: 1;
  grid-row: auto;
  justify-self: center;
}
```

- [ ] **Step 3: Update marked years through the shared initializer**

Add and call:

```js
function initializeCopyrightYears() {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((year) => {
    year.textContent = currentYear;
    year.setAttribute('datetime', currentYear);
  });
}
```

- [ ] **Step 4: Run the focused suite and verify it passes**

Run: `npx playwright test tests/site-shell.spec.js`

Expected: all site-shell tests pass.

### Task 3: Verify and deploy the static site

**Files:**
- Verify: all files changed in Tasks 1 and 2

**Interfaces:**
- Consumes: the completed footer implementation and the repository's existing GitHub Pages deployment from `master`.
- Produces: a verified commit on `master`, pushed to `origin/master`, with the live main pages serving the new notice.

- [ ] **Step 1: Run the nearest regression gates**

Run:

```powershell
npx playwright test tests/site-shell.spec.js tests/site-interactions.spec.js tests/portfolio.spec.js
npm run check:sync
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Inspect the rendered desktop and mobile footers**

Open `/`, `/process/`, `/blog/`, and `/contact/` at 1440 by 900 and 390 by 844. Confirm the copyright is centered on desktop, remains visible on mobile, Writing preserves both edge items on desktop, and its count stacks above the copyright on mobile.

- [ ] **Step 3: Commit and push**

```powershell
git add index.html process/index.html blog/index.html contact/index.html css/portfolio.css js/portfolio.js tests/site-shell.spec.js
git add -f docs/superpowers/plans/2026-08-13-main-page-copyright-footer.md
git commit -m "feat: add main page copyright footer"
git push origin master
```

- [ ] **Step 4: Verify publication**

Confirm `origin/master` matches local `HEAD`, wait for the GitHub Pages update, then fetch the four live routes with cache-busting query parameters and confirm each response contains `site-footer__copyright` and the current year fallback.
