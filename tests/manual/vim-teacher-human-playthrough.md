# Vim Teacher Human Playthrough Record

## Status

Round one has not started. This file contains the session protocol and empty evidence records. Browser automation must not be entered as human evidence.

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

1. Complete the eight core lessons.
2. Reload the page and confirm that the course map still shows completed lessons.
3. Complete the applied project in one sitting so its working files stay available.

Keep the two sittings less than 48 hours apart. Record breaks, but do not use completion time as a pass condition.

Tell each person only this:

> Open Vim Teacher with `:teacher`. Work through the course and applied project. Think aloud when an instruction, command, result, or next step is unclear. You may use the three Teacher hints. Please do not ask the observer for a command unless you cannot continue.

The observer may explain the session protocol. The observer must not teach a Vim command during the run. If a person is blocked after the third hint, record the blocker and end that task.

## Standard recovery task

Use the same task for every person during Lesson 1. After the learner returns to `01-handoff.txt`, say:

> On the `keep: audit enabled` line, append one `x` and return to Normal mode.

After the learner commits that change, say:

> The `x` was a mistake. Restore the original line with Vim change history. Do not retype the line.

Recovery passes only when the line is exactly `keep: audit enabled`, the editor is in Normal mode, and the learner uses undo or redo. Record any request for help as confusion evidence.

## Result definitions

- **Artifact complete:** `:teacher next` accepts the visible file.
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
| 1. Safe editing | | | | | |
| 2. Vim grammar | | | | | |
| 3. Search and navigation | | | | | |
| 4. Repeat and recover | | | | | |
| 5. Reuse text | | | | | |
| 6. Work across files | | | | | |
| 7. Change many records | | | | | |
| 8. Automate a stable edit | | | | | |
| 9. Applied incident | | | | | |

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
