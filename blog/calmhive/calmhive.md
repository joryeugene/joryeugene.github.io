# Calmhive v3: A Claude Code Wrapper for Background Jobs

**A CLI for leaving long Claude Code tasks running and checking them later.**

*By Jory Pestorious | May 31, 2025 | Archive note added August 12, 2026*

> **Archive note, August 12, 2026:** The [npm registry](https://registry.npmjs.org/%40calmhive%2Fcalmhive-cli) records v3.0.19 as published on May 31, 2025, but no longer serves that version. The [GitHub repository](https://github.com/joryeugene/calmhive-cli) is archived, and its surviving history begins with a July 5, 2025 [complete rewrite](https://github.com/joryeugene/calmhive-cli/commit/10e86539bd3852f2107a6a9b52b61f912b539edf). The v3 source is not publicly recoverable, so I cannot independently reverify its implementation claims. I removed the current install commands, the blanket “safe” label on preapproved tools, and routine `killorphans` advice. Treat the body as a May 2025 release note, not a current setup guide.

![CalmBee, the Calmhive bee mascot](calmbee.png)
CalmBee is the mascot for Calmhive's background workflows.

## Why I built it

My Claude Code jobs stop when they reach usage limits. I want to leave a long task running, inspect its status later, and stop the process associated with one recorded session. Reapproving the same tools after a restart adds more friction.

Calmhive v3.0.19 wraps the Claude Code CLI around those problems. The wrapper has five command modes:

- `calmhive chat`: Start an interactive Claude session with a configured tool list.
- `calmhive run`: Send one task through a noninteractive Claude process.
- `calmhive afk`: Run a task in repeated background iterations.
- `calmhive voice`: Use OpenAI speech recognition and text-to-speech around Claude commands.
- `calmhive tui`: View session status and logs in a terminal interface.

Calmhive requires Node.js 18 or later and the Claude CLI. Speech control also requires an OpenAI API key and listens for “hey friend,” “calmhive,” “ok friend,” and “now friend.”

## What adaptive retry does

During an AFK run, Calmhive starts one iteration at a time. When Claude prints `Claude Max usage limit reached`, v3 waits and retries that iteration. The delay doubles from 30 seconds to one minute, two minutes, four minutes, and eventually a maximum of 60 minutes.

```text
Iteration 10 ✓
⚠️ Claude Max usage limit reached
⏳ Waiting 1 minute before retry...
🔄 Retrying iteration 10 after usage limit delay...
```

The retry loop handles the rate-limit delay. The loop does not guarantee that a task will finish, classify every failure, or preserve work after every process or network error.

## Process and permission boundaries

An AFK session stores its state in SQLite and records a process ID. The status and log commands read that session record, while `afk stop` targets the recorded process. A process command is only as safe as its ownership checks, so verify the target before stopping it.

The chat and run modes can preapprove a configured tool list. Fewer prompts also mean fewer chances to catch an unintended action. Review every listed tool and credential before an unattended run. Treat preapproval as permission, not a safety review.

For a voice request, Calmhive sends speech to OpenAI for transcription and text-to-speech, then passes the resulting command to Claude. An OpenAI API key is required only for voice requests.

## The job Calmhive does

Calmhive gives me one place to start a background task, leave the terminal, and return to its status and logs. A known rate-limit message starts the retry path, and the session record makes the running work visible. I built Calmhive for the moment an overnight task stops at a usage limit.

**lets bee friends**

**Historical links:** [npm package](https://www.npmjs.com/package/@calmhive/calmhive-cli) | [archived GitHub repository](https://github.com/joryeugene/calmhive-cli) | [Calmhive site](https://calmhive.com) | [Terminal Velocity](https://github.com/joryeugene/ai-dev-tooling/blob/main/blog/02-terminal-velocity.md)
