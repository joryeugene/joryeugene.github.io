# Phalene-Vim Jumplist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Ctrl-O`, `Ctrl-I`, and Normal-mode `<Tab>` provide a bounded, Vim-compatible jumplist that crosses browser documents without adding cost to ordinary cursor movement.

**Architecture:** Keep jumplist state inside the existing `js/vim.js` IIFE. Replace the movement-distance heuristic with explicit recording at supported jump commands, then add a session-only document registry used only when a jump crosses documents. A small row-delta helper maintains saved jump locations after line-count edits.

**Tech Stack:** Static JavaScript, DOM `KeyboardEvent`, browser `localStorage` file fixtures, Playwright

## Global Constraints

- Add no runtime dependency, build step, parser, worker, or persistent jumplist storage.
- Record significant jumps only. Never record `h`, `j`, `k`, `l`, `w`, or `b` movement.
- Keep at most 100 entries and deduplicate consecutive entries from the same document and line.
- Preserve forward entries when a new jump follows `Ctrl-O`.
- Copy document lines only when switching documents.
- Keep insert-mode Tab and insert-mode `Ctrl-O` unchanged.
- Keep added `js/vim.js` runtime code within 4 KB gzip.
- Keep 100-key `j` medians within 10 percent of the recorded 5.0 ms at 1,000 lines and 80.4 ms at 10,000 lines.
- Preserve existing mobile input, tutor, dashboard, visual, text-object, and insert-mode behavior.

---

### Task 1: Correct same-document jumplist semantics

**Files:**
- Create: `tests/p0-jumplist.spec.js`
- Modify: `js/vim.js:1328-1404`
- Modify: `js/vim.js:3489-4390`
- Modify: `js/vim.js:4762-5045`
- Modify: `js/vim.js:5262-5461`

**Interfaces:**
- Consumes: existing `getCount()`, `render()`, `setStatus()`, `clampRow()`, `clampCol()`, `state.searchMatches`, and central `handleKey(event)` dispatch.
- Produces: `jumpPosition(row, col)`, `sameJumpLine(a, b)`, `pushJumpAt(row, col)`, `pushJump()`, `jumpOlder(count)`, `jumpNewer(count)`, and `activateJump(entry)`.
- `JumpEntry` shape after this task: `{ documentId: string, filename: string, row: number, col: number }`.

- [ ] **Step 1: Add failing tests for search traversal and `<Tab>`**

Create `tests/p0-jumplist.spec.js` with these imports and first test:

```js
import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

test.describe('P0 jumplist', () => {
  test('search, Ctrl-O, Ctrl-I, and Tab traverse significant jumps', async ({ page }) => {
    await open(page);
    await seed(page, 'start\nmiddle target\nend target');

    await press(page, '/');
    await type(page, 'target');
    await press(page, 'Enter');
    expect((await state(page)).pos).toBe('2,8');

    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'Control+i');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+o');
    await press(page, 'Tab');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+i');
    await expect(page.locator('#vim-cmdline')).toContainText('E663: At end of jumplist');
  });
});
```

- [ ] **Step 2: Run the search traversal test and verify the current heuristic fails**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js -g "search, Ctrl-O" --reporter=line
```

Expected: FAIL because a one-line search jump is not recorded consistently and Normal-mode `<Tab>` is not routed to `jumpNewer()`.

- [ ] **Step 3: Replace heuristic recording with bounded explicit traversal**

Add `documentId: 'welcome'` beside `state.filename`, then replace `jumpOlder()`, `jumpNewer()`, `pushJump()`, and `autoJump()` with this interface and behavior:

```js
function jumpPosition(row, col) {
  return {
    documentId: state.documentId,
    filename: state.filename,
    row: row,
    col: col
  };
}

function sameJumpLine(a, b) {
  return !!a && !!b && a.documentId === b.documentId && a.row === b.row;
}

function pushJumpAt(row, col) {
  var entry = jumpPosition(row, col);
  var last = state.jumpList[state.jumpList.length - 1];
  if (sameJumpLine(last, entry)) return false;
  state.jumpList.push(entry);
  if (state.jumpList.length > 100) state.jumpList.shift();
  state.jumpIdx = state.jumpList.length - 1;
  return true;
}

function pushJump() {
  return pushJumpAt(state.cursor.row, state.cursor.col);
}
```

`jumpOlder(count)` must consume a positive count passed by the caller, append the current location only when traversal starts at the newest entry, move at most `count` older entries, call `activateJump()`, and report `E662: At start of jumplist` when no requested older step remains. `jumpNewer(count)` mirrors it and reports `E663: At end of jumplist`.

For Task 1, `activateJump(entry)` updates the current cursor and calls `render()`; Task 2 extends it for document changes.

Delete both `autoJump()` calls from `handleKey()`. Do not replace them with another post-dispatch movement check.

- [ ] **Step 4: Record supported Normal and Visual jump producers explicitly**

Call `pushJump()` immediately before a successful cursor change for:

```js
// Normal and Visual movement
G, gg, H, M, L, '{', '}', '%', '[[', ']]', '[]', ']['

// Search movement
/, ?, n, N, *, #

// Marks
`{a-z}, '{a-z}
```

For `/` and `?`, call `pushJumpAt(state.preSearchCursor.row, state.preSearchCursor.col)` only when Enter accepts a real match. Incremental preview must not create entries. Make `searchNext(dir)` push the location being left before `jumpToMatch()`.

Do not add recording to motion functions used as operator ranges. `dG`, `y%`, and similar operators change text or select ranges; they do not move through the jumplist as standalone jumps.

- [ ] **Step 5: Route counts, hardware Ctrl keys, and Normal/Visual Tab**

Change the global control-key branch to consume counts:

```js
if (e.key === 'o') { jumpOlder(getCount()); return; }
if (e.key === 'i') { jumpNewer(getCount()); return; }
```

Before mode dispatch, route plain `<Tab>` only when `state.mode` is `normal` or `visual`:

```js
if (!e.ctrlKey && e.key === 'Tab' && (state.mode === 'normal' || state.mode === 'visual')) {
  e.preventDefault();
  jumpNewer(getCount());
  return;
}
```

Do not change insert-mode Tab or the insert-mode `Ctrl-O` one-command state machine.

- [ ] **Step 6: Add failing tests for ordinary movement, counts, boundaries, and forward preservation**

Add these independent tests to `tests/p0-jumplist.spec.js`:

```js
test('ordinary motions do not enter the jumplist', async ({ page }) => {
  await open(page);
  await seed(page, 'one two\nthree four\nfive six\nseven eight');
  await cmd(page, 'clearjumps');
  await press(page, '2'); await press(page, 'j');
  await press(page, 'k'); await press(page, 'l'); await press(page, 'h');
  await press(page, 'w'); await press(page, 'b');
  const before = (await state(page)).pos;
  await press(page, 'Control+o');
  expect((await state(page)).pos).toBe(before);
  await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
});

test('counts traverse jumps and do not leak', async ({ page }) => {
  await open(page);
  await seed(page, 'one\ntwo\nthree\nfour\nfive');
  await press(page, 'G');
  await press(page, 'g'); await press(page, 'g');
  await press(page, '3'); await press(page, 'G');

  await press(page, '2'); await press(page, 'Control+o');
  expect((await state(page)).pos).toBe('5,1');
  await press(page, '2'); await press(page, 'Control+i');
  expect((await state(page)).pos).toBe('3,1');
  await press(page, '2'); await press(page, 'j');
  expect((await state(page)).pos).toBe('5,1');
});

test('a new jump after Ctrl-O preserves newer entries', async ({ page }) => {
  await open(page);
  await seed(page, 'one\ntwo\nthree\nfour\nfive');
  await press(page, 'G');
  await press(page, 'g'); await press(page, 'g');
  await press(page, 'Control+o');
  await press(page, '3'); await press(page, 'G');
  await press(page, '2'); await press(page, 'Control+o');
  expect((await state(page)).pos).toBe('1,1');
});
```

- [ ] **Step 7: Run Task 1 tests and focused neighboring tests**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js tests/p0-insert.spec.js tests/p0-visual.spec.js --reporter=line
```

Expected: all tests pass. The insert-mode `Ctrl-O` and insert Tab tests remain green.

- [ ] **Step 8: Commit Task 1**

```powershell
git add js/vim.js tests/p0-jumplist.spec.js
git commit -m "fix(vim): correct jumplist traversal"
```

---

### Task 2: Restore jumps across browser documents

**Files:**
- Modify: `tests/p0-jumplist.spec.js`
- Modify: `js/vim.js:178-292`
- Modify: `js/vim.js:483-515`
- Modify: `js/vim.js:1344-1404`
- Modify: `js/vim.js:2998-3211`

**Interfaces:**
- Consumes: Task 1 `JumpEntry`, `pushJump()`, and `activateJump(entry)`.
- Produces: `saveCurrentDocument()`, `switchDocument(documentId, filename, lines, row, col)`, `renameCurrentDocument(documentId, filename)`, `nextUntitledId()`, and `documentIdForEdit(name, isBlog)`.
- `state.documents` shape: `{ [documentId: string]: { filename: string, lines: string[] } }`.

- [ ] **Step 1: Add a failing cross-document browser journey**

Add this test:

```js
test('Ctrl-O and Ctrl-I restore edited browser documents', async ({ page }) => {
  await open(page);
  await seed(page, 'beta one\nbeta two');
  await cmd(page, 'w beta');

  await cmd(page, 'enew');
  await press(page, 'i'); await type(page, 'alpha one\nalpha two'); await press(page, 'Escape');
  await cmd(page, 'w alpha');
  await press(page, 'G');
  await press(page, 'A'); await type(page, ' unsaved'); await press(page, 'Escape');

  await cmd(page, 'e beta');

  await press(page, 'Control+o');
  expect((await state(page)).file).toContain('alpha');
  expect(await lines(page)).toEqual(['alpha one', 'alpha two unsaved']);
  expect((await state(page)).pos).toBe('2,17');

  await press(page, 'Control+i');
  expect((await state(page)).file).toContain('beta');
  expect(await lines(page)).toEqual(['beta one', 'beta two']);
});
```

- [ ] **Step 2: Run the cross-document test and verify current entries cannot restore files**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js -g "restore edited browser documents" --reporter=line
```

Expected: FAIL because the current jumplist stores no document identity or document content.

- [ ] **Step 3: Add the session-only document registry**

Add these state fields during initialization. `documentId: 'welcome'` already exists from Task 1:

```js
documents: {},
untitledSeq: 0,
outputSeq: 0,
```

Implement these exact responsibilities:

```js
function saveCurrentDocument() {
  state.documents[state.documentId] = {
    filename: state.filename,
    lines: state.lines.slice()
  };
}

function switchDocument(documentId, filename, lines, row, col) {
  saveCurrentDocument();
  state.documentId = documentId;
  state.filename = filename;
  state.lines = lines.slice();
  state.cursor = { row: row || 0, col: col || 0 };
  state.cursor.row = clampRow(state.cursor.row);
  state.cursor.col = clampCol(state.cursor.row, state.cursor.col);
  state.curswant = state.cursor.col;
}
```

`nextUntitledId()` returns `untitled:` followed by a monotonically increasing integer. `nextOutputId(kind)` returns `output:<kind>:` followed by a monotonically increasing integer. `documentIdForEdit(name, isBlog)` returns `blog:<name>` for mapped blog slugs and `file:<name>` otherwise. `renameCurrentDocument(documentId, filename)` first saves the current document, then moves its registry entry from the old ID to the new ID and updates `state.documentId` and `state.filename`.

Initialize `state.documents.welcome` after `state` exists. Do not persist this registry.

- [ ] **Step 4: Extend jump activation across documents**

When `activateJump(entry)` sees a different `entry.documentId`:

```js
saveCurrentDocument();
var target = state.documents[entry.documentId];
if (!target) {
  setStatus('E92: Buffer not found: ' + entry.filename);
  return false;
}
state.documentId = entry.documentId;
state.filename = target.filename;
state.lines = target.lines.slice();
```

Then clamp and apply the entry cursor. Return `true` after a successful activation and `false` on a missing document so traversal can leave its index unchanged.

- [ ] **Step 5: Route all document-opening commands through one switch seam**

Before each successful document switch, call `pushJump()`, then `switchDocument()` with these IDs:

```text
:enew              untitled:<sequence>
:e mapped-slug     blog:<slug>
:e local-name      file:<name>
:Ex                explorer
:intro             welcome
:help topic        help:<topic-or-main>
:tutor             tutor
:marks             output:marks:<sequence>
:jumps             output:jumps:<sequence>
```

Use these display filenames: `untitled.txt` for `:enew` and `:intro`, `<slug>.md` for mapped blogs, the exact local filename for local files, `netrw` for `:Ex`, `[Help]` for help, `[Tutor]` for the tutor, `[Marks]` for `:marks`, and `[Jumps]` for `:jumps`.

For async blog fetches, capture the source `JumpEntry` before the request. Add that source entry only after the fetch succeeds and immediately before `switchDocument()`. A failed fetch must leave the jumplist and active document unchanged.

Change `:w name` so it calls `renameCurrentDocument('file:' + name, name)` before writing. Include `documentId` in undo snapshots and restore it in `undo()` and `redo()` so `u` still exits command-output buffers correctly.

- [ ] **Step 6: Add failing coverage for `:jumps` and `:clearjumps`**

Add:

```js
test(':jumps displays entries and :clearjumps resets traversal', async ({ page }) => {
  await open(page);
  await seed(page, 'one\ntwo\nthree');
  await press(page, 'G');
  await cmd(page, 'jumps');
  await expect(page.locator('#vim-content')).toContainText('jump line  col file');
  await expect(page.locator('#vim-content')).toContainText('untitled.txt');
  await press(page, 'u');
  await cmd(page, 'clearjumps');
  const before = (await state(page)).pos;
  await press(page, 'Control+o');
  expect((await state(page)).pos).toBe(before);
  await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
});
```

Add `jumps` and `clearjumps` to `cmdCompletions`. Format `:jumps` rows as `jump line  col file/text`, prefix the current traversal row with `>`, limit preview text to 40 characters, and append `Press u to return to your buffer.`.

- [ ] **Step 7: Run Task 2 and existing document tests**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js tests/vimtutor.spec.js tests/dashboard-runner.spec.js --reporter=line
```

Expected: all tests pass, including existing `:w` and `:e` round trips.

- [ ] **Step 8: Commit Task 2**

```powershell
git add js/vim.js tests/p0-jumplist.spec.js
git commit -m "feat(vim): restore cross-document jumps"
```

---

### Task 3: Keep jump rows valid and close acceptance checks

**Files:**
- Create: `tests/vim-jumplist-perf.spec.js`
- Modify: `tests/p0-jumplist.spec.js`
- Modify: `tests/mobile-vim.spec.js`
- Modify: `js/vim.js:518-580`
- Modify: `js/vim.js:1165-1509`
- Modify: `js/vim.js:1910-1960`
- Modify: `js/vim.js:3248-3445`
- Modify: `js/vim.js:4190-4205`
- Modify: `js/vim.js:4453-4528`
- Modify: `js/vim.js:4671-4679`
- Modify: `js/vim-help.js`

**Interfaces:**
- Consumes: Task 2 `state.documentId` and Task 1 `JumpEntry` rows.
- Produces: `adjustJumpRows(startRow, removedCount, addedCount)`.

- [ ] **Step 1: Add a failing edit-adjustment journey**

Add:

```js
test('saved jump rows follow inserted and deleted lines', async ({ page }) => {
  await open(page);
  await seed(page, 'top\nanchor\nbottom');
  await press(page, '/'); await type(page, 'anchor'); await press(page, 'Enter');
  await press(page, 'G');
  await press(page, 'g'); await press(page, 'g');

  await press(page, 'o'); await type(page, 'inserted'); await press(page, 'Escape');
  await press(page, 'G');
  await press(page, '3'); await press(page, 'Control+o');
  expect((await state(page)).pos).toBe('3,1');
  expect((await lines(page))[2]).toBe('anchor');

  await press(page, 'g'); await press(page, 'g');
  await press(page, 'd'); await press(page, 'd');
  await press(page, 'G');
  await press(page, '2'); await press(page, 'Control+o');
  expect((await lines(page))[(parseInt((await state(page)).pos, 10) - 1)]).toBe('anchor');
});
```

- [ ] **Step 2: Run the edit-adjustment test and verify stale rows fail**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js -g "saved jump rows" --reporter=line
```

Expected: FAIL because jump rows are plain numbers and line-count edits do not update them.

- [ ] **Step 3: Add one row-delta helper at line-count mutation seams**

Implement:

```js
function adjustJumpRows(startRow, removedCount, addedCount) {
  var endRow = startRow + removedCount;
  var delta = addedCount - removedCount;
  for (var i = 0; i < state.jumpList.length; i++) {
    var jump = state.jumpList[i];
    if (jump.documentId !== state.documentId || jump.row < startRow) continue;
    if (jump.row < endRow) jump.row = startRow;
    else jump.row += delta;
    jump.row = Math.max(0, jump.row);
  }
}
```

Add `adjustJumpRowsForRestore(nextLines)`. It finds the common line prefix and suffix between `state.lines` and `nextLines`, then calls `adjustJumpRows()` once for the changed middle range. Call it before same-document `undo()` and `redo()` restores so undoing a line insertion or deletion also restores saved jump rows.

Call `adjustJumpRows()` once for every direct line-count mutation:

- `insertLine(row, text)`: `(row, 0, 1)`.
- `deleteLine(row)`: `(row, 1, 0)`.
- Multi-line operator and Visual splices: exact removed and added counts.
- `:r` and fake-shell insertions: one call for the inserted block, outside loops.
- `J`, insert Backspace at column zero, insert `Ctrl-H` at column zero, and replayed `J`: `(deletedRow, 1, 0)`.
- `:global ... d`: delete matched lines from bottom to top through `deleteLine()` so each adjustment uses the real row.

Do not call it for same-line edits, sorting, substitutions, or document switches.

- [ ] **Step 4: Add mobile one-shot Ctrl coverage**

Add to `tests/mobile-vim.spec.js` using existing `tapKey()` and `mobileText()` helpers:

```js
test('mobile one-shot Ctrl traverses the jumplist', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await seed(page, 'one\ntwo\nthree');
  await press(page, 'G');

  const ctrl = page.locator('#vim-mobile-keys [data-vim-modifier="Control"]');
  await ctrl.tap(); await mobileText(page, 'o');
  expect((await state(page)).pos).toBe('1,1');
  await ctrl.tap(); await mobileText(page, 'i');
  expect((await state(page)).pos).toBe('3,1');
});
```

- [ ] **Step 5: Update Vim help for exact supported behavior**

In `js/vim-help.js`, document:

```text
[count] Ctrl-O   jump to older position
[count] Ctrl-I   jump to newer position
[count] Tab      jump to newer position in Normal/Visual mode
:jumps           show jump list
:clearjumps      clear jump list
```

State that ordinary `h`, `j`, `k`, `l`, `w`, and `b` motions are not jump history.

- [ ] **Step 6: Run focused behavior in all three browser engines**

Run:

```powershell
npx playwright test tests/p0-jumplist.spec.js --browser=all --reporter=line
npx playwright test tests/mobile-vim.spec.js -g "one-shot Ctrl traverses" --reporter=line
```

Expected: all jumplist tests pass in Chromium, Firefox, and WebKit; mobile test passes in Chromium. If an engine binary is missing, run `npx playwright install chromium firefox webkit` once, then rerun the same commands.

- [ ] **Step 7: Run the focused regression suite**

Run:

```powershell
npx playwright test tests/vimtutor.spec.js tests/p0-insert.spec.js tests/p0-block-visual.spec.js tests/p1-polish.spec.js tests/dashboard-runner.spec.js tests/mobile-vim.spec.js tests/p0-text-objects.spec.js tests/p0-visual.spec.js tests/p0-jumplist.spec.js --reporter=line
```

Expected: 81 existing tests plus all new jumplist tests pass with no browser errors.

- [ ] **Step 8: Verify gzip growth**

Run from the feature branch:

```powershell
$mergeBase = (git merge-base master HEAD).Trim()
node -e "const fs=require('fs'),z=require('zlib'),c=require('child_process');const base=process.argv[1];const b=c.execFileSync('git',['show',base+':js/vim.js']);const n=fs.readFileSync('js/vim.js');const d=z.gzipSync(n).length-z.gzipSync(b).length;console.log(JSON.stringify({base:z.gzipSync(b).length,current:z.gzipSync(n).length,growth:d}));if(d>4096)process.exit(1)" $mergeBase
```

Expected: `growth` is at most `4096` bytes.

- [ ] **Step 9: Add and run an opt-in ordinary-motion latency check**

Create `tests/vim-jumplist-perf.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { open, cmd } from './helpers.js';

test('ordinary j latency stays within jumplist baseline', async ({ page }) => {
  test.skip(!process.env.VIM_PERF, 'set VIM_PERF=1 to run latency acceptance');
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  const cases = [
    { size: 1000, limit: 5.5 },
    { size: 10000, limit: 88.44 }
  ];

  for (const entry of cases) {
    const name = `perf-${entry.size}`;
    const text = Array.from({ length: entry.size }, (_, i) => `line ${i}`).join('\n');
    await page.evaluate(({ name, text }) => localStorage.setItem(`vim_file_${name}`, text), { name, text });
    await cmd(page, `e ${name}`);
    const samples = await page.evaluate(() => {
      const values = [];
      for (let i = 0; i < 110; i++) {
        const start = performance.now();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true, cancelable: true }));
        if (i >= 10) values.push(performance.now() - start);
      }
      return values.sort((a, b) => a - b);
    });
    const median = samples[Math.floor(samples.length / 2)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    console.log(JSON.stringify({ lines: entry.size, median, p95 }));
    expect(median).toBeLessThanOrEqual(entry.limit);
  }
});
```

Run:

```powershell
$env:VIM_PERF='1'
npx playwright test tests/vim-jumplist-perf.spec.js --workers=1 --reporter=line
Remove-Item Env:VIM_PERF
```

This loads localStorage-backed buffers containing exactly 1,000 and 10,000 lines, dispatches 100 measured `j` events after 10 warm-up events, and prints median and p95.

Acceptance:

```text
1,000 lines median <= 5.5 ms
10,000 lines median <= 88.44 ms
```

If either limit fails twice, stop. Do not optimize unrelated rendering in this branch. Report the measured regression and its profile instead.

- [ ] **Step 10: Verify diff hygiene and commit Task 3**

```powershell
git diff --check
git status --short
git add js/vim.js js/vim-help.js tests/p0-jumplist.spec.js tests/mobile-vim.spec.js tests/vim-jumplist-perf.spec.js
git commit -m "fix(vim): keep jumplist positions current"
```

Expected: only jumplist implementation, help, tests, specification, and plan changes belong to this branch.
