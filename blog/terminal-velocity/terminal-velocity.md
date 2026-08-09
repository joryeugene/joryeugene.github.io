# Terminal Velocity: My CLI-First AI Workflow in 2025

*By Jory Pestorious | May 11, 2025*

> **August 2026 note:** Commands below are pinned to Claude Code 0.2.107. My later turn back toward the GUI is in [Why I Canceled Claude Max for Codex Desktop](/blog/portable-agent-factory/).

My earlier presentation, [Stop Coding Like It's 2024: An AI-Amplified Dev Playbook](/blog/ai-dev-tooling-presentation/), argues that AI belongs inside an engineer's existing tools. Claude Code makes that idea concrete for me. I can pipe a file or diff into the model, resume a session inside a repository, connect MCP servers, and run the same agent without waiting for an editor integration.

The appeal is not terminal aesthetics. The shell already connects processes, files, source control, and remote sessions. I can start with one agent in one repository, then add parallel work without replacing the rest of my setup.

## The Stack

My setup centers on [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), a terminal multiplexer, an editor, and a source-control view. I can swap among [WezTerm](https://wezfurlong.org/wezterm/), [Warp](https://www.warp.dev/), [Rio](https://github.com/raphamorim/rio), and [Kitty](https://sw.kovidgoyal.net/kitty/) without changing the rest of the workflow. [Zellij](https://zellij.dev/) and [Tmux](https://github.com/tmux/tmux) keep long-running sessions alive.

I edit in [Neovim](https://neovim.io/) and use [LazyGit](https://github.com/jesseduffield/lazygit), [Ripgrep](https://github.com/BurntSushi/ripgrep), and [FZF](https://github.com/junegunn/fzf) to inspect changes and find context. [Claude Desktop](https://claude.ai/download) and [Claude Mobile](https://www.anthropic.com/news/android-app) give me access outside the terminal.

I connect a small set of MCP servers when the task needs them. [Memento](https://github.com/gannonh/memento-mcp) stores entities and relations that the client explicitly writes to Neo4j, then exposes semantic search over them. [Sequential Thinking Tools](https://github.com/spences10/mcp-sequentialthinking-tools) adds a structured thought sequence with tool recommendations. [Context7](https://github.com/upstash/context7) retrieves library documentation, while [OmniSearch](https://github.com/spences10/mcp-omnisearch) connects several search providers.

I do not install an MCP server because its category sounds essential. I keep one when it supplies information or state the task needs. A long tool list creates more choices for the agent and more configuration for me.

## Claude Code 0.2.107 in the Shell

I build the workflow around a few commands:

```bash
# Install the version used in this article
npm install -g @anthropic-ai/claude-code@0.2.107
claude --version
# 0.2.107 (Claude Code)

# Import MCP servers from Claude Desktop
# This command supports macOS and Windows through WSL.
claude mcp add-from-claude-desktop --scope user

# Continue the latest session or choose an older one
claude -c
claude -r

# Give the model a file or an inspected diff
cat error.log | claude -p "Explain the failure and cite the relevant lines."
cat data.json | claude -p "Convert this JSON to CSV. Return only CSV." > data.converted.csv
git diff --staged | claude -p "Draft one concise commit message for this diff."

# Stream structured output for another process to consume
claude -p "Generate deployment steps" --output-format stream-json
```

The commit-message command only drafts text. Sending the response through `xargs git commit -m` can split it into arguments and treat later words as pathspecs. I review the message and the staged diff before committing.

The `claude_full` alias I wrote is too broad: it preapproves Bash, write access, search, and a long named list of MCP tools. Permission prompts are part of the safety boundary. I grant the smallest set of tools the current task needs, especially when the agent can change files or run shell commands.

## Instructions Stay in Plain Files

I use `CLAUDE.md` to give Claude Code the working sequence I want it to follow:

```markdown
# Working sequence

1. Search Memento for relevant project knowledge.
2. Plan the task before changing files.
3. Check current library documentation when an API is uncertain.
4. Run the repository's checks after editing.
5. Store only reusable findings, with enough context to correct them later.
```

Claude Code loads a global file from `~/.claude/CLAUDE.md`, repository instructions from `./CLAUDE.md`, and more specific files from nested directories. I use `CLAUDE.local.md` for project instructions that should stay on my machine. The `/memory` command opens the persistent instruction files. `/compact` reduces an older conversation when its context grows too large.

`~/.claude.json` is configuration and account state, not a backup of the entire setup. Project transcripts live separately under `~/.claude/projects`, so copying one configuration file does not restore every conversation. The file can also contain account data and does not belong in a casual backup recipe.

MCP tool names such as `mcp__memento__semantic_search` are real, but hand-written XML is not Claude Code's MCP interface. Claude Code registers the tool schemas and handles the calls. An emoji or confirmation phrase is still prompt text, not a protocol or proof that the tool ran. Stable rules work better for me when they stay near the repository, name the action the agent should take, and give it a result it can verify.

## Review Before Parallelism

An agent often changes the right code alongside edits I do not want. A stage view lets me accept a line or hunk without taking the whole diff. I use LazyGit most often, while [GitKraken](https://www.gitkraken.com/) and [SourceTree](https://www.sourcetreeapp.com/) provide the same kind of selective review. [Jujutsu](https://github.com/jj-vcs/jj) and [GitButler](https://github.com/gitbutlerapp/gitbutler) treat undo and parallel work differently, but I still need to inspect the result.

Git worktrees give each agent an isolated directory and branch without cloning the repository history again:

```bash
git clone git@github.com:user/project.git
cd project

git worktree add ../project-feature -b feature/new-feature main
git worktree add ../project-bugfix -b bugfix/critical-issue main
git worktree list
```

I can run one Claude Code session in each directory, compare the approaches, and discard a branch that fails. Worktrees do not prove that the agents are productive, and parallel output can create more review and merge work. They provide clean isolation so I can decide after seeing the code.

If worktrees feel unfamiliar, separate full clones still keep each agent in a different directory. They cost more disk space but make the boundary obvious.

## Background Work Needs Stronger Guards

I routinely run three or more Claude processes overnight, so I want them to continue while I am away from the terminal. The shell loop is not safe for someone else to copy. Claude Code 0.2.107 has no root `-t` template option. Appending `&` returns control to the shell, but it does not by itself keep a job alive after the terminal or login session closes.

Tmux and Zellij already solve the session-lifetime problem. An unattended run also needs an isolated worktree, narrow permissions, bounded iterations, recorded output, exit-code checks, repository tests, and a notification that brings me back for review. A predictable lock file under `/tmp`, a reused process ID, or a next task extracted from unvalidated log text is not enough.

## Prompts That Work for Me

The prompt pattern I keep using names the task, the allowed tools, the success check, and what to do after a failure. Large tool lists create irrelevant choices. A request to "reflect" does little unless it points back to a test, diff, log, or another result the agent can inspect.

These are working observations from my own runs, not evidence for exact percentage gains or one optimal tool count. Explicit checks and recovery instructions still make those runs easier to review.

## Other Agents and a Fixed-Cost Subscription

I am also watching [RA.Aid](https://github.com/ai-christianson/RA.Aid), the [Augment SWE-bench agent](https://github.com/augmentcode/augment-swebench-agent), and [SWE-agent](https://github.com/SWE-agent/SWE-agent). The Augment repository reports 65.4 percent on SWE-bench Verified with an ensemble of Claude 3.7 Sonnet and OpenAI o1. The three projects target different jobs, so I cannot rank their MCP support from the benchmark.

[Claude Max costs $100 per month for the 5x tier and $200 for 20x](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), and [Claude Code now accepts Max access](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md). I like paying a fixed subscription while I experiment instead of watching API charges accumulate. The exact number of messages depends on prompt length, context, attachments, model, and tool use, so a fixed message-count table would promise precision the plans do not provide.

## Where the GUI Helps

I do not treat the terminal and IDE as opposing choices. [Cursor](https://cursor.com/) and [Windsurf](https://windsurf.com/editor) give me a unified project view with less setup. The shell gives me composition and isolation. Each surface solves a different part of the workflow.

[Claude Squad](https://github.com/smtg-ai/claude-squad) combines worktrees with terminal sessions for people beginning to explore parallel agents. It reduces worktree and session setup, though parallel runs still need the review and isolation rules above.

## What I Am Building Next

I am prototyping a federation protocol for distributing tasks, a reusable set of safer AFK templates, and better recovery for unattended runs. The CLI-first workflow remains composable/inspectable: plain files carry instructions, pipes move data, stage views expose changes, worktrees isolate experiments, and persistent sessions keep a process alive without hiding it.

That is why I keep the center of the workflow in the terminal. I can add another agent or tool without surrendering the pieces I already trust.
