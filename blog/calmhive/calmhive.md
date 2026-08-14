# Calmhive: Claude That Never Quits

**A CLI for leaving long Claude Code tasks running and checking them later.**

*By Jory Pestorious | May 31, 2025*

![CalmBee, the Calmhive bee mascot](calmbee.png)
CalmBee is the mascot for Calmhive's background workflows.

## Why I built it

My Claude Code jobs stop when they reach usage limits. I want to leave a long task running, inspect its status later, and stop the process associated with one recorded session. Reapproving the same tools after a restart adds more friction.

Calmhive v3.0.19 wraps the Claude Code CLI around those problems. The wrapper has five command modes:

- `calmhive chat`: Start an interactive Claude session with a configured tool list.
- `calmhive run`: Send one task through a noninteractive Claude process.
- `calmhive afk`: Run a task in repeated background iterations.
- `calmhive voice`: Use RealtimeSTT for speech recognition and OpenAI for spoken responses around Claude commands.
- `calmhive tui`: View session status and logs in a terminal interface.

Calmhive requires Node.js 18 or later and the Claude CLI. Voice mode also requires RealtimeSTT and an OpenAI API key for spoken responses. Voice mode listens for “hey friend,” “calmhive,” “ok friend,” and “now friend.”

## What adaptive retry does

During an AFK run, Calmhive starts one iteration at a time. In v3, I match `Claude Max usage limit reached`, wait, and retry that iteration. The delay doubles from 30 seconds to one minute, two minutes, four minutes, and eventually a maximum of 60 minutes.

```text
Iteration 10 ✓
⚠️ Claude Max usage limit reached
⏳ Waiting 1 minute before retry...
🔄 Retrying iteration 10 after usage limit delay...
```

The retry loop does not guarantee that a task will finish, classify every failure, or preserve work after every process or network error.

## Process and permission boundaries

In v3, I store each AFK session in SQLite with its process ID. I use that record for status and logs, while `afk stop` targets the recorded process. A process command is only as safe as its ownership checks, so verify the target before stopping it.

The chat and run modes can preapprove a configured tool list. Fewer prompts also mean fewer chances to catch an unintended action. Review every listed tool and credential before an unattended run. Treat preapproval as permission, not a safety review.

For a voice request, RealtimeSTT transcribes speech locally, Calmhive passes the resulting command to Claude, and OpenAI converts response text to speech. The OpenAI API key is used for spoken responses, not transcription.

## The job Calmhive does

When an overnight task reaches the known usage-limit message, Calmhive waits, retries the same iteration, and keeps the session visible for me to inspect later.

**lets bee friends**

**Historical links:** [npm package](https://www.npmjs.com/package/@calmhive/calmhive-cli) | [archived GitHub repository](https://github.com/joryeugene/calmhive-cli) | [Calmhive site](https://calmhive.com) | [Terminal Velocity](https://github.com/joryeugene/ai-dev-tooling/blob/main/blog/02-terminal-velocity.md)
