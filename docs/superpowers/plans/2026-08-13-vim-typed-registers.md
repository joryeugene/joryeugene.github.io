# Phalene-Vim Typed Registers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a browser Vim user preserve yanks, recover older and small deletions, collect named evidence, discard unwanted text, and paste rectangular data with Vim-compatible typed registers.

**Architecture:** Replace the two scalar register fields inside the existing `js/vim.js` IIFE with a bounded register map containing `{ text, kind }` values. Route every yank, delete, change, Visual operation, and paste through shared register helpers; keep clipboard writes at the same helper seam. Add the `"{register}` grammar to the existing Normal and Visual pending-key state instead of introducing another input dispatcher.

**Tech Stack:** Static JavaScript, existing DOM `KeyboardEvent` dispatcher, existing browser clipboard fallback, Playwright

## Global Constraints

- Add no runtime dependency, build step, server API, parser, worker, storage layer, or browser permission.
- Preserve the current automatic best-effort system clipboard write for yanks and deletes.
- Preserve browser `Cmd+V` as the clipboard-read path. Do not implement explicit `+` register reads in this wave.
- Support unnamed `"`, yank `0`, delete rotation `1` through `9`, small-delete `-`, named `a` through `z`, append `A` through `Z`, and black-hole `_`.
- Support register kinds `char`, `line`, and `block`.
- A selected register is consumed by the next register-reading or register-writing command, including an error.
- `_` performs the edit but changes no register and writes nothing to the browser clipboard.
- Keep macro recording on its current `state.macroRegisters` path until Wave 5 provides normalized replay.
- Keep added `js/vim.js` runtime at or below 3,072 bytes gzip over commit `f08ad77`.
- Use one focused Chromium journey with `--workers=1` for RED and GREEN.
- Run all tests and verification commands serially. Before Playwright, require zero other `@playwright\\test\\cli.js` processes and zero listeners on port 8767.
- Do not push or merge.

## File Map

- Create `tests/p0-registers.spec.js`: one visible evidence-assembly journey covering the complete Wave 4 surface.
- Modify `js/vim.js`: typed register state, selection grammar, rotation, clipboard ownership, call-site operation types, and typed paste.
- Modify `js/vim-help.js`: exact supported register names, kinds, selection syntax, and browser clipboard boundary.
- Modify this plan only to mark completed checkpoints if needed. Do not add a register module or dependency.

---

### Task 1: Ship the typed-register evidence workflow

**Files:**
- Create: `tests/p0-registers.spec.js`
- Modify: `js/vim.js:193-199`
- Modify: `js/vim.js:464-494`
- Modify: `js/vim.js:1509-1629`
- Modify: `js/vim.js:1883-1968`
- Modify: `js/vim.js:3928-4310`
- Modify: `js/vim.js:4607-4733`
- Modify: `js/vim.js:5108-5169`
- Modify: `js/vim.js:5238-5430`
- Modify: `js/vim-help.js:17-35`
- Modify: `js/vim-help.js:479-535`

**Interfaces:**
- Consumes: existing `handleKey(event)`, `handleNormal(event)`, `handleVisual(event)`, `applyOperator(op, row, col, range)`, Visual yank/delete helpers, `pushUndo()`, `insertLine()`, `setStatus()`, and `clipboardFallback(text)`.
- Produces: `emptyRegister()`, `cloneRegister(value)`, `isRegisterName(name)`, `getRegister(name)`, `selectRegister(name)`, `takeSelectedRegisterName()`, `appendRegister(current, next)`, `writeRegister(text, kind, operation)`, `readSelectedRegister()`, and `pasteRegister(value, before)`.
- `RegisterValue`: `{ text: string, kind: 'char' | 'line' | 'block' }`.
- `operation`: `'yank'` or `'delete'`. Changes use `'delete'` because their removed text follows delete-register rules.

- [ ] **Step 1: Create the one focused failing browser journey**

Create `tests/p0-registers.spec.js` with this exact journey:

```js
import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines } from './helpers.js';

async function search(page, text) {
  await press(page, '/');
  await type(page, text);
  await press(page, 'Enter');
}

async function selectRegister(page, name) {
  await press(page, '"');
  await press(page, name);
}

test('registers preserve and assemble incident evidence', async ({ page }) => {
  await open(page);
  await seed(page, [
    'KEEP',
    'DELETE ONE',
    'DELETE TWO',
    'SMALL',
    'EVIDENCE A',
    'EVIDENCE B',
    'xy--',
    'zw--',
    '....',
    '....'
  ].join('\n'));

  // Register 0 preserves a yank while 1 and 2 rotate line deletions.
  await press(page, 'y'); await press(page, 'y');
  await press(page, 'j');
  await press(page, 'd'); await press(page, 'd');
  await press(page, 'd'); await press(page, 'd');
  await selectRegister(page, '0'); await press(page, 'P');
  await selectRegister(page, '2'); await press(page, 'P');

  // Black-hole deletion leaves unnamed on DELETE TWO.
  await selectRegister(page, '_');
  await press(page, 'd'); await press(page, 'd');
  await press(page, 'p');

  // The small-delete register restores a character deleted with x.
  await search(page, 'SMALL');
  await press(page, 'x');
  await selectRegister(page, '-'); await press(page, 'P');

  // Named uppercase append keeps two evidence lines together.
  await search(page, 'EVIDENCE A');
  await selectRegister(page, 'a');
  await press(page, 'y'); await press(page, 'y');
  await search(page, 'EVIDENCE B');
  await selectRegister(page, 'A');
  await press(page, 'y'); await press(page, 'y');
  await press(page, 'G');
  await selectRegister(page, 'a'); await press(page, 'p');

  // Visual register selection preserves the block kind for rectangular paste.
  await search(page, 'xy--');
  await press(page, 'Control+v');
  await press(page, 'j'); await press(page, 'l');
  await selectRegister(page, 'b'); await press(page, 'y');
  await search(page, '....');
  await selectRegister(page, 'b'); await press(page, 'P');

  expect(await lines(page)).toEqual([
    'KEEP',
    'KEEP',
    'DELETE TWO',
    'SMALL',
    'EVIDENCE A',
    'EVIDENCE B',
    'xy--',
    'zw--',
    'xy....',
    'zw....',
    'EVIDENCE A',
    'EVIDENCE B'
  ]);
});
```

- [ ] **Step 2: Run the journey alone and verify RED**

First run this PowerShell guard in the same command that launches Playwright:

```powershell
$foreign = @(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'node.exe' -and $_.CommandLine -match '@playwright\\test\\cli\.js'
})
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8767 -ErrorAction SilentlyContinue)
if ($foreign.Count -gt 0 -or $listeners.Count -gt 0) {
  Write-Output "WAITING playwright=$($foreign.Count) listeners8767=$($listeners.Count)"
  exit 3
}
npx playwright test tests/p0-registers.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected: FAIL at the first `"0P` outcome because the current editor has no register-selection grammar and only one scalar register.

- [ ] **Step 3: Replace scalar state with typed register state**

Replace:

```js
register: '',
registerLinewise: false,
```

with:

```js
registers: {},
selectedRegister: null,
```

Add these value helpers beside the existing clipboard helper:

```js
function emptyRegister() {
  return { text: '', kind: 'char' };
}

function cloneRegister(value) {
  return { text: value.text, kind: value.kind };
}

function isRegisterName(name) {
  return name === '"' || name === '-' || name === '_' ||
    (name >= '0' && name <= '9') ||
    (name >= 'a' && name <= 'z') ||
    (name >= 'A' && name <= 'Z');
}

function getRegister(name) {
  var key = name >= 'A' && name <= 'Z' ? name.toLowerCase() : name;
  return state.registers[key] || emptyRegister();
}

function selectRegister(name) {
  if (!isRegisterName(name)) {
    state.selectedRegister = null;
    setStatus('E354: Invalid register name: ' + name);
    return false;
  }
  state.selectedRegister = name;
  return true;
}

function takeSelectedRegisterName() {
  var name = state.selectedRegister || '"';
  state.selectedRegister = null;
  return name;
}
```

- [ ] **Step 4: Add append, rotation, and clipboard-owned writes**

Replace `setRegister(text, linewise)` with helpers following these exact rules:

```js
function appendRegister(current, next) {
  if (!current.text) return cloneRegister(next);
  if (current.kind === 'block' && next.kind === 'block') {
    var left = current.text.split('\n');
    var right = next.text.split('\n');
    var rows = [];
    var count = Math.max(left.length, right.length);
    for (var i = 0; i < count; i++) rows.push((left[i] || '') + (right[i] || ''));
    return { text: rows.join('\n'), kind: 'block' };
  }
  if (current.kind === 'char' && next.kind === 'char') {
    return { text: current.text + next.text, kind: 'char' };
  }
  return { text: current.text + '\n' + next.text, kind: 'line' };
}

function storeRegister(name, value) {
  var append = name >= 'A' && name <= 'Z';
  var key = append ? name.toLowerCase() : name;
  state.registers[key] = append
    ? appendRegister(getRegister(key), value)
    : cloneRegister(value);
}

function rotateDeleteRegisters(value) {
  for (var i = 9; i >= 2; i--) {
    var prior = state.registers[String(i - 1)];
    if (prior) state.registers[String(i)] = cloneRegister(prior);
    else delete state.registers[String(i)];
  }
  state.registers['1'] = cloneRegister(value);
}

function writeRegister(text, kind, operation) {
  var selected = takeSelectedRegisterName();
  if (selected === '_') return;
  var value = { text: text, kind: kind };
  state.registers['"'] = cloneRegister(value);
  if (operation === 'yank') state.registers['0'] = cloneRegister(value);
  else if (kind === 'line' || text.indexOf('\n') !== -1) rotateDeleteRegisters(value);
  else state.registers['-'] = cloneRegister(value);
  if (selected !== '"') storeRegister(selected, value);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function() { clipboardFallback(text); });
  } else {
    clipboardFallback(text);
  }
}

function readSelectedRegister() {
  var name = takeSelectedRegisterName();
  if (name === '_') return emptyRegister();
  return getRegister(name);
}
```

Do not retain a second scalar unnamed-register copy.

- [ ] **Step 5: Route every write call through operation and kind**

Update call sites with these mappings:

```text
Normal/Visual/operator yank       writeRegister(text, kind, 'yank')
Normal/Visual/operator delete     writeRegister(text, kind, 'delete')
Normal/Visual/operator change     writeRegister(text, kind, 'delete')
x, s, D, C                        writeRegister(text, 'char', 'delete')
S, dd, cc                         writeRegister(text, 'line', 'delete')
yy                                writeRegister(text, 'line', 'yank')
block yank                        writeRegister(rows.join('\n'), 'block', 'yank')
block delete                      writeRegister(rows.join('\n'), 'block', 'delete')
```

In `applyOperator()`, write only for `d`, `c`, and `y`. Indent and case operators must not alter registers. Pass the existing computed text once to `writeRegister()` before the edit.

Update the existing partial dot replay call sites to use the same operation and kind. Wave 5 may replace their recorder, but Wave 4 must not leave replayed deletes on the old scalar path.

- [ ] **Step 6: Add `"{register}` to Normal and Visual pending-key grammar**

In Normal mode, before operator setup:

```js
if (e.key === '"') {
  state.pendingOp = 'register';
  return;
}
```

At the start of the existing `state.pendingOp` consumer:

```js
if (op === 'register') {
  selectRegister(e.key);
  return;
}
```

In Visual mode, add:

```js
if (e.key === '"') {
  state.pendingOp = 'v_register';
  return;
}
```

and handle it before Visual find/text-object pending operations:

```js
if (vop === 'v_register') {
  selectRegister(e.key);
  return;
}
```

Clear `state.selectedRegister` on Escape, mode-cancel paths, and document switches. The normal flow consumes it inside `writeRegister()` or `readSelectedRegister()`.

- [ ] **Step 7: Replace scalar paste with typed paste**

Add one paste helper:

```js
function pasteRegister(value, before) {
  if (!value.text) { setStatus('Nothing in register'); return false; }
  var row = state.cursor.row;
  var col = state.cursor.col;
  pushUndo();
  if (value.kind === 'line') {
    var lineRows = value.text.split('\n');
    var insertAt = before ? row : row + 1;
    for (var i = lineRows.length - 1; i >= 0; i--) insertLine(insertAt, lineRows[i]);
    state.cursor.row = insertAt;
    state.cursor.col = 0;
  } else if (value.kind === 'block') {
    var blockRows = value.text.split('\n');
    var blockCol = col + (before ? 0 : 1);
    for (var bi = 0; bi < blockRows.length; bi++) {
      var targetRow = row + bi;
      while (targetRow >= state.lines.length) insertLine(state.lines.length, '');
      var target = getLine(targetRow);
      if (target.length < blockCol) target += new Array(blockCol - target.length + 1).join(' ');
      state.lines[targetRow] = target.slice(0, blockCol) + blockRows[bi] + target.slice(blockCol);
    }
    state.cursor.col = blockCol + Math.max(0, blockRows[0].length - 1);
  } else {
    var charCol = before ? col : col + 1;
    var line = getLine(row);
    state.lines[row] = line.slice(0, charCol) + value.text + line.slice(charCol);
    state.cursor.col = charCol + value.text.length - 1;
  }
  state.curswant = state.cursor.col;
  render();
  return true;
}
```

Normal `p` and `P` become:

```js
if (e.key === 'p' || e.key === 'P') {
  pasteRegister(readSelectedRegister(), e.key === 'P');
  return;
}
```

Do not infer linewise behavior from `text.indexOf('\n')`. Multiline characterwise values stay characterwise, and block values stay rectangular.

- [ ] **Step 8: Run the same journey and verify GREEN**

Run the guarded command from Step 2 without changing the test.

Expected: PASS with the exact twelve output lines asserted by the journey.

- [ ] **Step 9: Update help for the exact browser-supported surface**

Add a `registers` help topic and quick-reference section containing:

```text
"{register}     use register for the next yank, delete, change, or put
""              unnamed register
"0              most recent yank
"1 through "9   recent linewise or multiline deletes, newest first
"-              most recent same-line small delete
"a through "z   named registers
"A through "Z   append to a named register
"_              delete without changing registers or clipboard

Registers remember characterwise, linewise, and blockwise shape.
Yanks and deletes still copy to the browser clipboard.
Use Cmd+V to paste from the browser clipboard.
```

Do not document explicit `+`, `.`, `:`, `/`, `%`, `#`, or `=` registers in this wave.

- [ ] **Step 10: Run serial final checks**

After confirming no Playwright process remains, run these commands one at a time:

```powershell
node --check js/vim.js
node --check js/vim-help.js
node --check tests/p0-registers.spec.js
git diff --check
node -e "const fs=require('fs'),z=require('zlib'),c=require('child_process');const b=c.execFileSync('git',['show','f08ad77:js/vim.js']);const n=fs.readFileSync('js/vim.js');const bg=z.gzipSync(b).length,ng=z.gzipSync(n).length;const r={base:bg,current:ng,growth:ng-bg,limit:3072};console.log(JSON.stringify(r));if(r.growth>r.limit)process.exit(1)"
```

Expected:

```text
all three syntax checks exit 0
git diff --check exits 0
gzip growth <= 3072
```

- [ ] **Step 11: Inspect and commit the complete Wave 4 outcome**

Inspect:

```powershell
git status --short
git diff -- js/vim.js js/vim-help.js tests/p0-registers.spec.js
```

Only the register implementation, exact help, focused journey, specification, and plan belong on this branch.

Commit:

```powershell
git add js/vim.js js/vim-help.js tests/p0-registers.spec.js
git commit -m "feat(vim): add typed registers"
```

Report the visible twelve-line result, focused Chromium elapsed time, gzip before/after/delta, changed files, and largest remaining gap. Do not push or merge.
