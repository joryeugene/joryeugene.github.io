# Verified Context Is the Moat

**Keephive carries facts across agent sessions. Its current verifier can also put a new verification date on a fact it could not confirm.**

*By Jory Pestorious | March 2026*

I built [keephive](https://github.com/joryeugene/keephive) to carry facts and decisions across agent sessions. Its memory path is useful: the CLI writes durable Markdown, session hooks inject selected context, and an MCP server exposes the same store to other compatible agents. The state is persistent/inspectable. I can open it, edit it, delete it, and see what an agent will read.

The verifier does not justify calling all of that context verified. At keephive v2.1.0, an `UNCERTAIN` result receives a new `[verified:DATE]` tag. A separate session-start path can refresh a stale fact when its words overlap with a recent log entry. Neither path proves the fact.

Persistent memory increases the cost of that mistake. A bad answer in one chat can disappear with the session. A bad fact in working memory can return at every session start.

In [Protection Emerged. Verification Did Not.](../emergent-religion/index.html), I looked at verification through agent simulations. [Project Sid](https://arxiv.org/html/2411.00114v1) seeded Pastafarianism through designated priest agents and supplied roles for some collective tasks. The paper did not test whether a fact-checking role would emerge. The narrower engineering question still matters: when a system keeps beliefs, what can reject one that is wrong?

## What Keephive Actually Stores

Keephive separates a daily record from working memory. The `hive r` command appends an event to a dated log. The `hive mem` command writes a fact to `working/memory.md`, where the current implementation immediately adds today's verification tag. The verifier later reads facts from that working-memory file, plus unreviewed auto-captured facts.

```bash
# Append events to today's log
hive r "FACT: auth service uses JWT with 15-minute expiry"
hive r "DECISION: chose Postgres over MySQL for JSONB support"
hive r "TODO: migrate legacy user table to new schema"

# Add the fact separately to working memory so verify can inspect it
hive mem "auth service uses JWT with 15-minute expiry"

# Ask the verifier to inspect working-memory facts
hive verify
```

The JWT line is an example, not captured telemetry. The command boundary is real and visible in [`remember.py`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/commands/remember.py) and [`memory.py`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/commands/memory.py). `hive r` accepts `FACT`, `DECISION`, and `TODO` records, but recording a fact in the daily log does not put it on the verifier's input list. The fact must enter working memory separately.

At session start, keephive filters working memory to the current project, adds rules and stale-fact warnings, surfaces due recurring tasks, and selects matching knowledge guides within a fixed budget. That is the part I wanted: the next session receives relevant state without loading every note I have ever written.

## The Verifier's Actual Contract

[`hive verify`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/commands/verify.py) lists the eligible facts and asks `Verify with LLM?` before the first model call. Every fact in a confirmed batch becomes part of a Claude prompt, and the verifier enables `Read`, `Grep`, `Glob`, and `WebSearch`. Review the displayed list and remove credentials or confidential facts before confirming.

Keephive asks again before each additional batch. The prompt requests one of three verdicts. `VALID` means the model found confirming evidence. `STALE` means it found a contradiction and can supply replacement text. `UNCERTAIN` means it investigated but found evidence for neither conclusion.

A valid fact receives a new date. A stale fact can be replaced with the model's correction. Under a hash of the old fact, Keephive stores the old claim, verdict, full latest reason, and up to five extracted source locations. Its five-entry history truncates each reason to 200 characters, and neither record stores the replacement text.

The third branch changes the meaning of the store. It prints `Refreshed (not disproven)` and also writes a new verification date. The system preserves the `UNCERTAIN` verdict in its evidence history, but the working-memory line looks fresh again. Any later code that reads only `[verified:DATE]` loses the distinction.

Session start adds a second shortcut. [`_auto_reverify`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/hooks/sessionstart.py) compares stale facts with entries from daily logs for the last seven days. More than 50 percent word overlap refreshes the verification date without inspecting the repository or calling a model. Repeating a claim in a recent log can therefore make the same claim look current.

The dashboard's freshness percentage cannot repair this. [`_knowledge_health`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/commands/stats.py) calls a decay score that weights the tag's recency at 40 percent, then splits the remaining weight across log references, fact category, and recall frequency. A score above 0.6 counts as fresh. That metric describes use and age, not evidentiary truth. A display that reads `94% fresh` can therefore look like measured truth without measuring it.

## What Verification Would Require

`UNCERTAIN` has to remain uncertain. The verifier can keep the previous check date, clear it, or add a separate uncertainty field, but it cannot advance the evidence state merely because no contradiction was found. Absence of evidence is not a successful check.

A correction also needs provenance that survives the rewrite. The record preserves the original claim and full current rationale, then keeps five checks with 200-character reasons. It should also link the replacement, preserve the complete evidence locations, name the model and prompt version, and record whether a human accepted the change. Without that chain, rollback and contradiction review are harder.

Automatic rechecks should follow evidence, not repeated language. A path change, dependency update, failing test, or content hash can identify a reason to inspect a fact again. Word overlap can retrieve a candidate. It cannot verify one.

Seed working memory with known true, false, obsolete, and unanswerable facts. Run the same repository state through the verifier repeatedly. Measure how often each class becomes `VALID`, `STALE`, or `UNCERTAIN`, then inspect every mutation to memory. A verifier has to prove that it preserves uncertainty before its freshness score means anything.

## Tripod Guards a Different Boundary

[Tripod](https://github.com/joryeugene/tripod) addresses behavior rather than knowledge. Its [`PreToolUse` hooks](https://github.com/joryeugene/tripod/blob/289682b4b672205df871ffc1fbf5c5d64f3d030e/hooks/hooks.json) inspect matching Claude Code tool calls and return a denial for patterns such as Unicode dashes, `--no-verify`, `git stash`, and writes under `/tmp`.

That boundary is narrower and easier to verify. While the plugin is active, a matching Bash, Write, or Edit call is rejected before execution. Tripod does not make the behavior impossible in every client or outside Claude Code, and a user can disable the plugin. It does remove one recurring decision from the tool path it controls.

The `--no-verify` case is why I still separate memory from enforcement. When a pre-commit hook fails, bypassing it can look like the shortest path to finishing the task. A written instruction asks the agent to remember the rule while it is trying to remove the obstacle. A PreToolUse hook can deny that exact command. Keephive can record why the rule exists; Tripod can enforce the narrow boundary.

Tripod also packages skills for TDD, spec writing, debugging protocol, and security review. The hook set does not enforce those complete workflows.

Not every preference needs a hook. A tone preference can remain guidance because an occasional miss is cheap and a hard block would create its own friction. A command that moves another agent's uncommitted work out of the worktree deserves a stronger boundary. The consequence of one violation determines which layer should own the rule.

## Release Limits and Setup

Keephive v2.1.0 imports the POSIX-only `fcntl` module at the top of [`storage.py`](https://github.com/joryeugene/keephive/blob/a900149bde7a75d2aeb7b44b048e50ee884a72c7/src/keephive/storage.py). On native Windows, that import fails before a command can run. The CLI and MCP design are cross-agent, but this release is not cross-platform. The install below requires Python 3.13 or later on a supported Unix-like environment until that lock implementation has a Windows path.

```bash
# keephive: persistent memory and the verification loop described above
uv tool install 'keephive==2.1.0'
keephive setup

# tripod: Claude Code hooks and workflow skills
claude plugin marketplace add joryeugene/tripod
claude plugin install tripod
```

Tripod's two install commands are silent on both success and failure. Open a new Claude Code session and run `/update`; the skill checks marketplace registration, plugin installation, skill count, and hook count. The `uv tool install` version pin keeps Keephive aligned with the implementation described here. For later releases, use the setup instructions in both repositories because their interfaces can change.

## The Claim I Can Defend

Keephive already provides plain-file memory, project-aware context injection, explicit recall, and evidence records I can inspect. Tripod can deny a smaller set of Claude Code tool calls. I can show those mechanisms in source but have no elapsed-time result.

What I have not built yet is a knowledge base that checks its own truth. Until `UNCERTAIN` stays uncertain, corrections link old and new evidence, false-memory tests pass, and the Windows package runs, keephive is a memory sidecar with a verification loop in progress. Verified context becomes a moat only when the loop rejects bad context often enough to improve later decisions, and I have not measured that yet.

## Links
- keephive: [GitHub](https://github.com/joryeugene/keephive) | [PyPI](https://pypi.org/project/keephive/)
- tripod: [GitHub](https://github.com/joryeugene/tripod)
- [Previous: Protection Emerged. Verification Did Not.](../emergent-religion/index.html)
