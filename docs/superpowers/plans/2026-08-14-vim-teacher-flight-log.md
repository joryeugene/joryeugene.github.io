# Phalene-Vim Teacher Flight Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the shipped `:teacher` project into a safe guided investigation with session-only learning metrics, optional Vim-golf coaching, correct `cc` and undo behavior, and one verified final postmortem.

**Architecture:** Keep teacher content in `js/vim-teacher.js` and controller state inside the existing `js/vim.js` IIFE. Add one explicit return anchor for generated guides, one bounded in-memory metric record, and one small `:registers` output command. Extend the existing single Playwright capstone through serial RED and GREEN cycles.

**Tech Stack:** Static JavaScript, classic browser scripts, existing DOM renderer, Playwright Chromium, PowerShell, Node syntax checks, Node `zlib` gzip measurement.

## Global Constraints

- Use the approved design in `docs/superpowers/specs/2026-08-14-vim-teacher-flight-log-design.md` as authority.
- Keep exactly six teacher work files. Generated guides and command output are not work files.
- Keep all metrics in memory. Do not use `localStorage`, requests, accounts, analytics, cookies, or URL state.
- Add no dependency, build step, worker, database, permission prompt, or generalized course engine.
- Preserve hardware, mobile, dot-repeat, and macro input through the central dispatcher.
- Add at most 4,096 gzip bytes over commit `1c3a375` across `js/vim.js`, `js/vim-teacher.js`, `js/vim-help.js`, and `vim/index.html`.
- Keep mission brief, score, golf, and return transitions at or below 100 ms in the focused Chromium environment.
- Keep one Playwright test named `teacher turns a corrupt launch into a verified postmortem`.
- Run one verifier for this repository at a time. Use one Chromium worker. Default to port 8767. If another project owns that port, set `PHALENE_PLAYWRIGHT_PORT` to one inspected free port.
- Run every test, syntax check, size check, and browser receipt serially.
- Do not push, merge, or deploy.

## File Map

- Modify `tests/p0-teacher.spec.js`: the sole automated journey and all RED assertions.
- Modify `js/vim.js`: guide flow, read-only protection, `cc`, undo blocks, counted undo, register display, metrics, score, and golf commands.
- Modify `js/vim-teacher.js`: mission golf records, mission 7 normalization copy, mission 8 jump guidance, and completion humor.
- Modify `js/vim-help.js`: `:teacher score`, `:teacher golf`, `:registers`, `:display`, counted undo, and guide behavior.
- Modify `docs/superpowers/specs/2026-08-14-phalene-vim-feature-teaching-matrix.md`: final feature ownership and evidence.
- Modify this plan as each checkbox completes.

---

### Task 1: Mission Brief Flow and Protected Return

**Files:**
- Modify: `tests/p0-teacher.spec.js:18-55`
- Modify: `js/vim.js:250-280, 3590-3770, 6270-6425`

**Interfaces:**
- Consumes: `switchDocument(documentId, filename, lines, row, col)`, `teacherDocumentId(filename)`, `teacherGuideLines(showHint)`, and the central `dispatchKey(e)`.
- Produces: `state.teacherReturn`, `isTeacherGuide()`, `teacherCaptureReturn()`, `teacherReturnToWork()`, `teacherShowGuide(showHint, status, extraLines)`, and `teacherOpenMissionBrief()`.

- [x] **Step 1: Change the existing test to require the mission brief first**

Replace the old `nextMission` helper with:

```js
async function openMission(page, number, filename) {
  await cmd(page, 'teacher next');
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain(`MISSION ${number} OF 8`);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe(filename);
}
```

After mission 1 opens, attempt `i`, assert `#vim-cmdline` contains `E21`, and assert the brief text did not change. Attempt `:%s/PHALENE/BROKEN/`, assert the same E21 status, and assert the guide still contains `PHALENE`. Return with `Ctrl-O`, press `Ctrl-I`, and assert the active file is not `[Teacher]`.

- [x] **Step 2: Run the sole Chromium journey and observe RED**

First confirm no verifier and no listener on the selected port. When 8767 belongs to another project, inspect a free port and set it for this process. Then run:

```powershell
npx playwright test tests/p0-teacher.spec.js --browser=chromium --workers=1 --reporter=line
```

Example safe override:

```powershell
$env:PHALENE_PLAYWRIGHT_PORT='8768'
npx playwright test tests/p0-teacher.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected RED: `:teacher next` opens `incident.log` instead of `[Teacher]`.

- [x] **Step 3: Add an explicit teacher return anchor**

Add this state field:

```js
teacherReturn: null,
```

Add these controller helpers:

```js
function isTeacherGuide() {
  return state.documentId === 'teacher:guide';
}

function teacherCaptureReturn() {
  if (isTeacherGuide()) return;
  saveCurrentDocument();
  state.teacherReturn = {
    documentId: state.documentId,
    filename: state.filename,
    row: state.cursor.row,
    col: state.cursor.col
  };
}

function teacherReturnToWork() {
  var anchor = state.teacherReturn;
  var document = anchor && state.documents[anchor.documentId];
  if (!anchor || !document) {
    setStatus('No teacher work file to return to.');
    return;
  }
  state.teacherReturn = null;
  switchDocument(anchor.documentId, document.filename, document.lines,
    anchor.row, anchor.col);
  render();
}
```

`teacherShowGuide()` calls `teacherCaptureReturn()` and switches to `teacher:guide` without `pushJump()` or `pushUndo(false)`. `teacherOpenMissionBrief()` switches to the mission work document, captures it, then shows the regenerated guide. It calls `pushJump()` only when the source document is not `teacher:guide`, so orientation and other generated guides never enter the jumplist. `teacher next` uses that function for missions 1 through 8.

Keep the existing `showHint` and `status` arguments. Add optional `extraLines`. When present, append one blank line and `extraLines` to the regenerated guide before the switch. Score and golf views use this argument instead of creating another document type.

At the start of the Normal or Visual Ctrl-O branch, route `isTeacherGuide()` to `teacherReturnToWork()` before ordinary `jumpOlder(getCount())`. Consume any count before the special return.

- [x] **Step 4: Protect the generated guide**

Add a bounded guide-only key guard before mode dispatch. Permit motions, searches, yanks, marks, help, and teacher commands. Reject editing initiators and pending editing chords:

```js
function blockTeacherGuideEdit(e) {
  if (!isTeacherGuide()) return false;
  var normalEdits = 'iIaAoORsScCdDxXpPJr~><.@QuU&';
  var visualEdits = 'cCdxsSpP~><uU';
  var blocked = state.mode === 'insert' || state.mode === 'replace' ||
    (state.mode === 'normal' && normalEdits.indexOf(e.key) !== -1) ||
    (state.mode === 'visual' && visualEdits.indexOf(e.key) !== -1) ||
    (e.ctrlKey && (e.key === 'a' || e.key === 'x' || e.key === 'r'));
  if (!blocked) return false;
  countBuf = 0;
  pendingOperator = null;
  state.pendingOp = null;
  state.pendingGForOp = false;
  setStatus("E21: Cannot make changes, 'modifiable' is off");
  return true;
}
```

Handle modifying Ex branches for substitute, global delete, sort, and read with the same E21 status when `isTeacherGuide()` is true. Regenerate guide lines every time a teacher guide opens.

- [x] **Step 5: Run the same journey and observe GREEN through mission 1**

Use the same one-worker command. Expected: mission 1 brief appears, `i` reports E21, `Ctrl-O` returns to `incident.log`, and `Ctrl-I` does not reopen `[Teacher]`.

- [x] **Step 6: Commit the completed flow slice**

```powershell
git add tests/p0-teacher.spec.js js/vim.js
git diff --cached --check
git commit -m "fix(vim): protect teacher mission flow"
```

---

### Task 2: Correct `cc` and Vim Undo Blocks

**Files:**
- Modify: `tests/p0-teacher.spec.js`
- Modify: `js/vim.js:270-280, 960-1030, 1680-1810, 4620-4640, 4980-5160, 5330-5540`
- Modify: `js/vim-help.js:20-35, 65-75`

**Interfaces:**
- Consumes: `pushUndo(trackChange)`, `applyOperator(op, row, col, range)`, `handleInsert(e)`, `handleReplace(e)`, and `getCount()`.
- Produces: `state.insertUndoOpen`, `state.replaceUndoOpen`, `ensureInsertUndo()`, `ensureReplaceUndo()`, corrected linewise change insertion, and counted Normal undo.

- [x] **Step 1: Add the failing undo and `cc` segment to the one journey**

Before starting `:teacher`, seed this buffer through existing helpers:

```text
header
alpha
beta
tail
```

Perform `jccONE<Esc>jccTWO<Esc>`, assert all four lines remain, then perform `2u` and assert the original four lines return. Press `j` once and assert the count did not leak.

In the same preflight, prove direct Insert and Replace boundaries. Append three characters with `Axyz<Esc>`, press `u`, and assert all three disappear together. Replace three characters with `RXYZ<Esc>`, press `u`, and assert all three original characters return together.

Expected RED: the first `cc` consumes `beta`, and `2u` does not restore two complete Insert sessions.

- [x] **Step 2: Run the sole journey and observe the exact RED output**

Use the guarded one-worker command. Record the visible four-line mismatch before editing production code.

- [x] **Step 3: Fix linewise change insertion**

Replace the linewise `c` branch with one splice that removes the selected range and inserts one replacement line:

```js
var changedLineCount = endRow - startRow + 1;
adjustJumpRows(startRow, changedLineCount, 1);
state.lines.splice(startRow, changedLineCount, '');
state.cursor.row = startRow;
state.cursor.col = 0;
state.mode = 'insert';
state.insertUndoOpen = true;
```

Do not overwrite `state.lines[startRow]` after deletion.

- [x] **Step 4: Group Insert and Replace sessions**

Add state fields:

```js
insertUndoOpen: false,
replaceUndoOpen: false,
```

Add:

```js
function ensureInsertUndo() {
  if (state.insertUndoOpen) return;
  pushUndo();
  state.insertUndoOpen = true;
}

function ensureReplaceUndo() {
  if (state.replaceUndoOpen) return;
  pushUndo();
  state.replaceUndoOpen = true;
}
```

Within `handleInsert`, replace each mutation-time `pushUndo()` with `ensureInsertUndo()`. Within `handleReplace`, use `ensureReplaceUndo()`. Direct `i`, `I`, `a`, and `A` start with `insertUndoOpen = false`. Direct `R` starts with `replaceUndoOpen = false`. Commands such as `o`, `O`, change operators, and Visual block insertion already mutate and snapshot before Insert mode, so they enter with `insertUndoOpen = true`. Escape closes the matching undo session. Document switches and resets clear both flags.

- [x] **Step 5: Honor and consume Normal undo counts**

Replace the single Normal undo call with:

```js
if (e.key === 'u') {
  var undoCount = getCount();
  for (var undoI = 0; undoI < undoCount; undoI++) undo();
  return;
}
```

Update `:help u` to show `[count]u` and state that one Insert session is one change.

- [x] **Step 6: Run the same journey and observe GREEN through undo**

Expected: both `cc` changes preserve `tail`, `2u` restores `alpha` and `beta`, and the following `j` moves one line.

- [x] **Step 7: Commit the correctness slice**

```powershell
git add tests/p0-teacher.spec.js js/vim.js js/vim-help.js
git diff --cached --check
git commit -m "fix(vim): restore line change undo blocks"
```

---

### Task 3: Inspect Named Evidence with `:registers`

**Files:**
- Modify: `tests/p0-teacher.spec.js`
- Modify: `js/vim.js:500-610, 3770-3820, 5960-5995`
- Modify: `js/vim-help.js:35-50, 205-230`

**Interfaces:**
- Consumes: `state.registers`, `getRegister(name)`, `nextOutputId(kind)`, `switchDocument(...)`, and `pushUndo(false)`.
- Produces: `registerDisplayLines(filter)`, `:registers [names]`, and `:display [names]`.

- [x] **Step 1: Add the failing mission 2 display assertion**

After yanking `evt_014203` into `a` and `desk_lamp` into `b`, run `:registers a b`. Assert `[Registers]` contains:

```text
"a  char  evt_014203
"b  char  desk_lamp
```

Press `u` and assert the active file returns to `events.csv`.

- [x] **Step 2: Run the journey and observe RED**

Expected RED: `E492: Not an editor command: registers a b`.

- [x] **Step 3: Implement the bounded display command**

Add:

```js
function registerDisplayText(value) {
  return value.text.replace(/\t/g, '^I').replace(/\n/g, '^J');
}

function registerDisplayLines(filter) {
  var names = filter ? filter.replace(/\s/g, '').split('') : Object.keys(state.registers).sort();
  var lines = ['register  kind  value', '--------  ----  -----'];
  for (var i = 0; i < names.length; i++) {
    var name = names[i].toLowerCase();
    var value = state.registers[name];
    if (!value || (!value.text && !value.tokens)) continue;
    lines.push('"' + name + '  ' + value.kind + '  ' + registerDisplayText(value));
  }
  if (lines.length === 2) lines.push('(no registers)');
  lines.push('', 'Press u to return to your buffer.');
  return lines;
}
```

Parse `/^(?:registers|display)(?:\s+(.*))?$/`, switch to `[Registers]` through the existing output-buffer pattern, and add both commands to `cmdCompletions`.

- [x] **Step 4: Update help and run GREEN**

Document `:registers`, its optional names, `:display`, kinds, escaped tabs/newlines, and `u` return behavior. Run the sole journey and assert exact visible output.

- [x] **Step 5: Commit the inspection slice**

```powershell
git add tests/p0-teacher.spec.js js/vim.js js/vim-help.js
git diff --cached --check
git commit -m "feat(vim): display typed registers"
```

---

### Task 4: Flight Log and Post-Success Golf

**Files:**
- Modify: `tests/p0-teacher.spec.js`
- Modify: `js/vim.js:250-280, 3590-3770, 5960-5995, 6410-6430`
- Modify: `js/vim-teacher.js:40-160`
- Modify: `js/vim-help.js:205-230`

**Interfaces:**
- Consumes: `normalizeKeyToken(e)`, `state.replayContext`, `teacherCheckMission()`, mission data, and guide return from Task 1.
- Produces: `state.teacherStats`, `teacherStartMissionStats()`, `teacherRecordInput(e)`, `teacherObservedSkills(tokens)`, `teacherFinishMissionStats()`, `teacherScoreLines()`, `teacherGolfLines()`, `:teacher score`, and `:teacher golf`.

- [x] **Step 1: Add failing score and golf assertions**

Before mission 1 passes, run `:teacher golf` and assert the status says `Finish the visible result`. After mission 1 passes, run it again and assert the guide contains `Gcil` and its use case. Return with `Ctrl-O`.

At completion, assert the guide contains:

```text
MOTH FLIGHT RECORDER
Evidence: 8/8 missions
First-pass checks: 7/8
Lanterns used: 1
Course corrections: 1
```

Assert `Command strokes:` is a positive integer, `Skills observed:` contains the command families exercised by the journey, and transition measurements remain at or below 100 ms.

- [x] **Step 2: Run the sole journey and observe RED**

Expected first RED: `teacher golf` shows the usage error because the command does not exist.

- [x] **Step 3: Add bounded session state and input recording**

Initialize this state on `teacherStart()`:

```js
state.teacherStats = {
  startedAt: performance.now(),
  missionStartedAt: 0,
  missionResults: [],
  currentHints: 0,
  currentFailedChecks: 0,
  currentValidated: false,
  currentCommandStrokes: 0,
  currentTokens: []
};
```

`teacherRecordInput(e)` runs before `beginRepeatCapture(e)`. It returns unless the active document is the current teacher work document and `state.replayContext` is empty. It counts Normal and Visual keys except `:`, plus Insert or Replace control commands. It excludes printable inserted text, search text, command text, and modifier-only keys. It stores at most 600 `{ mode, token }` records.

Use this bounded token shape and filter:

```js
function teacherMetricToken(e) {
  return e.ctrlKey ? '<C-' + e.key.toLowerCase() + '>' : e.key;
}

function teacherRecordInput(e) {
  var stats = state.teacherStats;
  var teacher = teacherPackage();
  var mission = teacher && state.teacherMission >= 0 &&
    state.teacherMission < teacher.missions.length
    ? teacher.missions[state.teacherMission] : null;
  if (!stats || !mission || state.replayContext ||
      state.documentId !== teacherDocumentId(mission.file)) return;
  if (e.key === 'Shift' || e.key === 'Control' ||
      e.key === 'Alt' || e.key === 'Meta') return;
  var mode = state.mode;
  var countable = (mode === 'normal' || mode === 'visual')
    ? e.key !== ':'
    : ((mode === 'insert' || mode === 'replace') &&
      (e.key === 'Escape' || !!e.ctrlKey));
  if (!countable) return;
  stats.currentCommandStrokes++;
  if (stats.currentTokens.length < 600) {
    stats.currentTokens.push({ mode: mode, token: teacherMetricToken(e) });
  }
}
```

- [x] **Step 4: Recognize only the approved skill patterns**

`teacherObservedSkills(tokens)` returns a de-duplicated list from these exact patterns:

```text
jump history, named registers, changelist, dot-repeat, macros,
buffer completion, line text objects, line change, character normalization
```

Detect the patterns from normalized physical tokens. Do not inspect editor internals such as current register contents to claim a skill.

Use contiguous token matching in a fixed display order:

```js
function teacherHasSequence(tokens, keys) {
  for (var i = 0; i <= tokens.length - keys.length; i++) {
    var found = true;
    for (var j = 0; j < keys.length; j++) {
      if (tokens[i + j].token !== keys[j]) { found = false; break; }
    }
    if (found) return true;
  }
  return false;
}
```

Match `<C-o>` or `<C-i>` for jump history, `"` plus a lowercase letter for named registers, `g;` or `g,` for changelist, `.`, `q{register}` or `@{register}` for macros, Insert `<C-n>` or `<C-p>`, `cil` or `yal`, `cc`, and `f_r-`.

- [x] **Step 5: Track validation, hints, time, and completion**

Only explicit `teacher check` and `teacher next` calls update validation metrics. The first validation sets `currentValidated`. A first success increments first-pass evidence. Each failure increments `currentFailedChecks`. When the mission later passes, those failures become course corrections.

`teacher hint` increments `currentHints` once per request. `teacherFinishMissionStats()` stores elapsed milliseconds, hints, failures, command strokes, and observed skills, then discards raw tokens. `teacherStartMissionStats()` resets the current counters when a new mission brief opens.

- [x] **Step 6: Add score and golf guide views**

Add one `golf` object to every mission:

```js
golf: {
  route: 'Gcil',
  why: 'Use this after the timeline is understood to change the final note directly.'
}
```

`:teacher golf` uses the pure mission check without changing validation metrics. It refuses before success. After success it opens a read-only guide through the Task 1 return path.

`:teacher score` opens `teacherScoreLines()`. The completion guide appends the same score and `The moon was not rebooted.`

Add both commands to completion, help, and the teacher usage string.

- [x] **Step 7: Run the same journey and observe GREEN**

Assert the exact deterministic metrics above. Assert elapsed time and command strokes by label and range, not a machine-specific exact duration.

- [x] **Step 8: Commit the learning-feedback slice**

```powershell
git add tests/p0-teacher.spec.js js/vim.js js/vim-teacher.js js/vim-help.js
git diff --cached --check
git commit -m "feat(vim): add teacher flight log"
```

---

### Task 5: Make the Capstone Use the New Vim Routes

**Files:**
- Modify: `tests/p0-teacher.spec.js`
- Modify: `js/vim-teacher.js`
- Modify: `js/vim-help.js`

**Interfaces:**
- Consumes: all behavior from Tasks 1 through 4.
- Produces: the final eight-mission route, updated teaching copy, and the exact final postmortem.

- [x] **Step 1: Change mission 6 to use corrected `cc`**

Replace each whole runbook line with `cc`, not `cil`. The visible result must preserve the heading and all four replacement lines.

- [x] **Step 2: Change mission 7 to normalize pasted evidence**

Paste register `b` so the root-cause line first contains `desk_lamp`. Use `/desk_lamp<Enter>f_r-` to produce `desk-lamp`. Update the work request and hint to explain why the CSV and configuration use different separators.

- [x] **Step 3: Make mission 8 prove the safe return path**

Open its brief, return once with `Ctrl-O`, inspect `:jumps`, return with `u`, traverse work-file jump and change history, and finish `Verified sources` without reopening `[Teacher]`.

Update `:help :teacher` to state that generated briefs are read-only, `Ctrl-O` returns to prepared work, and briefs do not enter forward jump history.

- [x] **Step 4: Add one deliberate course correction**

During mission 6, call `:teacher check` after three of four lines are correct. Assert the first missing fourth line. Repair it, check again, and preserve the final metric totals `7/8` first-pass and `1` course correction.

- [x] **Step 5: Complete the exact final artifact**

After `:teacher next` completes mission 8, assert `PROJECT COMPLETE`, the flight log, and `The moon was not rebooted.` Press `Ctrl-O` and assert the exact ten rendered `postmortem.md` lines already owned by the capstone.

- [x] **Step 6: Run the focused journey GREEN**

Use one Chromium worker. Record activation, mission transition, score transition, golf transition, total elapsed test time, and the final visible artifact.

- [x] **Step 7: Commit the capstone route**

```powershell
git add tests/p0-teacher.spec.js js/vim-teacher.js js/vim-help.js
git diff --cached --check
git commit -m "test(vim): finish teacher golf journey"
```

---

### Task 6: Documentation, Size Gate, Manual Browser Receipt, and Handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-08-14-phalene-vim-feature-teaching-matrix.md`
- Modify: `docs/superpowers/plans/2026-08-14-vim-teacher-flight-log.md`

**Interfaces:**
- Consumes: final production behavior and browser output.
- Produces: the release record, feature-to-mission map, verification receipt, clean process state, and local handoff.

- [ ] **Step 1: Update the feature-to-teaching matrix**

Add or update rows for `cc`, Insert-session undo, counted undo, guide return, guide protection, register inspection, flight log, golf reveal, and identifier normalization. Every row names implementation owner, help topic, mission, and the single capstone journey.

- [ ] **Step 2: Run serial syntax and hygiene checks**

Run `node --check` separately for each changed JavaScript file and the Playwright test. Run `git diff --check`. Scan ignored documentation and new files for trailing whitespace and em dashes.

- [ ] **Step 3: Measure gzip against `1c3a375`**

Use Node `zlib.gzipSync()` on the four production assets at `1c3a375` and in the worktree. Record each asset and total. Fail if total growth exceeds 4,096 bytes.

- [ ] **Step 4: Run the one final automated capstone**

Confirm zero repository verifiers and zero listeners on the selected port. Run:

```powershell
npx playwright test tests/p0-teacher.spec.js --browser=chromium --workers=1 --reporter=line
```

Do not run any other test suite.

- [ ] **Step 5: Complete one manual in-app browser receipt**

Start one hidden static server on the selected free port. In the in-app browser, run the real teacher journey through all eight missions. Inspect mission briefs, the protected-guide error, one golf view, one score view, mission 6 `cc`, mission 7 `f_` and `r-`, the completion flight log, and the exact final postmortem. Keep one final handoff tab only while the server remains useful.

- [ ] **Step 6: Clean process state**

Stop only the verified Phalene server. Confirm zero repository verifier processes and zero listeners on the selected port.

- [ ] **Step 7: Commit the release record**

Force-add ignored documentation as needed:

```powershell
git add -f docs/superpowers/specs/2026-08-14-phalene-vim-feature-teaching-matrix.md docs/superpowers/plans/2026-08-14-vim-teacher-flight-log.md
git diff --cached --check
git commit -m "docs(vim): record teacher flight metrics"
```

- [ ] **Step 8: Audit completion and report integration options**

Confirm every approved design requirement has direct source, test, browser, size, or process evidence. Confirm a clean worktree. Report the local commit hashes and exact user playtest commands. Do not push or merge.
