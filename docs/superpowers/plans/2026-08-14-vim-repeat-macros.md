# Phalene-Vim Repeat and Macro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a browser Vim user repeat any completed key-driven change with `.`, replace the original leading count with `[count].`, and record or replay bounded macros through the same central key dispatcher.

**Architecture:** Replace the command-specific `lastChange` switch with a normalized key-token transaction captured around the existing `handleKey` dispatcher. A monotonic edit serial marks whether the candidate command changed the document; returning to idle Normal mode commits only complete changes. Dot-repeat and macros replay cloned tokens through `handleKey` inside one shared recursion and 1,000-key budget, while macro tokens live in the typed register map added in Wave 4.

**Tech Stack:** Static JavaScript, existing DOM `KeyboardEvent` dispatcher, existing typed registers, Playwright

## Global Constraints

- Add no runtime dependency, build step, server API, parser, worker, storage layer, or browser permission.
- Keep `handleKey(event)` as the sole execution path for hardware keys, mobile synthesis, dot-repeat, and macro playback.
- Store normalized tokens as `{ key, ctrlKey, shiftKey, altKey }`; never store DOM events or document snapshots for repeat.
- Commit a dot transaction only after at least one `pushUndo()` and a return to idle Normal mode.
- Failed, canceled, incomplete, yank-only, motion-only, undo, and redo commands do not replace the last repeatable change.
- `[count].` replaces the original leading Normal-mode count. It does not multiply that count.
- Store macro tokens in the Wave 4 typed register map so a yank into the same named register replaces the macro.
- Keep `q{a-z}`, `@{a-z}`, `@@`, and `{count}@{a-z}`. Add Neovim-style `Q` for the most recently recorded macro.
- Share one maximum recursion depth of 10 and one maximum budget of 1,000 replayed keys per top-level dot or macro invocation.
- Escape cancels pending operator and selected-register state through the existing Normal-mode cancel path.
- Added `js/vim.js` runtime must stay at or below 2,560 bytes gzip over commit `4ec4de4`.
- Use one focused Chromium journey with `--workers=1` for RED and GREEN.
- Run every test and verification command serially. Before Playwright, require zero other `@playwright\\test\\cli.js` processes and zero listeners on port 8767.
- Do not push or merge.

## File Map

- Create `tests/p0-repeat-macros.spec.js`: one visible incident-log normalization journey for insert repeat, operator repeat, count replacement, macros, `Q`, and recursion cancellation.
- Modify `js/vim.js`: normalized tokens, transaction capture, shared replay budget, macro/register integration, `Q`, and removal of the partial command switch.
- Modify `js/vim-help.js`: exact dot-count, macro-replay, `Q`, and safety-limit behavior.
- Do not create a recorder module. The classic-script IIFE and central dispatcher remain the smallest deployment-compatible seam.

---

### Task 1: Ship normalized dot-repeat and macro reuse

**Files:**
- Create: `tests/p0-repeat-macros.spec.js`
- Modify: `js/vim.js:193-270`
- Modify: `js/vim.js:466-575`
- Modify: `js/vim.js:922-940`
- Modify: `js/vim.js:4043-5012`
- Modify: `js/vim.js:5013-5350`
- Modify: `js/vim.js:5950-6160`
- Modify: `js/vim-help.js:42-47`
- Modify: `js/vim-help.js:250-295`
- Modify: `js/vim-help.js:530-575`

**Interfaces:**
- Consumes: `handleKey(event)`, `handleNormal(event)`, `pushUndo(trackChange)`, `state.registers`, `cloneRegister(value)`, `getRegister(name)`, `setStatus(text)`, `render()`, `countBuf`, `pendingOperator`, and the existing pending-key state.
- Produces: `normalizeKeyToken(event)`, `cloneKeyToken(token)`, `keyEventFromToken(token)`, `normalCommandIdle()`, `beginRepeatCapture(event)`, `finishRepeatCapture()`, `cancelRepeatCapture()`, `replaceRepeatCount(change, count)`, `replayTokens(tokens, count)`, `repeatLastChange(count)`, `storeMacro(registerName)`, and `replayMacro(registerName, count)`.
- `KeyToken`: `{ key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean }`.
- `RepeatChange`: `{ tokens: KeyToken[], countStart: number, countLength: number }`.
- `ReplayContext`: `{ depth: number, remaining: number, stopped: boolean }` shared by nested playback.

- [ ] **Step 1: Write the one focused failing browser journey**

Create `tests/p0-repeat-macros.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { open, press, type, seed, lines } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

test('dot and macros normalize a malformed incident log', async ({ page }) => {
  await open(page);
  await seed(page, [
    'lamp-7 offline',
    'lamp-8 offline',
    'BAD moth count',
    'BAD lamp count',
    '!!!!!!keep',
    '??????keep',
    'MOTH|one|LOUD',
    'MOTH|two|LOUD',
    'MOTH|three|LOUD',
    'MOTH|four|LOUD'
  ].join('\n'));

  await press(page, 'i'); await type(page, '[ACK] '); await press(page, 'Escape');
  await keys(page, ['j', '0', '.']);

  await keys(page, ['j', '0', 'c', 'w']);
  await type(page, 'GOOD'); await press(page, 'Escape');
  await keys(page, ['j', '0', '.']);

  await keys(page, ['j', '0', '3', 'x']);
  await keys(page, ['j', '0', '2', '.']);

  await keys(page, ['j', '0', 'q', 'a', '0', 'f', '|', 'r', ':', ';', 'r', ':', 'j', 'q']);
  await keys(page, ['@', 'a', '@', '@', 'Q']);

  const normalized = [
    '[ACK] lamp-7 offline',
    '[ACK] lamp-8 offline',
    'GOOD moth count',
    'GOOD lamp count',
    '!!!keep',
    '????keep',
    'MOTH:one:LOUD',
    'MOTH:two:LOUD',
    'MOTH:three:LOUD',
    'MOTH:four:LOUD'
  ];
  expect(await lines(page)).toEqual(normalized);

  await keys(page, ['q', 'b', '@', 'b', 'q', '@', 'b']);
  await expect(page.locator('#vim-cmdline')).toContainText('recursion limit');
  expect(await lines(page)).toEqual(normalized);
});
```

- [ ] **Step 2: Run the focused journey RED with the global serial guard**

First run:

```powershell
$foreign = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match '@playwright[\\/]test[\\/]cli\.js' })
$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 8767 -ErrorAction SilentlyContinue)
if ($foreign.Count -gt 0 -or $listeners.Count -gt 0) {
  Write-Output "WAITING playwright=$($foreign.Count) listeners8767=$($listeners.Count)"
  exit 3
}
npx playwright test tests/p0-repeat-macros.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected: FAIL on the insert or operator repeat because the current partial `lastChange` recorder does not preserve a complete normalized command stream. If earlier output happens to pass, the test must still fail at `Q` because `Q` has no macro-replay mapping.

- [ ] **Step 3: Extend typed register values with optional normalized tokens**

Replace `cloneRegister(value)` with:

```js
function cloneRegister(value) {
  var copy = { text: value.text, kind: value.kind };
  if (value.tokens) {
    copy.tokens = [];
    for (var i = 0; i < value.tokens.length; i++) copy.tokens.push(cloneKeyToken(value.tokens[i]));
  }
  return copy;
}
```

Add these helpers before the register helpers:

```js
function normalizeKeyToken(e) {
  return {
    key: e.key,
    ctrlKey: !!e.ctrlKey,
    shiftKey: !!e.shiftKey,
    altKey: !!e.altKey
  };
}

function cloneKeyToken(token) {
  return {
    key: token.key,
    ctrlKey: !!token.ctrlKey,
    shiftKey: !!token.shiftKey,
    altKey: !!token.altKey
  };
}

function keyEventFromToken(token) {
  return {
    key: token.key,
    ctrlKey: !!token.ctrlKey,
    shiftKey: !!token.shiftKey,
    altKey: !!token.altKey,
    metaKey: false,
    preventDefault: function() {}
  };
}
```

Keep `emptyRegister()` as `{ text: '', kind: 'char' }`. Text yanks overwrite a prior `tokens` property because `writeRegister()` creates a fresh typed value.

- [ ] **Step 4: Replace partial repeat and macro state with bounded shared state**

Replace:

```js
lastChange: null,
macroRegisters: {},
macroRecording: null,
macroLastPlayed: null,
macroDepth: 0,
```

with:

```js
lastRepeat: null,
repeatCapture: null,
editSerial: 0,
macroRecording: null,
macroCapture: [],
macroLastPlayed: null,
macroLastRecorded: null,
replayContext: null,
```

Clear `state.repeatCapture` in `switchDocument()` beside the existing pending-request and selected-register reset. Do not clear `lastRepeat` or macro registers on document switches; Vim repeat/register state remains useful across buffers.

Increment the serial at the top of `pushUndo()`:

```js
function pushUndo(trackChange) {
  state.editSerial++;
  // existing implementation follows
}
```

The serial records an attempted undoable edit, not an undo-stack index. Insert mode can create several snapshots inside one captured change without splitting the repeat transaction.

- [ ] **Step 5: Capture one complete change around the central dispatcher**

Add:

```js
function normalCommandIdle() {
  return state.mode === 'normal' &&
    !pendingOperator && !state.pendingOp && !state.pendingTextObjOp &&
    !state.pendingGForOp && !state.pendingBracket && !state.selectedRegister &&
    !state.pendingOneNormal && !gTimer && countBuf === 0 && !state.paletteOpen;
}

function repeatCountSpan(tokens) {
  var start = tokens.length > 1 && tokens[0].key === '"' ? 2 : 0;
  var end = start;
  if (tokens[end] && /^[1-9]$/.test(tokens[end].key) && !tokens[end].ctrlKey && !tokens[end].altKey) {
    end++;
    while (tokens[end] && /^\d$/.test(tokens[end].key) && !tokens[end].ctrlKey && !tokens[end].altKey) end++;
  }
  return { start: start, length: end - start };
}

function beginRepeatCapture(e) {
  if (state.replayContext) return;
  if (!state.repeatCapture && normalCommandIdle()) {
    state.repeatCapture = { tokens: [], startSerial: state.editSerial };
  }
  if (state.repeatCapture) state.repeatCapture.tokens.push(normalizeKeyToken(e));
}

function finishRepeatCapture() {
  var capture = state.repeatCapture;
  if (!capture || state.replayContext || !normalCommandIdle()) return;
  state.repeatCapture = null;
  if (state.editSerial === capture.startSerial) return;
  var span = repeatCountSpan(capture.tokens);
  state.lastRepeat = {
    tokens: capture.tokens,
    countStart: span.start,
    countLength: span.length
  };
}

function cancelRepeatCapture() {
  state.repeatCapture = null;
}
```

Rename the current `handleKey(e)` body to `dispatchKey(e)`, then wrap it:

```js
function handleKey(e) {
  beginRepeatCapture(e);
  try {
    dispatchKey(e);
  } finally {
    finishRepeatCapture();
  }
}
```

All existing callers continue to call `handleKey`. Do not bypass this wrapper from mobile input or replay.

- [ ] **Step 6: Add shared replay budget and dot count replacement**

Replace the partial `recordChange()`, `replayChange()`, and old `replayMacro()` block with:

```js
function replayTokens(tokens, count) {
  var root = !state.replayContext;
  if (root) state.replayContext = { depth: 0, remaining: 1000, stopped: false };
  var context = state.replayContext;
  if (context.depth >= 10) {
    context.stopped = true;
    setStatus('E169: Macro recursion limit reached');
    if (root) state.replayContext = null;
    return false;
  }
  context.depth++;
  for (var i = 0; i < count && !context.stopped; i++) {
    for (var j = 0; j < tokens.length; j++) {
      if (context.remaining <= 0) {
        context.stopped = true;
        setStatus('Replay safety limit (1000 keystrokes)');
        break;
      }
      context.remaining--;
      handleKey(keyEventFromToken(tokens[j]));
      if (context.stopped) break;
    }
  }
  context.depth--;
  var completed = !context.stopped;
  if (root) state.replayContext = null;
  return completed;
}

function replaceRepeatCount(change, count) {
  var tokens = [];
  var before = change.tokens.slice(0, change.countStart);
  var after = change.tokens.slice(change.countStart + change.countLength);
  for (var i = 0; i < before.length; i++) tokens.push(cloneKeyToken(before[i]));
  var digits = String(count);
  for (var d = 0; d < digits.length; d++) tokens.push(normalizeKeyToken({ key: digits[d] }));
  for (var j = 0; j < after.length; j++) tokens.push(cloneKeyToken(after[j]));
  return tokens;
}

function repeatLastChange(count) {
  if (!state.lastRepeat || !state.lastRepeat.tokens.length) {
    setStatus('E749: Empty buffer for dot command');
    return false;
  }
  var tokens = count > 0
    ? replaceRepeatCount(state.lastRepeat, count)
    : state.lastRepeat.tokens;
  return replayTokens(tokens, 1);
}
```

Change the Normal-mode dot branch to preserve whether the user supplied a count:

```js
if (e.key === '.') {
  var explicitDotCount = countBuf;
  countBuf = 0;
  cancelRepeatCapture();
  repeatLastChange(explicitDotCount);
  render();
  return;
}
```

Cancel the outer candidate before starting `@` or `Q` as well. This prevents `2.`, `3@a`, or `Q` from replacing the last repeatable change with the replay command itself.

- [ ] **Step 7: Store and replay macros through typed registers**

Add:

```js
function storeMacro(registerName) {
  var tokens = [];
  for (var i = 0; i < state.macroCapture.length; i++) tokens.push(cloneKeyToken(state.macroCapture[i]));
  state.registers[registerName] = { text: '', kind: 'char', tokens: tokens };
  state.macroLastRecorded = registerName;
}

function replayMacro(registerName, count) {
  var value = registerName ? getRegister(registerName) : null;
  if (!value || !value.tokens || !value.tokens.length) {
    setStatus('E748: No previously used register');
    return false;
  }
  state.macroLastPlayed = registerName;
  return replayTokens(value.tokens, count);
}
```

When `q_start` receives `a` through `z`, set:

```js
state.macroRecording = e.key;
state.macroCapture = [];
```

When Normal-mode `q` stops recording, call `storeMacro(recLetter)` before clearing the status. Do not write the stopping `q` token.

Replace the dispatcher capture with:

```js
if (state.macroRecording && !state.replayContext) {
  var isStopQ = e.key === 'q' && state.mode === 'normal' && !state.pendingOp && !pendingOperator;
  if (!isStopQ) state.macroCapture.push(normalizeKeyToken(e));
}
```

Keep the existing `@` pending branch, but call the new `replayMacro()`. Add `Q` in Normal mode:

```js
if (e.key === 'Q') {
  var qCount = getCount();
  cancelRepeatCapture();
  replayMacro(state.macroLastRecorded, qCount);
  render();
  return;
}
```

`@@` continues to use `state.macroLastPlayed`. A text yank into the same named register removes `tokens` because the Wave 4 register writer stores a fresh text value.

- [ ] **Step 8: Remove the command-specific repeat implementation**

Delete:

- `state.lastChange`.
- `recordChange(type, extra)`.
- `replayChange(lc)` and its switch.
- Every `recordChange(...)` call in Normal-mode operators and direct edits.
- The Insert-mode Escape assignment to `state.lastChange.insertText`.
- `state.macroRegisters` and `state.macroDepth`.

Keep `state.insertText`; block Visual `I` and `A` still use it. Keep all existing edit functions and `pushUndo()` call sites; the new recorder observes them rather than duplicating their behavior.

Run:

```powershell
rg -n "lastChange|recordChange|replayChange|macroRegisters|macroDepth" js/vim.js
```

Expected: no matches.

- [ ] **Step 9: Run the same focused journey GREEN**

Run the guarded command from Step 2 without changing the product assertions.

Expected: PASS with the ten exact normalized log lines, then `E169: Macro recursion limit reached` while the ten lines remain unchanged.

- [ ] **Step 10: Update help for the exact supported repeat surface**

Update the `.` topic and `q`/`macros` topic with:

```text
.               repeat the last completed change
[count].        repeat it with count replacing the original leading count
q{a-z}          record normalized keys into a named register
q               stop recording
@{a-z}          play a macro
@@              replay the most recently played macro
{count}@a       play a macro count times
Q               replay the most recently recorded macro

Playback stops at recursion depth 10 or 1,000 replayed keys.
Canceled and incomplete commands do not replace the dot change.
```

Do not claim macro editing, `:normal`, `:registers`, expression registers, or macro persistence across page reloads.

- [ ] **Step 11: Run serial final checks**

After confirming no Playwright process remains, run these commands one at a time:

```powershell
node --check js/vim.js
node --check js/vim-help.js
node --check tests/p0-repeat-macros.spec.js
git diff --check
node -e "const fs=require('fs'),z=require('zlib'),c=require('child_process');const b=c.execFileSync('git',['show','4ec4de4:js/vim.js']);const n=fs.readFileSync('js/vim.js');const bg=z.gzipSync(b).length,ng=z.gzipSync(n).length;const r={base:bg,current:ng,growth:ng-bg,limit:2560};console.log(JSON.stringify(r));if(r.growth>r.limit)process.exit(1)"
```

Expected:

- All three syntax checks exit 0.
- `git diff --check` prints `DIFF_CHECK_OK` when wrapped with an explicit success marker.
- Gzip growth is at most 2,560 bytes.

- [ ] **Step 12: Review and commit only Wave 5**

Inspect:

```powershell
git status --short
git diff -- js/vim.js js/vim-help.js tests/p0-repeat-macros.spec.js
```

Only the normalized recorder, macro integration, exact help, and focused journey belong in the implementation commit.

Commit:

```powershell
git add js/vim.js js/vim-help.js tests/p0-repeat-macros.spec.js
git commit -m "feat(vim): unify repeat and macros"
```

Report the ten-line visible result, recursion-stop status, focused Chromium elapsed time, gzip before/after/delta, changed files, and largest remaining gap. Do not push or merge.
