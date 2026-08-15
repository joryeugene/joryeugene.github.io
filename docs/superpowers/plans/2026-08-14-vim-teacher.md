# Vim Teacher Mode Design and Implementation Plan

## Outcome

Build one `:teacher` course that takes a new Vim user from the first safe edit to an independent multi-file project.

The learner must finish useful files. The course does not grade command trivia. It does not use mascots, slogans, fictional comedy branding, streaks, badges, or public claims about speed and fluency.

The final required journey has three parts:

1. Learn the editing model through worked examples and guided changes.
2. Apply each skill to a new file without an exact command prompt.
3. Complete the existing analytics incident project across six files.

The classic `:tutor` remains available. `:teacher` becomes the recommended applied course.

## Research used

The curriculum combines these established practices:

- Vim and Neovim teach operators, motions, text objects, registers, marks, search, and files as a composable editing language.
- Neovim tutor files use editable lessons, local checks, and links to help topics.
- MIT Missing Semester teaches Vim through a real broken-code workflow.
- Learn Vim Progressively moves from survival to comfortable daily use before advanced commands.
- Vimcasts and Vimways teach repeatable editing workflows instead of command lists.
- VimGolf shows that a correct result can support later route comparison.
- Retrieval practice and distributed practice support later recall better than repeated reading alone.
- Worked examples followed by completion problems reduce early cognitive load.
- Immediate feedback helps the learner correct the current error before it becomes a habit.

The course applies those findings without making a public learning claim. Human playthrough evidence controls revisions and release decisions.

## Learning contract

Each required lesson contains these parts:

1. **Purpose:** Name the real task that the commands make easier.
2. **Worked example:** Show the initial text, command, cursor effect, and final text.
3. **Guided edit:** Name the command family and the visible result.
4. **Independent transfer:** Give a new file result without naming the exact command.
5. **Artifact check:** Inspect the saved document text.
6. **Progressive hints:** Show the concept, then the grammar, then the exact route.
7. **Route review:** Reveal a shorter route only after the artifact is correct.
8. **Later retrieval:** Reuse the skill in another lesson or project.

Delete a lesson if its transfer task does not produce a useful file result.

## Required curriculum

| Unit | Real outcome | Commands | Later retrieval |
|---|---|---|---|
| 1. Safe editing | Repair a handoff note and preserve an untouched line | Normal mode, Insert mode, Escape, `h j k l`, `0`, `$`, `x`, `u`, Ctrl-R, `:w` | Every later unit requires safe mode changes and recovery |
| 2. Vim grammar | Change code by meaning instead of selecting characters manually | `d`, `c`, `y`, motions, counts, `f`, `%`, `dd`, `cc`, `yy`, `p`, `iw`, `aw`, quotes, pairs, lines, paragraphs | Units 4, 5, 7, and the project |
| 3. Search and navigation | Find evidence and return to the prior location | `/`, `n`, `N`, `*`, marks, `gg`, `G`, Ctrl-O, Ctrl-I, `g;`, `g,` | Units 6 and 7, then the project |
| 4. Repeat and recover | Normalize repeated records and repair a deliberate mistake | `.`, counts, command history, search history, `u`, Ctrl-R | Unit 7 and project log cleanup |
| 5. Reuse text | Carry exact values without retyping | unnamed register, register `0`, named registers, delete registers, black-hole register, `:registers`, `p`, `P`, Insert Ctrl-N/P | Units 6 and 8, then the project |
| 6. Work across files | Inspect code, configuration, and documentation without losing the route | `:Ex`, Enter, `:e`, Ctrl-O, Ctrl-I, `:jumps`, `g;`, `g,`, marks | Required capstone |
| 7. Change many records | Make one correct bulk change and recover it safely | `:%s`, `:g`, `:v`, `:sort u`, block Visual, undo | Data and code project tasks |
| 8. Automate a stable edit | Replay a verified change across repeated text | macro record and replay, `@@`, counts, dot repeat | Project log normalization |
| 9. Applied incident | Produce a source-backed postmortem across six files | Interleaved use of all core units | Final independent transfer |

## Course files

The core course uses one small file per unit plus two related files for cross-file work:

- `01-handoff.txt`
- `02-service.js`
- `03-requests.log`
- `04-status.txt`
- `05-evidence.md`
- `06-api.js`
- `06-ui.js`
- `06-project.md`
- `07-records.csv`
- `08-routes.txt`

The existing project keeps these files:

- `incident.log`
- `events.csv`
- `config.js`
- `launch-copy.md`
- `runbook.md`
- `postmortem.md`

Teacher files stay in the editor document registry. They do not overwrite unrelated browser files.

## Package interface

Extend the current static package. Do not add a framework or another teaching engine.

```js
window.VIM_TEACHER = {
  version: 2,
  course: {
    intro: string[],
    done: string[],
    files: { [filename: string]: string[] },
    lessons: TeacherLesson[]
  },
  project: {
    intro: string[],
    done: string[],
    files: { [filename: string]: string[] },
    missions: TeacherLesson[]
  }
};
```

Each `TeacherLesson` contains:

```js
{
  id: string,
  title: string,
  purpose: string,
  file: string,
  worked: string[],
  request: string[],
  transfer: string[],
  outcome: string[],
  expect: string[],
  reject: string[],
  hints: string[],
  golf: [string, string]
}
```

Use arrays of plain strings because the current guide renderer already accepts line arrays.

## Commands

Keep the current commands and add only the controls required by the course:

```text
:teacher             Start at lesson 1 or resume the next incomplete lesson.
:teacher map         Show required units, completion, reviews, and the project.
:teacher next        Check the current artifact and open the next lesson.
:teacher check       Show the first unmet visible result.
:teacher hint        Advance from concept to grammar to the exact route.
:teacher lesson N    Open a selected lesson. Fresh progress still starts at lesson 1.
:teacher review      Open the oldest completed lesson that is due for retrieval.
:teacher project     Start or resume the applied incident project.
:teacher score       Show private session progress and observed command families.
:teacher golf        Show a shorter route after the artifact is correct.
:teacher export      Download a privacy-safe progress summary.
:teacher reset       Confirm before clearing teacher-owned progress and files.
```

Do not add accounts, network requests, telemetry, leaderboards, badges, or notifications.

## Progress and privacy

Use one versioned `localStorage` record:

```js
{
  version: 2,
  completedLessons: string[],
  completedProjectMissions: string[],
  reviews: { [lessonId: string]: number[] },
  summaries: {
    hints: number,
    retriedChecks: number,
    observedSkills: string[]
  }
}
```

Store only completion IDs, review dates, and summary counts. Do not store these values:

- learner file contents;
- raw key streams;
- clipboard text;
- register contents;
- search terms;
- names, email addresses, or account identifiers.

An incomplete lesson starts from its bundled file after reload. A completed lesson stays complete. Export uses the same summary schema and contains no document text.

Plain `:w` downloads a Teacher file but does not copy its contents into the browser filesystem. `:w NAME` creates a named browser file because the learner explicitly requested that copy.

## Feedback rules

`:teacher check` reports one visible problem at a time.

Good feedback:

```text
The owner line still contains TODO.
Change that line, then run :teacher check again.
```

Bad feedback:

```text
Incorrect. Try harder.
You failed the ownership objective.
```

`:teacher hint` uses three levels:

1. Name the editing idea.
2. Name the Vim grammar.
3. Give the exact key route.

The first hint must not expose the answer. The third hint may show the exact route.

## Existing project upgrade

Preserve the current analytics incident and its final postmortem. Improve it in these ways:

- Add a purpose and worked example to each mission.
- Split the current single hint into three levels.
- Add an independent transfer instruction when the existing request names every command.
- Keep every final claim supported by the bundled files.
- Remove remaining themed language from old plan and matrix files.
- Treat the project as the required capstone after the core units.
- Keep generated guides read-only and outside jump history.
- Keep `:teacher project` available to experienced users who want the capstone directly.

## Optional projects

Add an optional project only when it exercises a distinct command combination and produces a useful final file.

Candidate projects:

1. Repair a full-stack configuration mismatch across client, server, and documentation files.
2. Clean a CSV file, remove duplicates, and write a short evidence summary.
3. Correct product copy against source evidence and preserve necessary qualifications.
4. Resolve a merge conflict and retain both required changes.
5. Normalize repeated code with dot repeat, macros, and block Visual.

Do not build optional projects before the required course and capstone pass the real browser journey.

## Automated checks

Run every verifier serially with one worker.

Required focused journeys:

1. Fresh `:teacher` starts at lesson 1.
2. A worked example, guided edit, and transfer task complete without hidden state changes.
3. Each hint level advances once and does not edit the file.
4. `:teacher lesson N` opens the selected lesson without marking earlier lessons complete.
5. `:teacher map` reports exact completion state.
6. `:Ex` lists active teacher files and opens the selected file.
7. Reload restores completion summaries but not learner text.
8. Export contains no file text, raw keys, registers, or search terms.
9. Reset clears only teacher-owned state after confirmation.
10. Classic `:tutor` and the current applied project still work.
11. Mobile controls can start, edit, check, and advance one lesson.
12. The complete core course reaches the project.
13. The complete project still produces the exact postmortem.

Performance gates:

- Render the first teacher guide within 100 ms in the current local environment.
- Complete each lesson transition within 100 ms.
- Keep progress writes outside the keypress render path.
- Keep added required-course content below 8 KiB gzip unless a larger addition passes human review and has no smaller equivalent.

## Human playthrough protocol

Automated tests cannot prove that a lesson teaches.

Round one requires five fresh human journeys. For each problem, record:

- lesson and file;
- visible starting text;
- learner action;
- observed confusion;
- hint level used;
- recovery action;
- final file result;
- learner statement about the largest unclear point.

At least three round-one learners must have no Vim experience or less than one hour of prior use. Include one developer who normally uses another editor and one person who works with prose, data, or operations files. One person can satisfy more than one category.

Use one standard recovery task in Lesson 1. Ask the learner to append `x` to `keep: audit enabled`, return to Normal mode, and restore the exact line with change history without retyping it.

The core course and project can run in two sittings. Reload between them to verify the course map and local progress. Complete the project in one sitting because learner file contents are not stored.

After each lesson, ask where the workflow would save effort in the learner's own work. Remove or rewrite a lesson when three of five learners cannot name a credible use. Ask which instruction felt fake, childish, repetitive, or like filler. Record the answer exactly.

Revise a lesson when either condition occurs:

- More than two of five learners need the exact-route hint.
- Two learners make the same incorrect inference from the instructions.

Round two starts after those revisions. Release requires:

- five consecutive complete journeys without a blocker;
- at least four of five learners complete the final independent transfer without the exact-route hint;
- every learner can recover a seeded mistake with Escape, undo, or redo;
- the course map preserves completed lesson IDs after the planned reload;
- no lesson is kept only because its automated test passes.

Delayed reviews at roughly one, three, and seven days produce private research notes. They do not support a public retention claim without enough real observations.

## Task order

1. Lock this course contract and the command-to-outcome matrix.
2. Add the versioned course and project package shape.
3. Build Unit 1 and its full browser journey.
4. Build Units 2 through 4 one at a time.
5. Add local progress, the course map, and progressive hints.
6. Build Units 5 and 6, including `:Ex` integration.
7. Build Units 7 and 8.
8. Upgrade the current project and preserve its final artifact.
9. Add review and privacy-safe export.
10. Run the full automated gate.
11. Run human playthrough round one and revise weak lessons.
12. Run human playthrough round two.
13. Show the final course, evidence, limits, and largest gap before release approval.

## Stop conditions

Stop a build round when it does not create a new learner-visible outcome.

Do not add another lesson, command, metric, or project when the current course lacks a complete independent journey. Do not publish speed, fluency, or retention claims without direct human evidence.
