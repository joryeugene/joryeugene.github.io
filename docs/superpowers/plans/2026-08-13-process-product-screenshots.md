# Process Product Screenshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show one approved, locally hosted product-experience image in every Process case summary without changing the copy, interactions, or deep-dive layout.

**Architecture:** Keep the four images in static `jpg/process/` assets and render each inside its existing case article. CSS gives every article the same responsive 16:9 evidence frame; the existing overlapping-grid case panels continue to reserve the tallest case height and prevent layout movement.

**Tech Stack:** Static HTML, CSS, Playwright, Python static server

## Global Constraints

- Keep the existing case-study claims, links, deep-dive layers, rejected approaches, keyboard controls, and case order unchanged.
- Use one approved real product image per case and serve every image locally.
- Use a 16:9 evidence frame with no device chrome, carousel, gallery, caption overlay, lightbox, or animation.
- Stack the evidence frame below the existing links at tablet and phone widths.
- Do not rewrite public copy, alter the homepage, redesign the deep dive, or publish the site.

---

### Task 1: Product evidence in every case summary

**Files:**
- Create: `jpg/process/dadbod-grip-live.png`
- Create: `jpg/process/totally-reliable-ragdoll-chain.jpg`
- Create: `jpg/process/pray-orthodox-reader.png`
- Create: `jpg/process/nucleus-ai-assessment.png`
- Modify: `process/index.html`
- Modify: `css/portfolio.css`
- Test: `tests/site-interactions.spec.js`

**Interfaces:**
- Consumes: Existing `[data-case-tab]`, `[data-case-panel]`, and overlapping case-panel grid behavior.
- Produces: One `.process-case-shot > img` inside every case panel with a local `src`, exact alternative text, intrinsic dimensions, lazy loading, and async decoding.

- [ ] **Step 1: Write the failing browser test**

Add this test beside the existing Process case test in `tests/site-interactions.spec.js`:

```js
test('Process summaries show local product evidence in a stable landscape frame', async ({ page }) => {
  const cases = [
    ['Dadbod Grip', '/jpg/process/dadbod-grip-live.png', 'Dadbod Grip in Neovim with schema navigation, a query editor, staged grid changes, and generated SQL.'],
    ['Totally Reliable', '/jpg/process/totally-reliable-ragdoll-chain.jpg', 'Four Totally Reliable Delivery Service ragdolls hanging in a chain beneath a flying jetpack.'],
    ['Theosis', '/jpg/process/pray-orthodox-reader.png', 'Pray Orthodox showing the daily calendar beside the Third Hour prayer reader.'],
    ['Workhelix', '/jpg/process/nucleus-ai-assessment.png', 'Nucleus AI Assessment dashboard with opportunity metrics, a business-unit chart, and a use-case treemap.']
  ];

  await page.goto('/process/');

  for (const [name, src, alt] of cases) {
    await page.getByRole('tab', { name, exact: true }).click();
    const image = page.locator('[data-case-panel]:visible .process-case-shot img');
    await expect(image).toHaveAttribute('src', src);
    await expect(image).toHaveAttribute('alt', alt);
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect(image).toBeVisible();
    expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    const box = await page.locator('[data-case-panel]:visible .process-case-shot').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
  }
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
npx playwright test tests/site-interactions.spec.js --grep "Process summaries show local product evidence" --reporter=line
```

Expected: FAIL because `.process-case-shot img` does not exist.

- [ ] **Step 3: Copy the four approved source files into `jpg/process/`**

Copy without modifying source pixels:

```powershell
New-Item -ItemType Directory -Path 'jpg\process' -Force | Out-Null
Copy-Item -LiteralPath 'blog\dadbod-grip\live.png' -Destination 'jpg\process\dadbod-grip-live.png'
Copy-Item -LiteralPath 'C:\Users\joryp\Documents\GitHub\joryeugene.github.io\.artifacts\process-screenshot-candidates\totally-reliable-jetpack-chain.jpg' -Destination 'jpg\process\totally-reliable-ragdoll-chain.jpg'
Copy-Item -LiteralPath 'C:\Users\joryp\Documents\GitHub\joryeugene.github.io\.artifacts\process-screenshot-candidates\pray-orthodox-reader.png' -Destination 'jpg\process\pray-orthodox-reader.png'
Copy-Item -LiteralPath 'C:\Users\joryp\Documents\GitHub\joryeugene.github.io\.artifacts\process-screenshot-candidates\nucleus-ai-assessment.png' -Destination 'jpg\process\nucleus-ai-assessment.png'
```

- [ ] **Step 4: Add the minimal summary markup**

Wrap each case's existing copy in `.process-case-copy`, then add this sibling figure with the case-specific values:

```html
<figure class="process-case-shot">
  <img src="/jpg/process/dadbod-grip-live.png" alt="Dadbod Grip in Neovim with schema navigation, a query editor, staged grid changes, and generated SQL." width="3436" height="2078" loading="lazy" decoding="async">
</figure>
```

Use intrinsic dimensions `2249 × 1500` for Totally Reliable, `1440 × 900` for Pray Orthodox, and `1456 × 1311` for Nucleus. Update the Process page stylesheet cache query from `foundation-plus-3` to `foundation-plus-4`.

- [ ] **Step 5: Add the minimal responsive frame styles**

Update the case summary rules in `css/portfolio.css`:

```css
.process-case-detail article {
  grid-area: 1 / 1;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
  gap: var(--space-6);
  align-items: center;
}

.process-case-copy {
  min-width: 0;
}

.process-case-copy > p:not(.eyebrow) {
  max-width: 900px;
  margin: 0;
  color: var(--muted);
}

.process-case-shot {
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(164, 139, 230, 0.38);
  background: #05080b;
}

.process-case-shot img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#case-workhelix .process-case-shot img {
  object-position: 50% 35%;
}

@media (max-width: 1120px) {
  .process-case-detail article {
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
  }
}
```

- [ ] **Step 6: Run the new test and verify GREEN**

Run the Step 2 command again.

Expected: `1 passed` with all four local images loaded and each frame within `0.02` of 16:9.

- [ ] **Step 7: Run the Process regression suite**

Run:

```powershell
npx playwright test tests/portfolio.spec.js tests/site-interactions.spec.js --grep "Process|process|tabbed surfaces reserve" --reporter=line
```

Expected: all selected tests pass, including the 320 through 1440 pixel layout-stability matrix.

- [ ] **Step 8: Commit the feature**

```powershell
git add process/index.html css/portfolio.css tests/site-interactions.spec.js jpg/process
git commit -m "feat: show product screenshots in process cases"
```

### Task 2: Visual acceptance and local handoff

**Files:**
- Verify: `process/index.html`
- Verify: `css/portfolio.css`
- Verify: `jpg/process/*`
- Create ignored evidence: `.artifacts/process-product-screenshots/desktop-*.png`
- Create ignored evidence: `.artifacts/process-product-screenshots/mobile-*.png`

**Interfaces:**
- Consumes: The completed Task 1 static page and assets.
- Produces: A running local URL and desktop/mobile evidence for all four cases.

- [ ] **Step 1: Run the complete portfolio and interaction suites**

Run:

```powershell
npx playwright test tests/portfolio.spec.js tests/site-interactions.spec.js --reporter=line
```

Expected: all tests in both files pass with zero failures.

- [ ] **Step 2: Start a retained local server**

Run a hidden Python server from the worktree on port `8771`, then verify `http://localhost:8771/process/` returns HTTP 200.

- [ ] **Step 3: Inspect desktop and mobile product frames**

At `1440 × 900` and `390 × 844`, select every case and capture the current source. Verify:

- All four screenshots are legible and preserve the intended evidence.
- The copy remains visually dominant enough to explain the image.
- Totally Reliable keeps all four connected bodies visible.
- Nucleus includes the top metrics, opportunity chart, and part of the treemap.
- No horizontal overflow, clipping, or case-switch layout movement appears.

- [ ] **Step 4: Run final repository checks**

Run:

```powershell
git diff --check HEAD~1..HEAD
git status --short --branch
```

Expected: no whitespace errors and no uncommitted production changes.

- [ ] **Step 5: Open the local Process page in Codex**

Open `http://localhost:8771/process/` as the deliverable browser tab and keep the local server running for review.
