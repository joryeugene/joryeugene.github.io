# Phalene-Vim Real-Work Teacher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Do not delegate or run verification in parallel on this machine.

**Goal:** Ship a funny, fast, real-work `:teacher` project in which a learner investigates a corrupt Phalene Analytics launch across six files, repairs the evidence, software configuration, copy, and operations guidance, and finishes a correct postmortem using the commands implemented in Waves 1 through 7.

**Architecture:** Add one static `js/vim-teacher.js` package containing six document arrays, eight mission records, intro copy, and completion copy. Add a small controller inside the existing `vim.js` IIFE because document state and command execution are private there. Teacher documents live only in `state.documents` under `teacher:` IDs. They never overwrite `localStorage` browser files. The current dispatcher, document switcher, jump history, operators, registers, macros, and completion paths remain the execution surface.

**Design authority:** The DadbodGrip Softrear notebook succeeds because it gives the learner a professional role, starts with three answerable questions, follows evidence across domains, keeps one running joke attached to real data, and ends with an explicit finding. Phalene Analytics uses the same structure for editing work instead of SQL work. Source: <https://github.com/joryeugene/dadbod-grip.nvim/blob/main/demo/softrear-internal.md>.

## Inspectable end-to-end outcome

After eight missions, `postmortem.md` visibly contains:

```text
# Phalene Analytics Incident Postmortem

Impact: Dashboard displayed 14,203 impossible pre-deployment landings.
Evidence: evt_014203 occurred before the roof-array was online.
Root cause: The active source was desk-lamp instead of roof-array.
Repair: Config now uses roof-array and excludes pre-deployment events.
Launch copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.
Runbook: Verify sensor source, deployment time, and event timestamp before publishing counts.
Follow-up: Add a deployment-time validation gate before ingest.
Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md
```

The full browser journey reaches this result with real key events and Ex commands. It does not mutate editor state from the test.

## Global constraints

- Keep `:tutor` unchanged as the full basics course. `:teacher` is the modern applied path.
- Use exactly six work files: `incident.log`, `events.csv`, `config.js`, `launch-copy.md`, `runbook.md`, and `postmortem.md`.
- A generated `[Teacher]` brief may appear as a navigation surface but is not a seventh work file.
- Seed documents in `state.documents` only. Do not write teacher content to `localStorage`.
- `:teacher reset` must ask for browser confirmation and restore only the six bundled teacher documents.
- Mission checks inspect saved document text. They do not inspect hidden register, macro, score, account, or telemetry state.
- Each failed check reports the first exact missing or forbidden visible phrase.
- `:teacher hint` displays one command-level hint and performs no edit.
- No score, streak, badge, account, analytics, AI request, network request, database, generalized course engine, or runtime dependency.
- `:teacher` activation must render a usable brief within 100 ms in the focused Chromium environment.
- All changed production assets together must add at most 16,384 bytes gzip over commit `331c890`.
- Use one full focused Chromium journey with `--workers=1` for RED and GREEN.
- Run every test and verification command serially. Before Playwright, require zero other `@playwright\\test\\cli.js` processes and zero listeners on port 8767.
- Do not push or merge.

## File map

- Create `js/vim-teacher.js`: content package only.
- Create `tests/p0-teacher.spec.js`: one activation and full-capstone browser journey.
- Modify `js/vim.js`: one state field, teacher controller, Ex routing, command completion, and dashboard visibility.
- Modify `js/vim-help.js`: exact teacher commands and the relationship to `:tutor`.
- Modify `vim/index.html`: load `vim-teacher.js` before `vim.js`.
- Modify `docs/superpowers/plans/2026-08-14-vim-teacher.md`: keep as-built details aligned.

## Six-file content contract

### `incident.log`

- Deployment is scheduled at `02:11:04Z` and online at `02:12:00Z`.
- `evt_014203` reports `landings=14203` at `02:11:09Z`, before the roof array is online.
- Three later warnings contain the malformed suffix `status : duplicated`.
- Final editable line starts as `ANALYST_NOTE: replace me`.

Mission 1 requires:

```text
ANALYST_NOTE: evt_014203 recorded 14203 landings before roof-array was online
```

Mission 4 requires all three malformed warnings to end with `status=duplicate` and forbids `status : duplicated`.

### `events.csv`

- Realistic rows show ordinary landing counts of 12, 18, and 14 beside the impossible 14,203 row.
- A commented evidence workbench contains separate candidate and destination lines so characterwise named-register puts remain visible and composable.

Mission 2 requires these adjacent pairs:

```text
# evidence_id
evt_014203
# evidence_sensor
desk_lamp
```

### `config.js`

- Initial source is `"desk-lamp"`.
- Desired source is `"roof-array"`.
- Editable final line starts as `// CHANGE_NOTE: replace me`.

Mission 3 requires:

```text
source: "roof-array"
// CHANGE_NOTE: source corrected to roof-array
```

and forbids `source: "desk-lamp"`.

### `launch-copy.md`

Initial unsupported claims:

```text
We counted every moth in the moon before breakfast.
The dashboard recorded 14,203 verified roof-array landings during launch.
```

The file also contains `Metric key: REVIEWED_ROOF_ARRAY_EVENTS` for current-buffer completion.

Mission 5 requires:

```text
Claim review: Desk-lamp counts before deployment were excluded.
Evidence note: 14,203 was a pre-deployment desk-lamp event, not verified launch activity.
Approved copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.
```

and forbids both unsupported claims.

### `runbook.md`

Initial bad instructions tell the operator to reboot the moon, ask a moth whether the dashboard feels correct, and add adjectives to launch copy.

Mission 6 requires:

```text
1. Confirm the active sensor source in config.js.
2. Compare event time with deployedAt.
3. Quarantine pre-deployment events and notify on-call.
Operator action: Verify sensor source, deployment time, and event timestamp before publishing counts.
```

and forbids the three original instructions.

### `postmortem.md`

Starts with seven `TODO` fields plus `Verified sources: TODO`. Mission 7 requires the first seven final lines from the inspectable outcome. Mission 8 requires the exact verified-sources line.

## Mission matrix

| # | File | Work domain | Visible result | Commands taught |
|---|---|---|---|---|
| 1 | `incident.log` | Incident response | Record the impossible event and timing | `/`, `n`, `Ctrl-O`, `Ctrl-I`, `cil` |
| 2 | `events.csv` | Data analysis | Preserve and paste ID and sensor evidence | search history, named registers, `diw`, `p` |
| 3 | `config.js` | Software maintenance | Correct source and change note | `ci"`, `cil`, `g;`, `g,`, automatic marks |
| 4 | `incident.log` | Log cleanup | Normalize three repeated warnings | `.`, `qa`, `@a`, `n` |
| 5 | `launch-copy.md` | Copywriting | Replace unsupported claims and approved copy | `cil`, Insert `Ctrl-N`, registers |
| 6 | `runbook.md` | Operations | Replace guesses with executable steps | search, `cil`, repeatable edits |
| 7 | `postmortem.md` | Synthesis | Assemble impact, cause, repair, copy, and follow-up | registers, `cil`, `yal`, completion |
| 8 | `postmortem.md` | Verification | Name every source after retracing work | `Ctrl-O`, `Ctrl-I`, `g;`, `g,` |

---

### Task 1: Preserve the static teacher package and controller contract

**Files:**
- Create: `js/vim-teacher.js`
- Modify: `js/vim.js`

**Package interface:**

```js
window.VIM_TEACHER = {
  intro: string[],
  done: string[],
  files: { [filename: string]: string[] },
  missions: Array<{
    title: string,
    file: string,
    request: string[],
    outcome: string[],
    hint: string,
    expect: string[],
    reject: string[]
  }>
};
```

**Controller state:**

```js
teacherMission: null
```

- `null`: teacher inactive.
- `-1`: orientation brief.
- `0` through `7`: active mission.
- `8`: project complete.

**Controller functions:**

- `teacherPackage()`: returns `window.VIM_TEACHER` or reports unavailable content.
- `teacherDocumentId(name)`: returns `teacher:` plus the filename.
- `teacherGuideLines(showHint)`: returns intro, current mission card, or completion copy.
- `teacherOpen(name)`: switches to an already seeded teacher document through `pushJump()` and `switchDocument()`.
- `teacherShowGuide(showHint)`: switches to a regenerated `[Teacher]` buffer.
- `teacherStart()`: switches away from the current file, then seeds all six work files and shows orientation. This order prevents `switchDocument()` from saving a stale teacher file over a freshly reset one.
- `teacherCheckMission()`: saves the current document, checks `reject` first and `expect` second, and returns the first plain failure string or `null`.
- `teacherCommand(arg)`: owns start, brief, `next`, `check`, `hint`, and confirmed `reset` behavior.

Stop condition: no generic lesson engine or storage layer appears.

### Task 2: Write the one full failing browser journey

**File:**
- Create `tests/p0-teacher.spec.js`

The test must:

1. Open `/vim/`.
2. Type `:teacher` through the real command line, measure only the final Enter dispatch, and assert the `[Teacher]` brief appears within 100 ms.
3. Use `:teacher next` to open `incident.log`.
4. Complete all eight missions with keyboard and Ex commands only.
5. Use at least one real command from each completed feature wave.
6. Complete the project, return from the completion guide with `Ctrl-O`, and assert the exact final `postmortem.md` lines.

Add small test helpers only for repeated key sequences and replacing the trimmed current line. Do not expose editor state beyond the existing DOM helpers.

Run the global serial guard, then:

```powershell
npx playwright test tests/p0-teacher.spec.js --browser=chromium --workers=1 --reporter=line
```

Expected RED: the command line reports `E492: Not an editor command: teacher` because no route exists.

### Task 3: Build the six documents and eight mission records

**File:**
- Create `js/vim-teacher.js`

Write the exact content contract above. The intro must state:

- Role: on-call analyst and reluctant launch-copy editor.
- Alert: 14,203 landings appeared before deployment.
- Questions: what happened, why the dashboard believed it, and what must change before publication.
- Files and their work domains.
- `:teacher next`, `:teacher check`, `:teacher hint`, `:teacher reset`, and `Ctrl-O` usage.
- Expected time: 20 to 30 minutes for a first applied pass, under 10 minutes with Vim muscle memory.
- The six work files exist only in this browser session unless the learner explicitly writes a copy.

The humor stays attached to evidence. One moon reboot and one moth interview are enough. Do not add a second metaphor family or turn every line into a joke.

### Task 4: Implement controller and Ex command behavior

**File:**
- Modify `js/vim.js`

Route these commands:

```text
:teacher
:teacher next
:teacher check
:teacher hint
:teacher reset
```

Behavior:

- First `:teacher` starts a fresh session and shows orientation.
- Later `:teacher` shows the current mission brief without resetting files.
- From orientation, `:teacher next` opens mission 1 without a check.
- On missions 1 through 8, `next` refuses to advance until the visible file check passes.
- Passing mission 8 sets the completed state and opens the completion guide.
- `check` reports the first unmet phrase or states that the mission is ready.
- `hint` opens the mission card with exactly one command-level hint.
- `reset` calls `window.confirm()` and restores only the six teacher documents after approval.

Add command-line completions for `teacher`, `teacher next`, `teacher check`, `teacher hint`, and `teacher reset`.

### Task 5: Load and expose the feature

**Files:**
- Modify `vim/index.html`
- Modify `js/vim.js`
- Modify `js/vim-help.js`

Load `/js/vim-teacher.js` after `vim-tutor.js` and before `vim.js`.

Add `:teacher` to the dashboard as `real-work lab` while retaining `:tutor` as the basics course.

Add help text:

```text
:teacher         Start or recall the Phalene Analytics field lab.
:teacher next    Check the current result and open the next mission.
:teacher check   Explain the first unmet visible result.
:teacher hint    Show one command-level hint without editing.
:teacher reset   Confirm, then restore only the six teaching files.
```

State that `:tutor` teaches fundamentals in one scratch buffer while `:teacher` applies modern commands across six realistic files.

### Task 6: Run the full journey GREEN and diagnose only real failures

Run the same guarded one-worker Chromium command from Task 2.

Expected:

- Activation Enter dispatch is at most 100 ms.
- Every `teacher next` opens the expected filename.
- The completion guide contains `PROJECT COMPLETE`.
- `Ctrl-O` returns to `postmortem.md`.
- The exact eight-line final artifact matches the inspectable outcome.

If a mission fails, inspect its real visible file and first unmet status. Do not add test-only bypasses or weaken the file contract.

### Task 7: Run size, syntax, prose, and diff gates serially

Run one command at a time:

```powershell
node --check js/vim-teacher.js
node --check js/vim.js
node --check js/vim-help.js
node --check tests/p0-teacher.spec.js
git diff --check
```

Measure combined production growth over `331c890` for `js/vim.js`, `js/vim-help.js`, `vim/index.html`, and the new `js/vim-teacher.js`. Report each gzip size and the summed delta. Fail above 16,384 bytes.

Scan teacher and help copy for em dashes, placeholders outside the six intentional work-file TODOs, unsupported claims, and repeated filler. The generated copy must name the actor, work request, file, observable result, and command hint.

### Task 8: Review and commit only Wave 9

Inspect exact diffs and status. Commit:

```powershell
git add -f docs/superpowers/plans/2026-08-14-vim-teacher.md
git add js/vim-teacher.js js/vim.js js/vim-help.js vim/index.html tests/p0-teacher.spec.js
git commit -m "feat(vim): add real-work teacher"
```

Report activation latency, focused Chromium elapsed time, exact final postmortem, combined gzip delta, changed files, and the largest remaining gap. Do not push or merge.
