# Vim Teacher Human Playthrough Record

## Status

Round one has not started. This file contains the session protocol and empty evidence records. Browser automation must not be entered as human evidence.

On 2026-08-15, one serial browser journey completed all twelve core lessons and all eight applied-project missions in 1.3 minutes. It finished with the required postmortem and an 8/8 project map. This proves continuous product progression only. It does not count as a learner session, retention result, usability observation, or curriculum approval.

The final release-candidate gate ran `npx playwright test --workers=1 --reporter=line` against the local static site on Windows with one Chromium worker and one server on port 8767. The result was 261 passed, one skipped, and zero failed in 6.1 minutes. Syntax checks passed for `vim.js`, `vim-teacher.js`, and `vim-help.js`. `git diff --check` reported no whitespace errors. The largest remaining gap is unchanged: no fresh person has completed the repaired course, so the automated result cannot establish clarity, usefulness, or learning.

The serial browser journeys exposed five curriculum defects during the restart:

- Lesson 2 asked the learner to delete one character from "draff" to produce "draft." That result was impossible. The source now uses "draftt," so one deletion produces the promised result.
- Lesson 6 claimed that w would move from "source:" to "req_42." Vim correctly stopped on the colon because punctuation is a separate word. The beginner file now removes that unrelated punctuation boundary. A later lesson can teach w and W deliberately.
- A wrong Lesson 1 insertion produced "status: drafx." Teacher named the missing result but sent the learner back to the same check. The new `:teacher retry` action restores only the current core lesson file and resumes the visible action loop without requiring undo.
- Lesson 6 used `yiw` before a beginner could see what the text object selected. The guided route now uses `viwy`, then presents `yiw` only as the shorter route after success.
- The first applied mission displayed its worked conclusion and exact answer before the learner attempted the transfer. It also hid the next-step strip. Applied briefs now show the request and constraints without the answer, and the strip keeps the return or check action visible.

These are automated product findings. They are not human evidence.

## Owner validation failures before round one

On 2026-08-15, the owner tried the production Lesson 1 at `:teacher`. This was a curriculum review, not a fresh Round 1 learner session, because the owner helped define and review the course.

The owner reported:

> lesson one is too hard, it makes no sense, has cogntiive overload and no focus of next, doesn't make it easy and doesn't even teache someone how to open a file outside of the vbuffer they are in

After trying to reconstruct the requested actions, the owner reported:

> like even if i remember everyting tod o which was hard to grok from that fucking wall of text in 01 even, i don't know how to save and go back to lesson one its complete unclear and unguided

Observed defects:

- The first brief displayed several unfamiliar commands before the learner completed one action.
- The interface did not keep the current action visible after the work file opened.
- Lesson 1 relied on an unexplained `Ctrl-O` return instead of teaching how to open the named file.
- The lesson mentioned writing the file but did not guide the learner through save, check, and advance.
- The first unit combined navigation, modes, character edits, counts, undo, redo, saving, and course controls.

Restart acceptance condition: a learner must complete start, open, edit, Escape, save, and automatic advance while the interface shows one current action. Undo and redo move to a later lesson.

### Owner validation failure after the restart

On 2026-08-15, the owner tried the restarted local Lesson 1. This run failed and does not count as learner evidence.

The owner reported:

> it didn't even tell me what to fix

> it's not highlighting enough the bottom

> once I saved that file, it saved it to hard disk

> it said the same thing at the bottom edit file 1

Observed defects:

- The guide named a missing letter but did not show the exact broken line and finished line.
- The current action strip did not create enough visual separation or visible change after each step.
- Clicking the desktop editor did not focus the keyboard bridge, so a command could stop after `:`.
- Plain `:w` downloaded a bundled exercise instead of saving only the lesson state.
- Returning to the guide after a saved edit repeated the original file-opening instruction.

Required repair:

- Show the exact before and after text before the learner opens the file.
- Highlight the current target line in the editor.
- Make each changed action visually distinct and show partial command progress.
- Keep keyboard focus after an editor click.
- Keep plain Teacher saves inside the session with no download.
- Let the learner check a saved result from the guide instead of restarting the file-opening step or forcing a return trip.

The first repaired walkthrough exposed one more unnecessary detour: after a successful save, reopening the guide required Ctrl-O before `:teacher check`. That intermediate design still required `:teacher next`. The owner rejected both commands as redundant because saving already expresses the learner's intent.

### Natural-flow redesign

The current local design removes both extra commands from the learner path:

1. `:teacher` starts or resumes the course without replacing the current buffer.
2. The persistent Teacher panel shows the lesson, exact target, and one next Vim action.
3. The learner opens, edits, leaves Insert mode, and saves with ordinary Vim commands.
4. A correct `:w` completes the lesson once, leaves the finished file visible, and shows the next filename.
5. An incorrect `:w` leaves the learner in the same file and shows one repair. `:teacher retry` restores the bundled lesson file when needed.
6. Inactivity, cursor movement, wrong-file saves, and repeated saves of an older lesson cannot advance progress.
7. `:teacher off` hides the panel and pauses validation without deleting progress. `:teacher` resumes at the first incomplete lesson.

Serial browser proof on 2026-08-15 covered correct save, incorrect save, inactivity, wrong-file save, all twelve course lessons, all eight project missions, progress restore, optional views, metrics, and mobile Lesson 1. This is product verification only. The owner and fresh learners still need to judge clarity and learning value.

## Release decision

On 2026-08-15, the owner approved a production playtest before the human rounds. This live build is an owner-led validation release, not evidence that the curriculum has passed the human learning gate. Do not publish speed, fluency, or retention claims until both human rounds pass.

Round one requires five people who have not used this version of the course. Revise a lesson when either condition occurs:

- More than two of five people need the third hint, which gives the exact key route.
- Two people make the same incorrect inference from the lesson.

Round two starts after those revisions. Release requires all of these results:

- Five consecutive people complete the course and applied project without a blocker.
- At least four of five complete the final independent transfer without the third hint.
- Every person recovers a seeded mistake with Escape, undo, or redo.
- Every required lesson produces a useful file result.

## Learner mix

Use people who did not write or review this course. Every person must be new to this version.

Round one must include:

- At least three people with no Vim experience or less than one hour of prior use.
- At least one software developer who normally uses another editor.
- At least one person who works with prose, data, or operations files.

One person can satisfy more than one category. Record prior Vim use before the course starts.

## Session setup

Use the current local build in a desktop browser. Start with cleared Teacher progress, but do not clear unrelated browser files or Vim settings.

From the dashboard, type `:teacher reset` and accept the confirmation. Then type `:teacher` to start the observed journey.

Run each journey in two sittings when needed:

1. Complete the current core lessons.
2. Reload the page and confirm that the course map still shows completed lessons.
3. Complete the applied project in one sitting so its working files stay available.

Keep the two sittings less than 48 hours apart. Record breaks, but do not use completion time as a pass condition.

Tell each person only this:

> Open Vim Teacher with `:teacher`. Work through the course and applied project. Think aloud when an instruction, command, result, or next step is unclear. You may use the three Teacher hints. Please do not ask the observer for a command unless you cannot continue.

The observer may explain the session protocol. The observer must not teach a Vim command during the run. If a person is blocked after the third hint, record the blocker and end that task.

## Standard recovery task

Use the same task for every person after Lesson 2. After the learner finishes 02-recovery.txt, say:

> On the keep: rollback ready line, append one x and return to Normal mode.

After the learner commits that change, say:

> The `x` was a mistake. Restore the original line with Vim change history. Do not retype the line.

Recovery passes only when the line is exactly "keep: rollback ready," the editor is in Normal mode, and the learner uses undo or redo. Record any request for help as confusion evidence.

## Result definitions

- **Artifact complete:** a correct `:w` validates the active exercise and advances exactly once.
- **Independent transfer:** The learner completes the transfer request without hint 3 or observer instruction.
- **Final independent transfer:** The learner completes the postmortem and source-retrace missions without hint 3 or observer instruction.
- **Curriculum blocker:** The learner cannot produce the result after hint 3 and three more minutes.
- **Interface blocker:** Focus, navigation, layout, or a control prevents the learner from continuing.

If a core lesson blocks, record it and use `:teacher lesson N` to continue with the next lesson. Do not mark the blocked lesson complete. If a project mission blocks, end the project sitting.

## Evidence to capture

For every confusion or recovery event, record these fields:

| Time | Lesson and file | Visible starting text | Learner action | Exact confusion statement | Hint level | Recovery action | Visible result | Largest unclear point |
|---|---|---|---|---|---:|---|---|---|
| | | | | | | | | |

At the end of each lesson, record the artifact result and whether the person completed the independent transfer without the exact-route hint.

Ask this question after each lesson:

> Where, if anywhere, would this save effort in your own work?

Remove or rewrite a lesson when three of five people cannot name a credible use. At the end of the journey, ask:

> Which instruction or exercise felt fake, childish, repetitive, or like filler?

Record the answer exactly. Revise repeated criticism before round two.

| Lesson | Artifact complete | Transfer without hint 3 | Credible personal use | Blocker | Notes |
|---|---|---|---|---|---|
| 1. Open, edit, and save | | | | | |
| 2. Correct and recover | | | | | |
| 3. Change a word and remove a line | | | | | |
| 4. Find evidence in a log | | | | | |
| 5. Repeat a verified change | | | | | |
| 6. Copy exact text | | | | | |
| 7. Open a source and return to a buffer | | | | | |
| 8. Compare a source in another window | | | | | |
| 9. Keep a separate task in another tab page | | | | | |
| 10. Retrace evidence and recent changes | | | | | |
| 11. Clean a small data file safely | | | | | |
| 12. Replay one verified route migration | | | | | |
| Applied incident project | | | | | |

## Round one sessions

### Person 1

- Vim experience:
- Browser and device:
- Started:
- Finished:
- Final independent transfer without hint 3:
- Recovered the seeded mistake:
- Course map survived reload:
- Core score summary captured:
- Project score summary captured:
- Blockers:
- Largest unclear point, in the learner's words:
- Fake, childish, repetitive, or filler content, in the learner's words:

### Person 2

- Vim experience:
- Browser and device:
- Started:
- Finished:
- Final independent transfer without hint 3:
- Recovered the seeded mistake:
- Course map survived reload:
- Core score summary captured:
- Project score summary captured:
- Blockers:
- Largest unclear point, in the learner's words:
- Fake, childish, repetitive, or filler content, in the learner's words:

### Person 3

- Vim experience:
- Browser and device:
- Started:
- Finished:
- Final independent transfer without hint 3:
- Recovered the seeded mistake:
- Course map survived reload:
- Core score summary captured:
- Project score summary captured:
- Blockers:
- Largest unclear point, in the learner's words:
- Fake, childish, repetitive, or filler content, in the learner's words:

### Person 4

- Vim experience:
- Browser and device:
- Started:
- Finished:
- Final independent transfer without hint 3:
- Recovered the seeded mistake:
- Course map survived reload:
- Core score summary captured:
- Project score summary captured:
- Blockers:
- Largest unclear point, in the learner's words:
- Fake, childish, repetitive, or filler content, in the learner's words:

### Person 5

- Vim experience:
- Browser and device:
- Started:
- Finished:
- Final independent transfer without hint 3:
- Recovered the seeded mistake:
- Course map survived reload:
- Core score summary captured:
- Project score summary captured:
- Blockers:
- Largest unclear point, in the learner's words:
- Fake, childish, repetitive, or filler content, in the learner's words:

## Round one revision decisions

| Evidence from at least two people | Lesson change | Reason to keep or remove the lesson | Verification after change |
|---|---|---|---|
| | | | |

## Round two sessions

Record five consecutive sessions with the same event and lesson tables.

| Person | Completed without blocker | Final transfer without hint 3 | Recovered seeded mistake | Largest remaining gap |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

## Final human verdict

- Five consecutive completions:
- Four of five independent transfers without hint 3:
- Five of five recoveries:
- Lessons removed as useless:
- Lessons revised for repeated confusion:
- Repeated fake, childish, repetitive, or filler criticism:
- Largest remaining gap:
- Owner approval:
