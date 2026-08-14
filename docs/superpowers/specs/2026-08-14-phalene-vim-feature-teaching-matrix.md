# Phalene-Vim Feature and Teaching Matrix

**Status:** Waves 1 through 8 are complete. Wave 9's focused Chromium, syntax, hygiene, size, and process-cleanup gates pass locally; the local commit is pending.

**Product outcome:** A Vim user can learn the mechanics in `:tutor`, apply them to a six-file Phalene Analytics incident in `:teacher`, and leave with a correct source-backed postmortem.

## Wave outcomes

| Wave | What a Vim user can do now | How the editor teaches it | Visible proof |
|---|---|---|---|
| 1. Jump history | Use counted `Ctrl-O` and `Ctrl-I` or `Tab` to retrace meaningful searches, marks, and document changes without filling history with ordinary `hjkl` movement. Inspect the path with `:jumps`. | Missions 1 and 8 require returning to evidence across documents. `:help Ctrl-o`, `:help Ctrl-i`, and `:help :jumps` explain the boundary. | The cursor leaves an incident result, returns to the prior source, moves forward again, and restores edited browser documents. |
| 2. Command and search recall | Press Up or Down to reuse prior Ex commands and `/` or `?` searches, filtered by the text already typed. | Mission 1 recalls `:teacher check`. Mission 2 recalls the prior search before collecting evidence. The main help search and command sections show Up and Down. | A recalled command executes again and a recalled search lands on the same visible evidence without retyping it. |
| 3. Changelist and automatic marks | Use `g;` and `g,` to revisit edit sites. Use `` `. ``, `` `^ ``, `` `[ ``, `` `] ``, `` `< ``, and `` `> `` to revisit the last change, insert, operation, or Visual selection. | Missions 3 and 8 require revisiting edits and final-source claims. `:help g;`, `:help marks`, and `:marks` describe the positions. | The cursor returns to the corrected config and change note after moving elsewhere. |
| 4. Typed registers | Keep the latest yank in `"0`, recover deletes from `"1` through `"9` and `"-`, assemble named evidence, append with uppercase names, discard through `"_`, and preserve characterwise, linewise, or blockwise paste shape. | Mission 2 stores the candidate ID in `a` and sensor in `b`. Mission 7 reuses evidence while composing the report. `:help registers` documents the complete register surface. | The evidence fields show `evt_014203` and `desk_lamp`, while later edits do not destroy them. |
| 5. Repeat and macros | Repeat the last complete change with `.`, record a command sequence with `q{register}`, replay with `@{register}` or `@@`, apply counts, and use Neovim-style `Q` for the last recorded macro. | Mission 4 fixes one malformed warning, repeats the edit, records `.n` in `z`, and replays `@z`. `:help .`, `:help q`, and `:help macros` explain the grammar. | Three malformed log entries end with the same `status=duplicate` field. |
| 6. Current-buffer completion | In Insert mode, use `Ctrl-N` or `Ctrl-P` to reuse an identifier already present in the current document without a language server. | Mission 5 completes `REVIEWED_ROOF_ARRAY_EVENTS` from the launch-copy buffer. `:help i_CTRL-N` and `:help i_CTRL-P` explain direction, wrap, and cancellation. | The approved sentence contains the exact reviewed metric key. A separate 10,000-line journey remains under the 100 ms target. |
| 7. Line text objects | Use `cil` or Visual `il` for the trimmed current line, and `yal` or Visual `al` for all lines in the document. | Missions 1, 3, 5, 6, 7, and 8 use `cil`; Mission 7 uses `yal`. `:help text-objects`, `:help il`, and `:help al` state the Neovim behavior. | Complete work-request lines change without manual Visual ranges, and the final document can be captured linewise. |
| 8. Rendering gate | Keep current behavior and avoid a rendering rewrite while real large-buffer editing already meets the target. | The teacher uses the same renderer as ordinary editing. The gate reopens only after two serial misses in an approved journey. | Current-buffer completion on 10,000 lines returned visible text in 28.9 ms and 31.2 ms. No runtime code was added. |
| 9. Applied teacher | Start `:teacher`, investigate six real files, ask for one hint, check visible results, reset with confirmation, and produce a coherent postmortem. | Eight missions connect incident response, data analysis, software repair, copywriting, operations, and evidence verification. `:help :teacher` explains the command loop. | One Chromium worker completed the full project in 31.3 seconds. `:teacher` activated in 4.4 ms, and `Ctrl-O` restored the exact final `postmortem.md`. |

## Feature ownership and acceptance

| Feature | Implementation owner | Help owner | Teacher mission and learner outcome | Focused browser evidence |
|---|---|---|---|---|
| Cross-document jumplist | `pushJump`, `jumpOlder`, `jumpNewer`, `activateJump`, `:jumps` | `Ctrl-o`, `Ctrl-i`, `:jumps` | 1 and 8. Retrace the timeline and sources behind the final report. | `tests/p0-jumplist.spec.js` and the final `tests/p0-teacher.spec.js` journey |
| Command and search history | `addHistory`, `recallHistory`, `handleCommand`, `handleSearch` | Main help command and search sections | 1 and 2. Reuse the project check and evidence search without retyping. | `tests/p0-history.spec.js` and the final teacher journey |
| Changelist | `recordChangePosition`, `moveChangeList` | `g;`, `g,`, `changelist` | 3 and 8. Return to the config repair and source-backed report changes. | `tests/p0-changelist.spec.js` and the final teacher journey |
| Automatic marks | `currentMarks`, edit row transforms, mark dispatch | `marks`, `:marks` | 3. Return to the exact latest change after moving away. | `tests/p0-changelist.spec.js` and the final teacher journey |
| Typed registers | `writeRegister`, `readSelectedRegister`, `storeRegister`, `pasteRegister` | `registers`, `"` | 2 and 7. Preserve evidence while other deletes and macro work continue. | `tests/p0-registers.spec.js` and the final teacher journey |
| Dot repeat | `beginRepeatCapture`, `finishRepeatCapture`, `repeatLastChange` | `.` | 4. Reuse one correct log repair. | `tests/p0-repeat-macros.spec.js` and the final teacher journey |
| Macro record and replay | `storeMacro`, `replayMacro`, the central key dispatcher | `q`, `@`, `Q`, `macros` | 4. Record `.n` in `z` and apply it to the remaining record. | `tests/p0-repeat-macros.spec.js` and the final teacher journey |
| Insert completion | `completeInsert` with candidate, line, and time caps | `i_CTRL-N`, `i_CTRL-P`, `insert-index` | 5. Complete the exact reviewed metric from the current document. | `tests/p0-insert-completion.spec.js` and the final teacher journey |
| `il` and `al` text objects | `computeTextObject` and the shared operator or Visual grammar | `text-objects`, `il`, `al` | 1, 3, 5, 6, 7, and 8. Replace full work lines and capture the finished report. | `tests/p0-line-text-objects.spec.js` and the final teacher journey |
| Applied project controller | `teacherCommand`, `teacherCheckMission`, `teacherSwitch`, `window.VIM_TEACHER` | `:teacher`, dashboard, command palette | All missions. Finish a useful artifact instead of a command quiz. | `tests/p0-teacher.spec.js`: 1 passed in Chromium with one worker, 31.3 seconds |

## Final release gate

Wave 9 closes only when one Chromium invocation with one worker performs this exact visible journey:

1. Open and reset the teacher project after confirmation.
2. Open a mission hint, return through jump history, and leave the work unchanged.
3. Repair all six files using the real keyboard dispatcher.
4. Advance only after each visible file satisfies its mission contract.
5. Render the first usable `:teacher` brief within the 100 ms activation budget.
6. Reach the project-complete guide, press `Ctrl-O`, and recover the exact ten-line `postmortem.md` deliverable.

The production JavaScript, help, bundled project data, and script tag add 6,095 gzip bytes over commit `331c890`, within the 16,384-byte limit. The site adds no runtime dependency, server, network request, account, analytics, database, or hidden scoring state.

## Largest remaining gap

The local Wave 9 commit remains. Verification stays serial within this repository while other repositories may verify concurrently on distinct ports.
