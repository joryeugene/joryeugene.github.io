# Phalene-Vim Current-Buffer Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Insert-mode user complete exact words from the active browser document with `Ctrl-N` and `Ctrl-P`, cycle in document order, accept a candidate by continuing to type, and stay responsive at 10,000 lines.

**Architecture:** Add one transient completion session to the existing editor state and own it entirely inside `handleInsert()`. The first completion key extracts the keyword prefix before the cursor and performs one capped, time-bounded scan of `state.lines`; later completion keys reuse that candidate array and replace only the session span. Every ordinary Insert action clears the session, while the existing central `handleKey` dispatcher remains the hardware, mobile, dot, and macro input seam.

**Tech Stack:** Static JavaScript, existing DOM keyboard dispatcher, Playwright, browser `performance.now()`

## Global Constraints

- Add no runtime dependency, build step, server API, parser, worker, cache, language server, dictionary, fuzzy ranker, snippet engine, or network request.
- Scan only `state.lines` for the active document.
- Match case-sensitive keyword runs containing letters, digits, or underscore.
- Preserve first appearance in document order and deduplicate exact candidates.
- Collect at most 200 candidates.
- Scan at most 10,000 lines.
- Stop synchronous scanning after 8 ms measured with `performance.now()`.
- Reuse the candidate list while the completion session remains active.
- Clear the session after ordinary insertion, deletion, movement, mode change, undo, document switch, `Ctrl-O`, or Escape.
- `Ctrl-N` moves forward and wraps. `Ctrl-P` moves backward and wraps.
- A first `Ctrl-P` selects the final candidate in document order.
- Replace only the active prefix or the prior candidate; never rewrite the rest of the line.
- The focused 10,000-line attempt must produce its visible candidate within 100 ms in the current Chromium environment.
- Added `js/vim.js` runtime must stay at or below 1,536 bytes gzip over commit `087bb7f`.
- Use one focused Chromium journey with `--workers=1` for RED and GREEN. The functional and 10,000-line phases belong to the same test.
- Run every test and verification command serially. Before Playwright, require zero other `@playwright\\test\\cli.js` processes and zero listeners on port 8767.
- Do not push or merge.

## File Map

- Create `tests/p0-insert-completion.spec.js`: one writer journey for forward, backward, wraparound, cancellation, and the 10,000-line latency gate.
- Modify `js/vim.js`: transient state, capped scan, cycling replacement, and Insert-mode control-key routing.
- Modify `js/vim-help.js`: exact Insert `Ctrl-N` and `Ctrl-P` behavior and limits.
- Do not create a completion module or index. The session is one small state object inside the existing IIFE.

---

### Task 1: Ship capped current-buffer completion

**Files:**
- Create: `tests/p0-insert-completion.spec.js`
- Modify: `js/vim.js:193-275`
- Modify: `js/vim.js:356-365`
- Modify: `js/vim.js:5086-5228`
- Modify: `js/vim.js:5990-6050`
- Modify: `js/vim.js:6368-6395`
- Modify: `js/vim-help.js:140-175`
- Modify: `js/vim-help.js:300-345`
- Modify: `js/vim-help.js:510-535`

**Interfaces:**
- Consumes: `state.lines`, `state.cursor`, `state.insertText`, `getLine(row)`, `pushUndo()`, `setStatus(text)`, `render()`, `handleInsert(event)`, `handleKey(event)`, and `switchDocument(...)`.
- Produces: `scanInsertCandidates(prefix)` and `completeInsert(direction)`.
- `InsertCompletion`: `{ s: number, e: number, candidates: string[], index: number }` where `s` and `e` bound the active span.
- `direction`: `1` for `Ctrl-N`, `-1` for `Ctrl-P`.

- [ ] **Step 1: Write the one focused failing browser journey**

Create `tests/p0-insert-completion.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines, cmd } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('insert completion cycles current-buffer identifiers within its latency budget', async ({ page }) => {
  await open(page);
  await seed(page, [
    'ULTRA_VIOLET_BEACON',
    'ULTRA_VIOLET_BEAM',
    'Report: '
  ].join('\n'));

  await keys(page, ['G', 'A']);
  await type(page, 'ULTRA_');
  await keys(page, ['Control+n', 'Control+n', 'Control+n', 'Control+p']);
  await type(page, ' confirmed');
  await press(page, 'Control+p');
  await press(page, 'Enter');
  await type(page, 'Backward: ULTRA_');
  await press(page, 'Control+p');
  await press(page, 'Escape');

  expect(await lines(page)).toEqual([
    'ULTRA_VIOLET_BEACON',
    'ULTRA_VIOLET_BEAM',
    'Report: ULTRA_VIOLET_BEAM confirmed',
    'Backward: ULTRA_VIOLET_BEAM'
  ]);

  const perfName = 'completion-10000';
  const perfLines = ['ULTRA_', 'ULTRA_VIOLET_BEACON'];
  for (let i = 0; i < 9998; i++) perfLines.push(`filler_${i}`);
  await page.evaluate(({ name, text }) => {
    localStorage.setItem(`vim_file_${name}`, text);
  }, { name: perfName, text: perfLines.join('\n') });
  await cmd(page, `e ${perfName}`);
  await press(page, 'A');

  const elapsed = await page.evaluate(() => {
    const start = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'n', ctrlKey: true, bubbles: true, cancelable: true
    }));
    return performance.now() - start;
  });
  const firstLine = await page.evaluate(() => {
    return document.querySelector('#vim-content').textContent.split('\n')[0];
  });

  console.log(JSON.stringify({ lines: 10000, completionMs: elapsed }));
  expect(firstLine).toBe('ULTRA_VIOLET_BEACON');
  expect(elapsed).toBeLessThanOrEqual(100);
});
```

This test fails if `Ctrl-N` or `Ctrl-P` bypasses Insert mode, the session does not wrap, ordinary text leaves a stale session, scanning crosses the budget, or rendering misses the 100 ms gate. It uses real localStorage-backed documents and the real dispatcher with no test hook.

- [ ] **Step 2: Run the focused journey RED with the global serial guard**

Run:

```powershell
$foreign = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match '@playwright[\\/]test[\\/]cli\.js' })
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8767 -ErrorAction SilentlyContinue)
if ($foreign.Count -gt 0 -or $listeners.Count -gt 0) {
  Write-Output "WAITING playwright=$($foreign.Count) listeners8767=$($listeners.Count)"
  exit 3
}
npx playwright test tests/p0-insert-completion.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected: FAIL because the current `ctrlHandled` map rejects Insert-mode `Ctrl-N` and `Ctrl-P`, leaving `Report: ULTRA_ confirmed` instead of the selected identifier.

- [ ] **Step 3: Add transient completion state and clear it on document switches**

Add to `state` beside the other Insert state:

```js
insertCompletion: null,
```

Set `state.insertCompletion = null` in `switchDocument()` beside the selected-register and repeat-capture resets. The state is small enough that direct assignment is clearer and smaller than a one-line reset helper.

- [ ] **Step 4: Scan matching words within all hard caps**

Add before `handleInsert()`:

```js
function scanInsertCandidates(prefix) {
  var candidates = [];
  var started = performance.now();
  for (var row = 0; row < state.lines.length && row < 10000; row++) {
    if (performance.now() - started >= 8) break;
    var re = /\w+/g;
    var match;
    while ((match = re.exec(state.lines[row])) !== null) {
      if (performance.now() - started >= 8) return candidates;
      var word = match[0];
      if (word !== prefix && word.indexOf(prefix) === 0 && candidates.indexOf(word) === -1) {
        candidates.push(word);
        if (candidates.length >= 200) return candidates;
      }
    }
  }
  return candidates;
}
```

The scan creates no cross-document cache. It stops at whichever cap arrives first: 200 distinct candidates, 10,000 lines, or 8 ms.

- [ ] **Step 5: Cycle and replace only the active completion span**

Add:

```js
function completeInsert(direction) {
  var session = state.insertCompletion;
  if (!session || session.e !== state.cursor.col) {
    var line = getLine(state.cursor.row);
    var end = state.cursor.col;
    var start = end;
    while (start > 0 && /\w/.test(line[start - 1])) start--;
    var prefix = line.slice(start, end);
    var candidates = prefix ? scanInsertCandidates(prefix) : [];
    if (!candidates.length) {
      state.insertCompletion = null;
      return;
    }
    session = {
      s: start,
      e: end,
      candidates: candidates,
      index: direction > 0 ? 0 : candidates.length - 1
    };
    state.insertCompletion = session;
  } else {
    session.index = (session.index + direction + session.candidates.length) % session.candidates.length;
  }

  var candidate = session.candidates[session.index];
  var line = getLine(state.cursor.row);
  var replacedLength = session.e - session.s;
  pushUndo();
  state.lines[state.cursor.row] = line.slice(0, session.s) + candidate + line.slice(session.e);
  if (state.blockInsertCols) state.insertText = state.insertText.slice(0, -replacedLength) + candidate;
  session.e = session.s + candidate.length;
  state.cursor.col = session.e;
  state.curswant = state.cursor.col;
  render();
}
```

Do not rescan during cycling. The active document row plus session offsets `s` and `e` define the only replaceable span.

- [ ] **Step 6: Route Insert `Ctrl-N` and `Ctrl-P`, then clear on every ordinary Insert action**

At the start of `handleInsert()`, after reading the current row, column, and line, add:

```js
if (e.ctrlKey && (e.key === 'n' || e.key === 'p')) {
  completeInsert(e.key === 'n' ? 1 : -1);
  return;
}
state.insertCompletion = null;
```

Add `n` and `p` to the dispatcher's supported control-key string, then extend the Insert-owned control branch:

```js
if ('rRfbudeygaxoihwvnp'.indexOf(e.key) === -1) return;
```

```js
if (state.mode === 'insert' &&
    (e.key === 'h' || e.key === 'w' || e.key === 'u' || e.key === 'n' || e.key === 'p')) {
  handleInsert(e);
  return;
}
```

Set `state.insertCompletion = null` before the existing Insert-mode `Ctrl-O` transition. Normal/Visual `Ctrl-P` continues to open the site palette because its earlier mode-specific branch remains unchanged.

In the document `paste` listener, clear `state.insertCompletion` before the existing Insert-mode clipboard mutation. Mobile text already passes through `handleKey` and therefore clears through `handleInsert()`.

- [ ] **Step 7: Run the same focused journey GREEN**

Run the guarded command from Step 2 without changing the assertions.

Expected:

- The functional buffer ends with `Report: ULTRA_VIOLET_BEAM confirmed`.
- The post-insertion `Ctrl-P` leaves that line unchanged, proving the old session was cleared.
- A first `Ctrl-P` on the next line selects the final document-order candidate.
- The 10,000-line buffer's first line visibly becomes `ULTRA_VIOLET_BEACON`.
- `completionMs` is at most 100 ms.

- [ ] **Step 8: Update help for the exact supported completion surface**

Add Insert-mode help topics for `i_CTRL-N` and `i_CTRL-P`:

```text
CTRL-N in Insert mode: complete the current word from this document.
CTRL-P in Insert mode: cycle backward through the same candidates.

Candidates keep document order, wrap, and match case.
Type or move to accept the current candidate and end completion.
The scan stops at 200 candidates, 10,000 lines, or 8 ms.
```

Add `Ctrl-n / Ctrl-p` to the main Insert-mode quick reference. Do not describe fuzzy matching, ranking, dictionaries, snippets, AI, language servers, or cross-document completion.

- [ ] **Step 9: Run serial final checks**

After confirming no Playwright process remains, run one command at a time:

```powershell
node --check js/vim.js
node --check js/vim-help.js
node --check tests/p0-insert-completion.spec.js
git diff --check
node -e "const fs=require('fs'),z=require('zlib'),c=require('child_process');const b=c.execFileSync('git',['show','087bb7f:js/vim.js']);const n=fs.readFileSync('js/vim.js');const bg=z.gzipSync(b).length,ng=z.gzipSync(n).length;const r={base:bg,current:ng,growth:ng-bg,limit:1536};console.log(JSON.stringify(r));if(r.growth>r.limit)process.exit(1)"
```

Expected:

- All syntax checks exit 0.
- `git diff --check` prints an explicit success marker when wrapped.
- Gzip growth is at most 1,536 bytes.

- [ ] **Step 10: Review and commit only Wave 6**

Inspect:

```powershell
git status --short
git diff -- js/vim.js js/vim-help.js tests/p0-insert-completion.spec.js
```

Commit:

```powershell
git add js/vim.js js/vim-help.js tests/p0-insert-completion.spec.js
git commit -m "feat(vim): add buffer word completion"
```

Report the visible report sentence, measured 10,000-line completion time, candidate and scan caps, focused Chromium elapsed time, gzip before/after/delta, and the largest remaining gap. Do not push or merge.
