# Phalene-Vim High-Leverage Vision Design

**Status:** Approved direction. Detailed specification awaiting final review.

**Baseline commit:** `f08ad77`

## Goal

Turn the browser Vim at `/vim/` into a small, dependable editor that teaches the commands people use to do real work. The finished product must let a Vim user move through files and edits, preserve and reuse text, automate repeated changes, complete words from the current buffer, make precise text-object edits, and learn those workflows inside one funny investigation.

The final inspectable outcome is a user opening `:teacher`, investigating a broken Phalene Analytics launch across six files, correcting the data story and software runbook, repairing the launch copy, and producing a coherent postmortem without leaving the browser editor.

This is not a goal to reproduce all of Vim or Neovim. Each wave ships one high-value workflow through the current static editor. Features that require a parser, language server, plugin host, persistent process, or large rendering rewrite remain out unless a measured user journey requires them.

## Delivered Baseline

Three independently preserved local waves already exist:

| Wave | Commit | User outcome |
|---|---|---|
| Navigation history | `36629eb` | `[count] Ctrl-O`, `Ctrl-I`, and Normal/Visual `Tab` retrace meaningful jumps across browser documents. `:jumps` exposes the trail. Ordinary `h`, `j`, `k`, `l`, `w`, and `b` motions stay out of it. |
| Command and search recall | `6254a43` | Up and Down restore previous Ex commands and `/` or `?` searches without retyping. |
| Changelist and automatic marks | `f08ad77` | `g;` and `g,` revisit edit sites. Automatic change, insert, operator, and Visual marks remain attached to their document and follow line-count edits. |

At the Wave 3 baseline, `js/vim.js` is 52,623 bytes gzip. Wave 3's final focused Chromium journey passed with one worker in 4.0 seconds. Syntax, whitespace, and gzip checks passed serially.

## Product Principles

1. **One useful journey per wave.** A command is not complete until a person can use it to finish a realistic editing action.
2. **Vim semantics where they protect muscle memory.** Counts, register selection, register kinds, history direction, and operator composition must not teach a habit that fails in Vim.
3. **Browser-native boundaries.** Keep `Cmd+V` for clipboard reads and the current best-effort clipboard write path. Do not add permission prompts or asynchronous command states without a proven need.
4. **Static deployment.** Add no runtime dependency, bundler, worker, server API, parser, language server, or plugin host.
5. **Bounded work.** Lists, scans, replay, and completion candidates have explicit caps. A wave stops when its outcome passes its focused journey and size gate.
6. **Serial verification.** Run one verification process at a time, one Playwright worker, and no browser matrix unless explicitly requested.
7. **Teaching through work.** `:teacher` gives the user a role, evidence, files, and a deliverable. It does not become a command trivia quiz.

## Scope and Wave Outcomes

### Wave 4: Typed registers

#### User unlock

The user can preserve a yank while deleting other text, recover older deletions, keep named evidence, append related evidence, discard text without polluting paste history, and paste rectangular data as a rectangle.

Supported register surface:

- `"` unnamed register.
- `0` latest yank.
- `1` through `9` rotating linewise or multiline deletes and changes.
- `-` latest small delete or change contained within one line.
- `a` through `z` named registers.
- `A` through `Z` append to the corresponding lowercase register.
- `_` black-hole register.
- `"{register}` selects a register for the next operator, Visual operation, or paste.
- Characterwise, linewise, and blockwise register kinds.

The current automatic write to the system clipboard remains. Browser `Cmd+V` remains the clipboard-read path. Explicit `+` register reads are deferred because the browser clipboard API is asynchronous and permission-sensitive.

#### Architecture

Replace `state.register` and `state.registerLinewise` with one register map whose values have this shape:

```js
{
  text: 'copied text',
  kind: 'char' // 'char', 'line', or 'block'
}
```

Add one pending selected-register field. Selection is consumed after the next register-reading or register-writing command, including an error, so it cannot leak into a later operation.

One write helper owns all rotation and clipboard rules:

- Yank writes the unnamed register and `0`.
- Linewise or multiline delete/change rotates `1` through `9`, then writes `1` and unnamed.
- A same-line delete/change writes `-` and unnamed.
- An explicit named register also receives the operation.
- Uppercase names append to lowercase. The helper preserves the existing kind when possible and promotes mixed line content to linewise.
- `_` performs the edit but updates no register and does not write the system clipboard.
- Block Visual yank/delete stores newline-separated rows with kind `block`.

Paste reads one typed value. Characterwise paste uses the existing inline path. Linewise paste uses the existing line insertion path. Blockwise paste inserts each stored row at the target display column, padding short destination lines with spaces.

Macro registers remain on their current bounded key-recording path during Wave 4. Wave 5 moves macro recording and playback onto the shared normalized register representation. This prevents Wave 4 from designing the command recorder prematurely.

#### Inspectable journey

The focused browser journey opens a short incident summary and performs one evidence-assembly workflow:

1. Yank an incident ID, then delete another word.
2. Paste register `0` and show that the yank survived the delete.
3. Paste register `-` and show that the small deletion remains recoverable.
4. Store evidence in register `a`, append a second fragment with `A`, and paste the combined evidence.
5. Delete noise through `_`, then paste unnamed and show that the discarded noise never replaced it.
6. Yank a two-column Visual block and paste it beside two destination rows.

The final buffer contents are the assertion. No test-only state hook is added.

#### KPI and stop condition

- One Chromium journey passes with `--workers=1`.
- Register selection, writes, rotation, and reads route through shared helpers rather than call-site-specific rules.
- No runtime dependency or new browser permission.
- Added `js/vim.js` runtime is at most 3,072 bytes gzip over `f08ad77`.
- Normal motion and insert paths receive no register allocation.
- Stop after the focused journey, syntax checks, `git diff --check`, gzip measurement, help update, and a clean local commit.

### Wave 5: Dot-repeat and macro reuse

#### User unlock

The user can make one complete change and repeat it with `.`, record a stable sequence with `q{register}`, replay it with `@{register}` or `@@`, apply a count, and use Neovim-style `Q` to replay the last recorded macro.

#### Architecture

Normalize editor input into the smallest existing key-token shape already used by macro capture. Define one command transaction boundary around a complete change. A recorded change stores normalized tokens, not document snapshots. Dot-repeat replays the last completed change through the central dispatcher. A supplied dot count replaces the original command count.

Macro playback and dot-repeat share the existing safety limits:

- Maximum recursion depth: 10.
- Maximum replayed keys per invocation: 1,000.
- Escape cancels pending operator and register state.
- Failed or incomplete commands do not replace the last repeatable change.

This wave removes the existing partial `lastChange` switch only after the normalized recorder covers its proven behavior.

#### Inspectable journey

Normalize three malformed incident-log lines. Repair the first record manually, use `.` on the second, record the multi-command repair for the third, then replay it with `@@`. The final log lines must match one canonical shape.

#### KPI and stop condition

- One Chromium journey proves insert text, an operator change, explicit counts, `.`, `@a`, `@@`, and `Q` through visible buffer output.
- Replay stops cleanly at 1,000 keys or recursion depth 10.
- Added runtime is at most 2,560 bytes gzip over Wave 4.
- The central dispatcher remains the only execution path for hardware, mobile synthesis, dot-repeat, and macros.

### Wave 6: Capped current-buffer completion

#### User unlock

In Insert mode, `Ctrl-N` and `Ctrl-P` complete words already present in the current document. A writer can reuse exact incident IDs, product names, variables, and metrics without a language server.

#### Architecture

On the first completion key, extract the word prefix before the cursor and scan the current buffer for distinct matching words. Preserve document order, rotate forward or backward, and replace only the active prefix or prior candidate.

Hard caps:

- At most 200 distinct candidates.
- At most 10,000 lines scanned.
- Stop synchronous scanning after an 8 ms `performance.now()` budget.
- Reuse the candidate list while the completion session remains active.
- Clear the session after ordinary insertion, movement, mode change, undo, document switch, or Escape.

No fuzzy ranking, dictionary, language server, worker, cache across documents, or network request belongs in this wave.

#### Inspectable journey

Write a postmortem sentence containing `ULTRA_VIOLET_BEACON`, type `ULTRA_`, cycle forward and backward through two in-buffer candidates, accept the desired identifier, and continue typing.

#### KPI and stop condition

- One Chromium journey proves forward cycling, backward cycling, wraparound, and cancellation through visible text.
- Candidate count never exceeds 200.
- A 10,000-line completion attempt produces visible input within 100 ms on the existing Chromium environment. This stays close to the existing 80.4 ms full-render baseline instead of setting a target the current renderer cannot reach.
- Added runtime is at most 1,536 bytes gzip over Wave 5.

### Wave 7: Compact text-object fidelity

#### User unlock

Operators can target the smallest remaining high-value units without manual Visual selection. Start with Neovim's `il` for the trimmed current line and `al` for the current line including its surrounding line boundary. Add another object only when a concrete capstone edit cannot be expressed clearly with the objects already implemented.

#### Inspectable journey

Use `cil` to replace a padded launch-copy line, then use `yal` to capture one completed report line for reuse in the final output buffer.

#### KPI and stop condition

- One Chromium journey proves the selected objects after both operators and Visual mode.
- Added runtime is at most 1,024 bytes gzip over Wave 6.
- No Tree-sitter, syntax tree, HTML tag parser, sentence parser, or plugin emulation.

### Wave 8: Rendering only if measured

#### Decision gate

This wave starts only if the real `:teacher` incident log or the 10,000-line buffer journey misses its latency target twice in serial measurements.

Required measurement before implementation:

- Exact file and line count.
- Exact input sequence.
- Median and p95 input-to-render time after warm-up.
- A profile showing rendering, search highlighting, or another identified path owns the cost.

If the gate opens, first limit rendering to the visible line window plus overscan while keeping cursor, gutter, search highlights, and scroll position correct. Do not add a virtual-DOM library, canvas editor, worker, or editor-engine rewrite.

#### KPI and stop condition

- Target 1,000-line ordinary key median at or below 5.5 ms.
- Target 10,000-line ordinary key median at or below 88.44 ms.
- Target p95 no more than twice the corresponding median limit.
- If current behavior already meets the target, record the evidence and mark this wave unnecessary with no production change.

### Wave 9: `:teacher` real-work capstone

#### User outcome

The user finishes a short investigation rather than completing isolated command drills. The story is funny, but every task resembles real editing work.

The role: on-call analyst and reluctant launch-copy editor for Phalene Analytics. The company claims its dashboard measures moonlight-driven moth activity. A production alert suggests the dashboard counted 14,203 moth landings on a desk lamp before the sensor was deployed.

The project contains six browser documents:

| File | Work domain | Editing purpose |
|---|---|---|
| `incident.log` | Software incident response | Search errors, follow identifiers, normalize repeated records, and retrace meaningful jumps. |
| `events.csv` | Data analysis | Find impossible observations, compare repeated values, and preserve evidence in registers. |
| `config.js` | Software maintenance | Correct the sensor source and use precise text objects. |
| `launch-copy.md` | Copywriting | Remove unsupported claims, preserve qualifications, and reuse accurate terminology. |
| `runbook.md` | Operations | Replace instructions such as “reboot the moon” with actions an operator can perform. |
| `postmortem.md` | Synthesis | Assemble findings, impact, cause, repair, and follow-up work from the other files. |

Research and fact-checking are the connective practice across all three domains. They do not require a fourth track.

#### Teaching loop

The teaching surface remains a small extension of the existing tutor and document registry:

- `:teacher` opens the assignment and loads the six documents into the current session.
- `:teacher next` moves to the next mission after the current visible artifact satisfies its check.
- `:teacher hint` gives one command-level hint without performing the edit.
- `:teacher check` explains the first unmet visible condition in plain language.
- `:teacher reset` restores only the bundled teaching documents after confirmation.

Each mission contains four things: a work request, the file to inspect, an observable result, and one optional hint. The system checks buffer contents and cursor-visible editor state. It does not maintain a score, streak, badge economy, account, telemetry service, or hidden simulated progress.

#### Mission sequence

1. **Establish the timeline.** Search the log, use jump history, and identify the first impossible event.
2. **Compare the data.** Reuse search history, inspect the CSV, and store two evidence fragments in named registers.
3. **Repair the source.** Correct `config.js`, move away, then use changelist and automatic marks to return to the edits.
4. **Normalize the records.** Use dot-repeat and a macro on repeated malformed log entries.
5. **Correct the launch story.** Use text objects, completion, and registers to replace unsupported copy with evidence-backed wording.
6. **Fix operations.** Rewrite the runbook so another person can respond without guessing.
7. **Write the postmortem.** Assemble evidence from registers and finish a concise report.
8. **Retrace the work.** Use jump and change history to revisit the source of each final claim.

#### Capstone acceptance

The final `postmortem.md` must visibly contain:

- Incident impact.
- The impossible pre-deployment count.
- The desk-lamp configuration as root cause.
- The corrected sensor source.
- A truthful replacement for the launch claim.
- A practical runbook action.
- One follow-up prevention step.

The learner must reach that artifact using the real editor commands. The browser journey does not call internal state mutation helpers to manufacture progress.

#### KPI and stop condition

- A first-time Vim user can finish the accelerated path in 20 to 30 minutes.
- An experienced Vim user can finish it in under 10 minutes.
- `:teacher` becomes visibly usable within 100 ms after the command on the current local environment.
- Every implemented wave appears in at least one mission, help topic, and visible acceptance condition.
- Teacher runtime and bundled content add at most 16,384 bytes gzip outside `js/vim.js`.
- No network access, account, analytics, AI call, runtime database, or new dependency.

## Cross-Wave KPI Dashboard

| Gate | Expectation | Failure action |
|---|---|---|
| Visible outcome | One real editing journey ends in exact visible buffer content. | Stop. Fix the product journey before adding more cases. |
| Browser proof | One focused Chromium invocation with one worker. | Reproduce and fix. Do not start another runner concurrently. |
| Syntax | `node --check` passes for changed JavaScript. | Fix before commit. |
| Diff hygiene | `git diff --check` returns success with inspected output. | Fix whitespace or conflict markers. |
| Runtime size | Each wave stays under its stated gzip growth cap. Waves 4 through 8 together stay within 8,192 bytes gzip over `f08ad77`. | Remove duplication or reduce scope. Do not add a build step. |
| Teaching size | Teacher code and data stay within 16,384 bytes gzip. | Shorten content or reuse existing tutor/document machinery. |
| Core responsiveness | No ordinary motion path gains scanning, register rotation, or history copying. | Move work to command entry or measured bounded helpers. |
| Completion responsiveness | Visible result within 100 ms at 10,000 lines in the focused environment. | Tighten scan and candidate caps. |
| Static operation | Site works from the existing static server with no production dependency. | Reject the added infrastructure. |
| Mobile input | New key grammar continues through the existing central dispatcher. | Fix the shared input seam instead of adding a mobile-only implementation. |
| Source control | One local `codex/*` commit per completed wave. | Do not merge partial behavior. |

## Verification Contract

Only one test or verification process may run at a time. Before Playwright, confirm that no `node.exe` command line matches `@playwright\\test\\cli.js` and that port 8767 has no listener. If another project is testing, wait without killing its process.

For each wave:

1. Write one focused end-to-end journey before production code.
2. Run only that journey in Chromium with `--workers=1` and observe the expected failure.
3. Implement the smallest shared behavior that makes the journey pass.
4. Run the same journey again and observe the visible expected output.
5. Run changed-file syntax checks serially.
6. Run `git diff --check`.
7. Measure gzip against the prior wave commit.
8. Inspect the exact diff and working-tree status.
9. Commit locally. Do not push or merge without explicit authorization.

The release note for each wave records:

- Exact input journey.
- Exact visible final buffer or status output.
- Chromium elapsed time.
- Gzip before, after, and delta.
- Changed files.
- User decision changed by evidence, if any.
- Largest remaining product gap.

## Feature-to-Teaching Matrix

The final release gate maintains one row per feature:

```text
feature | implementation owner | :help topic | :teacher mission | browser journey
```

A feature is not complete if any cell is empty. The matrix prevents commands from existing without help, lessons from describing unsupported behavior, or browser checks from proving invisible implementation details.

## Explicit Non-Goals

- Full Vim regex compatibility.
- Undo tree or persistent ShaDa/viminfo.
- Tree-sitter, LSP, syntax server, or plugin execution.
- Extmarks or a general edit-anchor framework beyond the positions required by shipped commands.
- Windows, tabs, split panes, jobs, terminal emulation, remote file systems, or sessions.
- Fuzzy completion, dictionary completion, snippets, or AI completion.
- Full clipboard-register parity where browser permission and asynchronous reads would alter command semantics.
- A generalized course platform, scoring system, telemetry pipeline, or account system.
- Rendering work without two failed serial measurements from a required journey.

## Ordered Delivery

1. Preserve the approved vision and Wave 4 design in source control.
2. Write the Wave 4 implementation plan after specification review.
3. Complete typed registers and preserve them on a local branch.
4. Repeat the design, plan, one-journey implementation, and local commit cycle for Waves 5 through 7.
5. Measure the capstone-sized buffers and either skip or execute Wave 8.
6. Design the exact teacher copy and checks against the completed command surface.
7. Build the six-file Phalene Analytics capstone.
8. Complete the feature-to-teaching matrix and one full capstone journey.
9. Report local integration options. Push or merge only after explicit authorization.

## Upstream References

The behavior targets Vim `v9.2.0957`, Neovim `v0.12.4`, and the sampled Neovim development additions used in the completed research.

- Vim registers: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/runtime/doc/change.txt#L1262-L1407>
- Vim repeat and macros: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/runtime/doc/repeat.txt#L21-L158>
- Vim text objects: <https://github.com/vim/vim/blob/7807dd22793da0e826618c0ca9c6210bbc1ea3f5/runtime/doc/motion.txt#L541-L760>
- Neovim `il` and `al`: <https://github.com/neovim/neovim/blob/faf8345eef8c9a59f254d3e4bafab1a9c125ee21/runtime/doc/motion.txt#L595-L604>
- DadbodGrip Softrear investigation model: <https://github.com/joryeugene/dadbod-grip.nvim/blob/main/demo/softrear-internal.md>
