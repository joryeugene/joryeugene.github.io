# Phalene-Vim Teacher Flight Log and Golf Design

**Status:** Approved in conversation on 2026-08-14. Implementation still requires a written plan and test-first execution.

## Outcome

The applied `:teacher` project must feel like a guided investigation instead of an answer-copying script. A learner must always know the current task, return safely from instructions to work, recover from mistakes, and see what Vim skills they used.

The iteration adds a friendly session-only flight log and optional Vim-golf coaching. It also fixes the editor behavior that broke a shorter, idiomatic solution during the real browser playthrough.

The final visible outcome remains the source-backed `postmortem.md`. The new completion brief adds an honest record of the learner's route. It does not assign a grade or compare learners.

## Browser Evidence

One complete in-app browser journey finished all eight missions on 2026-08-14. The browser drove 2,511 key events, 35 Ex commands, 15 searches, 13 mission checks, and one hint. The interaction took 4 minutes 58 seconds. This time measures automated browser interaction and inspection. It is not a human completion-time claim.

The journey found these product issues:

1. `:teacher next` opened the work file but did not show the work request. Each mission required an extra `:teacher` command before work could begin.
2. Repeated `jcc` changes consumed adjacent runbook lines. Counted undo did not recover the attempted changes as complete Vim commands during that journey.
3. Register `b` preserved the evidence value `desk_lamp`, while the configuration and final report used `desk-lamp`. The mission hint did not explain the required normalization.
4. A learner could edit a generated `[Teacher]` brief. `Ctrl-O` and `Ctrl-I` could return to that edited brief during mission 8 and strand the learner away from the teacher-owned postmortem.
5. Bulk text entry through the in-app browser automation bridge submitted an empty Ex command. Individual key events worked. This is not yet a proven hardware or mobile-input defect, so this iteration does not change production input behavior for that observation.

The checker performed well. It caught the deleted runbook lines, the underscore and hyphen mismatch, and the attempt to finish mission 8 from the wrong document.

## Chosen Product Direction

Use a friendly flight log with optional golf coaching.

Do not use live competitive scoring. Answer text dominates the key count, and early optimization can distract a learner from understanding the evidence. Do not keep the metrics test-only because the learner should receive useful feedback from the session.

The product uses clear names beside the jokes:

- **Evidence:** completed missions.
- **First-pass checks:** missions that passed their first explicit `check` or `next` validation.
- **Lanterns used:** hints requested.
- **Course corrections:** failed validations that the learner later repaired.
- **Command strokes:** physical Vim command keys. Inserted answer text and `:teacher` command text do not count.
- **Skills observed:** command families present in the learner's actual key route.
- **Flight time:** elapsed mission time in the current page session.

No weighted total score exists. Correct evidence remains the hard gate.

## Mission Flow

### Start and transitions

`:teacher` opens the field-lab orientation.

`:teacher next` prepares the next work file, then shows that mission's brief. The brief names the file, work request, observable result, and return command. `Ctrl-O` returns directly to the prepared work file.

When a mission passes, the status reads:

```text
Mission 4 ready. :teacher golf shows a shorter route. :teacher next continues.
```

The learner can skip golf coaching and continue.

### Guide return path

Generated teacher guides use one explicit return anchor instead of the ordinary jumplist.

The controller stores the work document ID, filename, cursor row, and cursor column before it opens `[Teacher]`. While `[Teacher]` is active, `Ctrl-O` restores that anchor without adding `[Teacher]` to the jumplist. `Ctrl-I` cannot return to a teacher guide because the guide never becomes a jump entry.

The same path applies to orientation, mission briefs, hints, score views, golf views, and the completion brief. The completion brief returns to the final teacher-owned `postmortem.md`.

### Protected guides

`[Teacher]` is a generated, read-only document. Navigation, search, yank, help, and non-modifying Ex commands remain available. Insert, replace, delete, change, paste, case changes, joins, undo, redo, dot-repeat, macro replay, and modifying Ex commands report:

```text
E21: Cannot make changes, 'modifiable' is off
```

This protection is specific to generated teacher guides. The iteration does not add a general buffer-option system.

## Editor Correctness Repair

### `cc`

Vim linewise change deletes the selected line range, inserts one empty replacement line at the range start, enters Insert mode, and preserves the following line.

For one line:

```text
before
replace me
after
```

`jccdone<Esc>` must produce:

```text
before
done
after
```

The current linewise change path overwrites the following line after deletion. The repair must insert the replacement line instead.

### Undo boundary

Each completed Insert or Replace session is one undoable change. A change operator such as `cc` owns the snapshot that starts its Insert session. A direct Insert command takes one snapshot on its first text mutation. Later characters, backspaces, newlines, and completions in that session do not create separate undo entries.

Normal `{count}u` consumes its count and applies that many complete changes. The focused teacher journey must prove that a failed golf attempt can return to the previous complete runbook state without undoing one inserted character at a time or leaking the count into the next command.

This repair does not add an undo tree or change existing history limits.

## Flight Log

### State

The teacher controller owns one bounded session record:

```js
{
  startedAt: number,
  missionStartedAt: number,
  missionResults: Array<{
    completedMs: number,
    hints: number,
    failedChecks: number,
    commandStrokes: number,
    skills: string[]
  }>,
  currentHints: number,
  currentFailedChecks: number,
  currentCommandStrokes: number,
  currentTokens: Array<{ mode: string, token: string }>
}
```

The current token list is capped at 600 countable command inputs per mission. It excludes inserted prose and command-line or search text before storage. Mission completion reduces tokens to the named skills and totals shown above. Completed missions do not retain their raw token stream.

The state lives in memory. Reset clears it. Reloading the page clears it. No value enters `localStorage`, a URL, a request, or an external analytics service.

### Event rules

The central key dispatcher records metrics only when all conditions are true:

- A teacher mission is active.
- The active document ID starts with `teacher:` and is not `teacher:guide`.
- The event came from the player, not macro or dot replay.

Command strokes count Normal and Visual mode keys. They also count Insert-mode control commands such as `Ctrl-N`, `Ctrl-P`, and Escape. They exclude inserted printable text, search-pattern text, Ex-command text, modifier-only keys, and generated replay keys.

The controller recognizes these bounded skill patterns from normalized tokens:

- Jump history: `Ctrl-O` or `Ctrl-I`.
- Named registers: `"a` through `"z` before an operator or put.
- Changelist: `g;` or `g,`.
- Dot-repeat: `.`.
- Macro work: `q{register}`, `@{register}`, `@@`, or `Q`.
- Buffer completion: Insert `Ctrl-N` or `Ctrl-P`.
- Line text objects: `cil`, `yil`, `cal`, `yal`, or their Visual forms.
- Line change: `cc`.
- Character normalization: `f_` followed by `r-` in the same mission.

The display describes only observed patterns. It does not claim semantic mastery.

## Register Inspection

Add Vim's small `:registers` display command because mission 2 asks the learner to preserve evidence in named registers.

`:registers` shows every non-empty register. `:registers a b` limits the output to registers `a` and `b`. The generated `[Registers]` output shows the register name, kind, and escaped text. It follows the existing output-buffer and `u` return pattern used by `:jumps` and `:marks`.

`:display` is an alias for `:registers`. This iteration does not add register editing or clipboard permission behavior.

### Commands

`:teacher score` opens the current flight log. The brief shows completed missions, first-pass checks, lanterns, course corrections, command strokes, observed skills, and elapsed time.

`:teacher golf` is available only after the current mission passes. Before that point it reports:

```text
Finish the visible result before opening the golf route.
```

After a pass, it opens the mission brief with one optional shorter route and one sentence that explains when the route is useful.

Only `:teacher check` and `:teacher next` update validation metrics. The read-only preflight for `:teacher golf` does not change first-pass checks or course corrections.

The completion brief includes the final flight-log summary automatically.

## Golf and Teaching Changes

Each golf reveal appears after success. It cannot provide the answer before the learner completes the work.

| Mission | Existing practice | Post-success golf or teaching addition |
|---|---|---|
| 1 | Search, jump history, `cil` | Show `Gcil` as the direct route to the final note after the timeline is understood. |
| 2 | Search history and named registers | Add and show `:registers a b` as an evidence inspection step. Do not replace the register exercise. |
| 3 | `ci"`, `g;`, `g,`, automatic marks | Show `` `. `` as the shortest return to the latest edit. |
| 4 | Dot-repeat and a macro | Compare the practice route with `:%s/status : duplicated/status=duplicate/g` as the production bulk-edit route. |
| 5 | `cil` and Insert `Ctrl-N` | Show why completion is safer than retyping the metric key. |
| 6 | Repeated line replacement | Use corrected `cc` instead of `cil` for whole-line changes. |
| 7 | Registers, `cil`, and `yal` | Paste `desk_lamp`, then teach `f_` and `r-` to normalize the identifier deliberately. |
| 8 | Jump and change history | Use `:jumps` to inspect the route before making the final source claim. |

Mission 7's work request must distinguish the CSV value `desk_lamp` from the configuration name `desk-lamp`. Its hint must name the normalization step.

Mission 8 must state that teacher briefs do not enter jump history and that `Ctrl-O` from the brief returns to the report.

The existing moon reboot, moth interview, and final “moth declined comment” remain. The flight log adds “The moon was not rebooted.” No mission receives a joke that obscures its work request.

## Testing Design

Keep one focused test named `teacher turns a corrupt launch into a verified postmortem`. Extend its existing real-key journey in test-first increments.

The test must prove:

1. `:teacher next` shows mission 1's brief before work begins.
2. `Ctrl-O` returns to `incident.log`.
3. An attempted guide edit reports `E21` and leaves the generated guide unchanged.
4. `Ctrl-I` after returning to work does not reopen the guide.
5. Mission 6 uses `cc` for four adjacent runbook lines and preserves all five lines.
6. Counted undo restores complete `cc` Insert sessions during a controlled failed attempt and consumes the count.
7. Mission 7 uses register `b`, then `f_` and `r-`, and passes with `desk-lamp`.
8. `:teacher golf` refuses before success and shows the mission route after success.
9. `:teacher score` reports exact metrics generated by the tested route.
10. Mission 8 retraces real work without editing or re-entering `[Teacher]`.
11. The completion guide includes the flight log.
12. `Ctrl-O` returns to the exact final teacher-owned `postmortem.md`.
13. `:registers a b` shows the two evidence values and their characterwise kind.

The test uses the existing DOM helpers and real keyboard dispatcher. It must not mutate editor state directly or read hidden teacher metrics.

Run only this browser test during RED and GREEN:

```powershell
npx playwright test tests/p0-teacher.spec.js --browser=chromium --workers=1 --reporter=line
```

Before each run, confirm that this repository has no active verifier and port 8767 has no listener. Run every verification process serially.

After GREEN, run changed-file syntax checks, `git diff --check`, the gzip comparison, one manual in-app browser journey, and the process-cleanup check. Do not run a browser matrix or broad suite.

## Performance and Size Gates

- Mission brief, score, golf, and return transitions each complete within 100 ms in the focused Chromium environment.
- Per-key metric work is constant time except for appending to the capped 600-token mission buffer.
- Completed missions discard raw tokens.
- The current teacher and editor assets may grow by at most 4,096 gzip bytes over commit `1c3a375`.
- The site adds no dependency, build step, worker, request, account, storage schema, or permission prompt.

## Updated Feature-to-Mission Evidence

The release record must add these rows or update their existing rows:

```text
cc correctness | linewise applyOperator | operator help | mission 6 | teacher capstone
guide return | teacher controller | :teacher help | every brief | teacher capstone
flight log | teacher metrics | :teacher score | all missions | teacher capstone
golf reveal | mission data | :teacher golf | all missions | teacher capstone
identifier normalization | f/r commands | find and replace help | mission 7 | teacher capstone
register inspection | :registers/:display | registers help | mission 2 | teacher capstone
```

Every row must name the implementation owner, help topic, mission, and browser evidence.

## Non-Goals

- Public leaderboards, grades, streaks, badges, accounts, or telemetry.
- Persisted scores or progress.
- Scoring inserted prose speed.
- A generalized course engine.
- A general buffer-option or read-only document framework.
- A full undo tree.
- New Vim commands unrelated to the proven teacher routes. `:registers` and `:display` are in scope because mission 2 uses them.
- A production fix for the bulk automation-input observation without a separate hardware or mobile reproduction.
- Push, merge, or deployment.

## Completion Evidence

The iteration is complete only when all of these artifacts exist:

1. One local design commit and one local implementation commit on `codex/vim-registers`.
2. One focused Chromium capstone passing with one worker.
3. One manual in-app browser receipt that reaches the exact final postmortem and flight log.
4. Exact transition latency, total test time, gzip delta, and process-cleanup output.
5. An updated feature-to-teaching matrix.
6. A clean worktree.
7. A user playtest handoff with the exact commands to try.

Nothing is pushed or merged without explicit authorization.
