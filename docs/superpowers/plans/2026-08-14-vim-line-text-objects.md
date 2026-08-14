# Phalene-Vim Line Text Objects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Do not delegate or run verification in parallel on this machine.

**Goal:** Add exact Neovim development semantics for `il`, the trimmed current line, and `al`, all lines in the active buffer, so operators and Visual mode can target these useful units without manual selection.

**Architecture:** Extend the existing `computeTextObject()` range function and the two existing accepted-object maps. Repair `applyOperator()` so a linewise text-object range may supply its own `startRow`; ordinary linewise motions that only supply `endRow` keep their current behavior. No parser, index, state object, or new module is needed.

**Upstream authority:** Neovim development commit `faf8345eef8c9a59f254d3e4bafab1a9c125ee21` documents `al` as “all lines,” selecting the whole buffer linewise, and `il` as the current line without leading or trailing whitespace. A whitespace-only line makes `il` fail. Source: <https://github.com/neovim/neovim/blob/faf8345eef8c9a59f254d3e4bafab1a9c125ee21/runtime/doc/motion.txt#L595-L604> and <https://github.com/neovim/neovim/blob/faf8345eef8c9a59f254d3e4bafab1a9c125ee21/src/nvim/textobject.c#L723-L789>.

## Global Constraints

- Preserve existing `iw`, `aw`, `iW`, `aW`, paragraph, bracket, and quote objects.
- `il` selects from the first non-whitespace character through the last non-whitespace character on the current line. It is characterwise.
- `il` returns no range on an empty or whitespace-only line.
- `al` selects rows `0` through `state.lines.length - 1`. It is linewise.
- `al` must start at row 0 even when invoked from a later row.
- Both objects work after every existing operator and from Visual mode through the current shared range paths.
- Add no sentence parser, tag parser, syntax tree, Tree-sitter, count expansion, state, dependency, or runtime scan beyond the current line for `il`.
- Added `js/vim.js` runtime must stay at or below 1,024 bytes gzip over commit `219a91f`.
- Use one focused Chromium journey with `--workers=1` for RED and GREEN.
- Run every test and verification command serially. Before Playwright, require zero other `@playwright\\test\\cli.js` processes and zero listeners on port 8767.
- Do not push or merge.

## File Map

- Create `tests/p0-line-text-objects.spec.js`: one two-phase editing journey for operator and Visual use of both objects.
- Modify `js/vim.js`: two ranges, accepted keys, and linewise `startRow` ownership.
- Modify `js/vim-help.js`: exact `il` and `al` semantics and quick reference.
- Modify `docs/superpowers/specs/2026-08-13-phalene-vim-vision-design.md`: correct the earlier inaccurate description of `al`.

---

### Task 1: Ship exact `il` and `al` text objects

**Files:**
- Create: `tests/p0-line-text-objects.spec.js`
- Modify: `js/vim.js:1484-1630`
- Modify: `js/vim.js:1674-1685`
- Modify: `js/vim.js:4267-4283`
- Modify: `js/vim.js:5461-5480`
- Modify: `js/vim-help.js:275-310`
- Modify: `js/vim-help.js:530-545`
- Modify: `docs/superpowers/specs/2026-08-13-phalene-vim-vision-design.md:169-183`

**Interfaces:**
- Consumes: `computeTextObject(prefix, obj, row, col)`, `getLine(row)`, `state.lines`, `applyOperator(op, row, col, range)`, and the existing Normal and Visual accepted-object maps.
- Produces no new public function or state.
- `il` range: `{ startRow: row, startCol: first, endRow: row, endCol: lastExclusive }`; omitted `linewise` is the existing characterwise default.
- `al` range: `{ startRow: 0, startCol: 0, endRow: lastRow, endCol: 0, linewise: true }`.

- [ ] **Step 1: Write the one focused failing browser journey**

Create `tests/p0-line-text-objects.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines, state } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('line text objects compose with operators and Visual mode', async ({ page }) => {
  await open(page);
  await seed(page, '  launch claim: moon-grade metrics  \nArchive');

  await keys(page, ['c', 'i', 'l']);
  expect((await state(page)).mode).toBe('--INSERT--');
  await type(page, 'launch claim: measured moth activity');
  await press(page, 'Escape');
  await press(page, '0');
  await keys(page, ['v', 'i', 'l', 'U']);

  expect(await lines(page)).toEqual([
    '  LAUNCH CLAIM: MEASURED MOTH ACTIVITY  ',
    'Archive'
  ]);

  await seed(page, 'Impact: 14 moths\nCause: desk lamp');
  await press(page, 'j');
  await keys(page, ['y', 'a', 'l']);
  await keys(page, ['G', 'p']);
  await keys(page, ['g', 'g', 'v', 'a', 'l', '>']);

  expect(await lines(page)).toEqual([
    '  Impact: 14 moths',
    '  Cause: desk lamp',
    '  Impact: 14 moths',
    '  Cause: desk lamp'
  ]);
});
```

The first phase proves `cil` preserves surrounding padding and `vil` selects only the trimmed text. The second invokes `yal` from row 1 so an implementation that ignores the text object's `startRow` copies only one line and fails. `val>` then proves Visual `al` is linewise and covers the entire four-line buffer.

- [ ] **Step 2: Run the focused journey RED with the global serial guard**

Run:

```powershell
$foreign = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match '@playwright[\\/]test[\\/]cli\.js' })
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8767 -ErrorAction SilentlyContinue)
if ($foreign.Count -gt 0 -or $listeners.Count -gt 0) {
  Write-Output "WAITING playwright=$($foreign.Count) listeners8767=$($listeners.Count)"
  exit 3
}
npx playwright test tests/p0-line-text-objects.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected: FAIL at the Insert-mode assertion because `l` is not accepted after `ci` and no line object exists.

- [ ] **Step 3: Add the two ranges at the existing text-object seam**

Add near the top of `computeTextObject()`:

```js
if (obj === 'l') {
  if (prefix === 'a') {
    return { startRow: 0, startCol: 0, endRow: state.lines.length - 1, endCol: 0, linewise: true };
  }
  var trimmed = line.trim();
  if (!trimmed) return null;
  var first = line.indexOf(trimmed);
  return { startRow: row, startCol: first, endRow: row, endCol: first + trimmed.length };
}
```

This is a current-line scan only. `al` does not scan the buffer; it returns its first and last row.

- [ ] **Step 4: Let linewise text objects own both row boundaries**

At the start of `applyOperator()`'s linewise branch, replace the current row-only start calculation with:

```js
startRow = Math.min(range.startRow ?? row, range.endRow);
endRow = Math.max(range.startRow ?? row, range.endRow);
```

This change is deliberately conditional. Existing linewise motions and mark operations omit `startRow` and remain anchored at the cursor. Existing `ip` and `ap` already provide `startRow`, so this also makes their full computed paragraph range effective instead of silently starting at the cursor.

- [ ] **Step 5: Route `l` through Normal and Visual text-object grammar**

Add `l:1` to both `acceptedObjs` and `vAcceptedObjs`. Do not add a new dispatcher branch. The current operator and Visual paths must remain the only execution seams.

- [ ] **Step 6: Run the same focused journey GREEN**

Run the guarded command from Step 2 without changing the assertions.

Expected visible buffers:

```text
"  LAUNCH CLAIM: MEASURED MOTH ACTIVITY  "
"Archive"
```

and:

```text
  Impact: 14 moths
  Cause: desk lamp
  Impact: 14 moths
  Cause: desk lamp
```

- [ ] **Step 7: Update help without expanding the feature**

Add to the text-object topic and main quick reference:

```text
il           inner line, without leading or trailing whitespace
al           all lines in this document, linewise
```

Map both `il` and `al` to the existing `text-objects` help topic. State that `il` fails on a blank line. Do not describe `al` as the current line or add sentence, tag, syntax, or parser claims.

- [ ] **Step 8: Run serial final checks**

After confirming no Playwright process remains, run one command at a time:

```powershell
node --check js/vim.js
node --check js/vim-help.js
node --check tests/p0-line-text-objects.spec.js
git diff --check
node -e "const fs=require('fs'),z=require('zlib'),c=require('child_process');const b=c.execFileSync('git',['show','219a91f:js/vim.js']);const n=fs.readFileSync('js/vim.js');const bg=z.gzipSync(b).length,ng=z.gzipSync(n).length;const r={base:bg,current:ng,growth:ng-bg,limit:1024};console.log(JSON.stringify(r));if(r.growth>r.limit)process.exit(1)"
```

Expected: syntax and diff checks pass, and gzip growth stays at or below 1,024 bytes.

- [ ] **Step 9: Review and commit only Wave 7**

Inspect the exact diff and status. Commit the corrected vision and implementation together:

```powershell
git add -f docs/superpowers/specs/2026-08-13-phalene-vim-vision-design.md docs/superpowers/plans/2026-08-14-vim-line-text-objects.md
git add js/vim.js js/vim-help.js tests/p0-line-text-objects.spec.js
git commit -m "feat(vim): add line text objects"
```

Report both visible buffers, focused Chromium elapsed time, gzip before/after/delta, the corrected upstream `al` definition, and the largest remaining gap. Do not push or merge.
