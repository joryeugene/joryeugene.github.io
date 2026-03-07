# The Knowledge Sidecar: Verified Context Is the Moat

**How keephive turns Claude Code sessions from isolated conversations into a compounding knowledge loop.**

*By Jory Pestorious | March 2026*

> 🐝 **Now Available**: [PyPI](https://pypi.org/project/keephive/) | [GitHub](https://github.com/joryeugene/keephive)

## The Session Reset Problem

Every Claude Code session starts fresh.

Your agent reads the codebase, maps the patterns, understands why the auth service is structured the way it is, and learns that you always run tests before committing. Then the session ends. The next session begins with none of that. The agent rediscovers the same patterns, re-reasons the same architectural decisions, and sometimes contradicts conclusions from the last conversation.

This is not a bug in Claude Code. It is how language models work. But it means every session pays a context tax: re-establishing knowledge that should survive between conversations.

Two things make this worse over time.

First, context degrades. The codebase changes. The architectural decision you logged in your CLAUDE.md three months ago may no longer be true. You have no way to know what is stale without checking manually.

Second, unverified context is noise. Dumping everything into CLAUDE.md and hoping the agent uses it correctly is not a knowledge system. It is a hope system.

keephive addresses both.

## The Sidecar Pattern

In microservices architecture, a sidecar is a container that runs alongside a primary service, handling concerns the primary service should not manage directly: logging, security, service discovery, and configuration sync. The sidecar does not replace the primary service. It handles the cross-cutting layer so the primary service stays focused.

keephive is a knowledge sidecar for Claude Code.

It does not replace Claude Code or change how Claude works. It runs alongside your sessions, handling the layer Claude Code is not designed to manage: what you have learned, whether that knowledge is still true, and how to surface the right context at the right moment.

The division of responsibility is clean:

| Claude Code | keephive |
|---|---|
| Task execution | Knowledge persistence |
| Code generation | Fact verification |
| Session reasoning | Cross-session context |
| Tool use | Background intelligence |

## The Speed System

keephive answers to three names: `keephive`, `hive`, and `h`. Every command has a short alias.

```bash
h s          # status
h r          # remember
h rc         # recall
h v          # verify
h rf         # reflect
h a          # audit
```

The resolver goes further for prompts and knowledge guides. Type a slug prefix, not a full name:

```bash
h p pr-re       →  pr-review-git-staged-diff-analysis.md
h k agent       →  agent-principles.md
h n code-review →  starts a note from the code-review prompt template
h go pr-re      →  launches a Claude session with that prompt loaded
```

`h go pr-re` does not just print the prompt. It launches a full Claude Code session with that prompt pre-loaded and your verified memory injected. You press two keys for the command and a few more for the target. You never type a full name.

This matters because the fastest path to a productive session is one where the agent arrives oriented. `h go` is that path.

## What keephive Does

keephive operates through Claude Code's hook system. Hooks fire at session boundaries and tool use events, giving keephive read and write access to session context without modifying Claude Code itself.

```bash
# Install
uv tool install keephive

# Set up hooks and MCP server
hive setup
```

The core workflow has three stages.

### 1. Capture

During and between sessions, you log facts, decisions, and context:

```bash
hive r "FACT: auth service uses JWT with 15-minute expiry"
hive r "DECISION: chose Postgres over MySQL for JSONB support"
hive r "TODO: migrate legacy user table to new schema"
```

The session start hook injects your memory, active TODOs, and matched knowledge guides into each new session automatically. The agent starts informed rather than blank.

### 2. Verify

This is where keephive diverges from every other AI memory tool.

Any tool can store notes. keephive checks whether stored facts are still true:

```bash
hive verify
```

`hive verify` runs each stored fact against your actual codebase using an LLM call. It marks facts stale when reality has diverged from what you recorded. A fact that was true six months ago but no longer is does not compound your knowledge. It corrupts it.

```
Checking: "auth service uses JWT with 15-minute expiry"
→ Checking auth/tokens.py... STALE: expiry changed to 60 minutes in commit a3f2c1

Checking: "we use Postgres, not MySQL"
→ Confirmed in docker-compose.yml and pyproject.toml ✓
```

The verification loop transforms a note-taking system into a living knowledge base. The distinction matters more than it sounds: a CLAUDE.md full of stale facts trains the agent to make decisions based on a codebase that no longer exists.

### 3. Compound

Verified facts feed back into session context. Each session starts with knowledge that is accurate now, not knowledge that was accurate at some point in the past.

The `hive stats` command shows the knowledge state:

```
Knowledge State
  Facts:      47 total, 44 verified, 3 stale
  Guides:     6 active, 2 always-on
  Freshness:  94%
  Recall:     12 queries this week
```

A codebase with 94% verified context compounds. An agent that starts each session with accurate knowledge makes better decisions in the first five minutes than a session that spends the first five minutes rediscovering what already exists.

## Task Tracking

keephive includes a built-in task tracker that surfaces into every session.

```bash
hive todo "fix auth"           # h t
hive todo done "auth"          # h td
hive todo "review PR #441"
```

TODOs appear automatically at every session start, inline with today's log. Fuzzy deduplication prevents near-duplicates from accumulating. Recurring tasks are supported for things that happen on a schedule.

The task list lives in the knowledge base, which means `hive verify` can cross-check open TODOs against the codebase and identify which ones may already be resolved.

## Notes and Scratchpad

`hive note` (`h n`) is a multi-slot scratchpad for in-session thinking.

Ten independent note slots let you track parallel threads without mixing them. Slot 1 is the default; use any number from 1 to 10.

```bash
hive note           # open slot 1 in $EDITOR
hive n 4            # open slot 4
hive 4 "text"       # quick-append to slot 4 without opening an editor
hive n todo         # extract TODO items from the note and promote them to the task list
```

Notes are not permanent. They are working memory for the current session or the current task. When you are done, `hive n todo` promotes what matters, and the rest clears.

## Prompt Library

keephive ships a prompt library: reusable prompt templates stored as markdown files and resolved by prefix.

```bash
h p pr-re      →  pr-review-git-staged-diff-analysis.md
h p standup    →  standup-draft.md
h p debug      →  debugging-protocol.md
```

Press `h go pr-re` and a Claude session opens with that exact prompt loaded, your verified memory injected, and your open TODOs surfaced. You do not type the full prompt name. You do not copy-paste from a prompt library. You type `h go` and a slug prefix, and the session starts.

This compounds with knowledge guides. A knowledge guide is a deeper reference document (architecture notes, team conventions, patterns discovered over time) that keephive matches contextually and injects at session start. The more guides you have, the more targeted the injection becomes.

```bash
hive knowledge edit auth-architecture    # create or edit a guide
hive knowledge list                      # see all guides
h k agent                                # open agent-principles.md directly
```

## The Web Dashboard

`hive serve` opens a live browser dashboard at `localhost:3847`.

Seven views cover the full knowledge state:

- **Brain**: working memory, behavioral rules, open TODOs, and active facts in a single high-density panel
- **Dev**: current session activity, recent tool use, live log tail
- **Knowledge**: all guides and prompt templates, browsable and searchable
- **Stats**: sparkline activity charts, 30-day heatmap, command breakdown, streak
- **Growth**: 30-day compounding trends, week-over-week deltas, knowledge trajectory
- **Play**: KingBee wander docs, hypothesis output, free-association results
- **Settings**: hook pipeline status, MCP server health, daemon task toggles

Panels update in real time using Server-Sent Events. When you run `hive r "FACT: ..."` in a terminal, the Brain panel refreshes in under a second without a page reload.

The dashboard also ships a browser bookmarklet. Install it once; use it to capture clipboard content into the knowledge base from any browser tab. The captured content appears in the daily log with a `[UI Feedback]` tag.

## hive stats: What You Have Built

The stats view shows everything about your knowledge base and how you use it.

```
Knowledge State
  Facts:      47 total, 44 verified, 3 stale
  Guides:     6 active, 2 always-on
  Freshness:  94%
  Recall:     12 queries this week

Activity
  ▁▂▅▃█▇▂▁▁▃▅▆▇█▂▁▁▁▁▁▁▁▁ (30-day sparkline)
  5-day streak
  42 commands today · 120 this week

Command Activity
  remember (18) · recall (12) · verify (6) · reflect (3)
  Daemon tasks: soul-update (7) · stale-check (3) · wander (4)

Most Recalled
  auth-architecture · deployment-flow · postgres-patterns
```

`hive growth` shows 30-day compounding trends: how freshness changes over time, how recall queries grow, how the knowledge base builds on itself week over week.

## The Daemon Layer: KingBee

keephive includes a background daemon called KingBee that runs when you are not in a session.

```bash
hive daemon start
```

KingBee runs six tasks on configurable schedules:

- **soul-update**: Synthesizes your daily log into a persistent knowledge soul
- **stale-check**: Proactively identifies facts that may have drifted from the codebase
- **standup-draft**: Generates standup summaries from your git activity
- **morning-briefing**: Surfaces what deserves attention when you start work
- **self-improve**: Proposes new knowledge guides from observed patterns
- **wander**: Free-association time to find unexpected connections in your knowledge base

The wander task is different from the others. It does not respond to a prompt. It reads your accumulated knowledge and generates hypotheses, surfacing connections you may not have thought to look for:

```
[🐝 KingBee 08:23] type:wander

The auth refactor and the rate limiting work both touch session management.
The rate limiter currently reads from Redis on every request; the auth layer
writes to the same store. A single read-through cache layer might reduce
round trips significantly while simplifying the boundary between the two.
```

This is not a task you assigned. It is an observation generated from what you have stored, produced while you were away from the keyboard. Wander output appears in `hive inbox` and the `/play` view of the dashboard.

## Autonomous Loops

`hive run "task description"` launches a multi-iteration Claude loop without human prompting between turns.

The loop pulls SOUL wisdom (the distilled summary of your accumulated knowledge) into the first iteration banner. Each iteration runs to completion, checks its own progress, and continues to the next. The loop exits when the task is done or when a stopping condition triggers.

```bash
hive run "refactor the auth module to use the new token format"
hive run "task" --background   # runs without blocking the terminal
```

The loop tracks its own state in the knowledge base. Completed iterations log to the daily file. When the loop finishes, `hive status` shows what it accomplished.

## What This Is Not

keephive is not a RAG system over your codebase. Tools like Cursor and Copilot already handle semantic code search well. keephive stores what you have learned and decided, not just what exists in the files.

keephive is not a replacement for CLAUDE.md. It writes to CLAUDE.md and injects context at session start. They work together.

keephive is not a memory graph. There are no entity embeddings, no vector stores, no Neo4j. The knowledge format is human-readable markdown. You can read it, edit it, and git-track it. The system stays legible.

## The Compounding Math

Without keephive, each session starts with zero retained context from the previous session. Knowledge accumulates only through CLAUDE.md entries you maintain manually. Maintenance debt accumulates alongside them. Stale entries degrade the signal. Most developers stop maintaining their CLAUDE.md after a few weeks because the upkeep cost exceeds the return.

With keephive, each session starts with verified context from all previous sessions. Each verification run removes stale signal. Each session adds to a base that the next session inherits.

The delta is not incremental. A session that starts with accurate, verified context about the codebase makes better decisions in the first five minutes than a session that spends those five minutes rediscovering what already exists. That time compounds across every session, every day.

## Getting Started

```bash
# Install (requires Python 3.11+)
uv tool install keephive

# Set up hooks and MCP server in Claude Code
hive setup

# Start logging what you learn
hive r "FACT: ..."
hive r "DECISION: ..."

# Check what you have
hive status

# Run your first verification
hive verify

# Start the background daemon
hive daemon start

# Open the web dashboard
hive serve
```

The MCP server makes `hive_remember` and `hive_recall` available as tools inside Claude Code sessions, so the agent can read and write to your knowledge base directly during work without leaving the session.

The verification cycle earns its cost quickly. Run `hive verify` after any significant change to the codebase or architecture. Let the daemon handle the background work between sessions.

## The Moat

Intelligence is commoditizing fast. GPT, Claude, and Gemini are substitutable for most tasks today. The capability gap between frontier models narrows with each release cycle.

Context is not commoditizing. Your accumulated, verified knowledge about your specific codebase, your team's decisions, your architectural rationale, and your learned patterns is not something a commodity model provides. It is yours, and it compounds with use.

The gap between a developer using a fresh Claude Code session and a developer whose session starts with six months of verified, contextually-matched knowledge is not a model capability gap. It is a knowledge infrastructure gap.

keephive is that infrastructure.

---

**Links:**
- [GitHub Repository](https://github.com/joryeugene/keephive)
- [PyPI Package](https://pypi.org/project/keephive/)
- [Previous Article: Calmhive: Claude That Never Quits](../calmhive/calmhive.md)
