# I Wanted to Own the Harness. Then Codex Desktop Won.

**By Jory Pestorious | August 9, 2026**

![A cartoon developer using Codex across desktop and phone while down-eared Georgie floats beside the screens](codex-desktop-won.png)

I had a different article staged for this URL.

It was called “Own the Harness, Rent the Intelligence.” Models will come and go, it argued, but the tools and rules around them should belong to you. Keep that layer portable and no subscription can own the way you work.

I still believe that. The embarrassing part is that I had stopped living that way before I finished the piece.

I had canceled [Claude Max](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), which would have sounded impossible a few months earlier.

I was a diehard [Claude Code](https://code.claude.com/docs/en/overview) fanboy. Each new feature sent me into another Anthropic rabbit hole, from managed-agent [“dreaming”](https://www.anthropic.com/engineering/managed-agents) to the [J-space paper](https://www.anthropic.com/research/global-workspace). I kept imagining what the next hook, agent mode, or memory idea might make possible. I was rooting for Claude.

Then I kept opening [Codex Desktop](https://learn.chatgpt.com/docs/app) instead.

Codex became the window I never closed. My work sat in visible tasks instead of terminal sessions I had to remember. Remote setup took a QR code. I could talk through an idea, pick up the work from my phone, and let a scheduled task return to the conversation where it began.

A little animated dog floated near the edge of my screen and told me when something needed me. I liked it enough to start building [a custom version of Georgie, my Phalène](https://github.com/joryeugene/georgie-phalene-codex-pet).

I stopped thinking about the setup. That was the switch. I had been counting control when the thing I wanted back was my attention.

## I Was Optimizing the Exit

This was also a public reversal. [Terminal Velocity](/blog/terminal-velocity/) argued that a terminal-first workflow raised the ceiling. Then I built [Calmhive](/blog/calmhive/) around Claude Code background jobs, voice, process control, and a TUI. I had been building toward more terminal, not less.

Claude Code gave me a real reason to care about portability. It was excellent, but the skills, commands, hooks, and habits I built around it did not travel cleanly. An instruction file may copy to a new agent while its behavior does not. The new harness has different tools, permissions, and ideas about what the instruction means.

I run [Oh My Pi](https://github.com/can1357/oh-my-pi), or OMP, with [Codex OAuth](https://github.com/can1357/oh-my-pi/blob/main/docs/providers.md). The same [ChatGPT subscription](https://chatgpt.com/pricing/) works in Codex Desktop and the terminal without a separate per-token API bill. I also use [DeepSeek V4 Pro and Flash through my OpenCode Go plan](https://opencode.ai/docs/go/).

Claude Max never gave Pi the same clean subscription path. [Anthropic directs third-party tools toward API keys or usage credits](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account). That made canceling easier. My rules still live in plain files that work across Codex and OMP.

What I got wrong was making portability the goal. Portability is insurance.

I've built the rest myself more than once. One version combined a terminal harness, a provider, [MCP servers](https://modelcontextprotocol.io/), an editor bridge, remote access, a scheduler, notifications, voice, and glue. The parts worked.

Then the seams became my job. A task started in one tool could not see the context in another. An update broke a path I had forgotten was fragile. The pieces worked, but keeping them connected became its own project. “You can build it yourself” is true in the same way that “you can change your own oil” is true. The missing number is what I wanted to do with that Saturday.

The old draft called integration a convenience. Now that looks backward. I use the integrated parts every day and reach for the extra control when something breaks.

## Don't Believe the Hype

A polished launch post makes the first reaction easy: good ideas, I should try this. The useful question is harder: which idea is new, where is it in the code, and what did it beat?

Take [Prime Agent](https://www.primeintellect.ai/blog/prime-agent). I love Prime Intellect's design, and the codebase is serious. The persistent IPython kernel, asynchronous child sessions, editable state, and rollback path are real. But “self-improving RLM agent” bundles several different claims.

[Recursive Language Models](https://arxiv.org/abs/2512.24601) did not come from Google. Alex Zhang, Tim Kraska, and Omar Khattab introduced them at MIT CSAIL. An RLM is also more than a grand name for subagents: it puts long input in an external environment, lets the model inspect and slice it with code, then makes model calls over selected pieces. On the paper's long-context tasks, that mechanism beat Claude Code by a median of 13 percent at comparable cost.

That is evidence for the paper, not automatically for Prime Agent. Prime's [`rlm()` bridge](https://github.com/PrimeIntellect-ai/prime-agent/blob/a18809e00ea30638584d87b3afea7285a9d7296c/prime-agent-runtime/src/rlm/__init__.py) spawns a child session and returns its handle. The default recursion depth is one, although the user can raise it. At that depth, much of the orchestration overlaps with the task agents I already use. The persistent Python environment is the more interesting difference.

The memory claim needs the same separation. Prime cites the [Continual Harness paper](https://arxiv.org/abs/2605.09998), not [Meta-Harness](https://arxiv.org/abs/2603.28052). Its `/refine` path asks a model to create, update, or delete prompt notes, memories, skills, and subagent definitions stored in JSON. It supports versions and rollback. But the [implementation](https://github.com/PrimeIntellect-ai/prime-agent/blob/a18809e00ea30638584d87b3afea7285a9d7296c/packages/coding-agent/src/core/refinement/refinement.ts) writes the model's `expectedOutcome` into a field named `outcome`. It does not run a before-and-after evaluation there. Saving a lesson is useful. It does not prove the lesson helped, retrieve the right memory later, or catch a confident memory that is wrong.

Meta-Harness is closer to that bar. It generates executable harness candidates, runs them, and lets the proposer inspect the code, scores, and traces from earlier attempts. On text classification, it beat a state-of-the-art context manager by 7.7 points while using four times fewer context tokens. Its task-specific state still resets between tasks. That is measured harness search. It is not the same mechanism as Prime's `/refine`.

The tools that have changed my work are easier to explain. In its own [agentic benchmark](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/benchmarks/results/2026-06-18-agentic.md), [Ponytail](https://github.com/DietrichGebert/ponytail) cut source code by 54 percent across twelve Haiku 4.5 feature tasks and passed all twenty adversarial safety runs. It also used 22 percent fewer tokens, cost 20 percent less, and finished 27 percent faster. Its large wins came when a native HTML input replaced hundreds of custom lines. On irreducible backend work, it barely changed anything. The mechanism is visible in the diff.

[Caveman](https://github.com/JuliusBrussee/caveman) looks smaller once someone else measures the coding workload. A [JetBrains test across 86 tasks](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/) found 8.5 percent fewer output tokens with no statistically detectable quality change, not the 65 percent seen on chat-style prose. That still matters because each reply becomes part of the next turn's context. It is a modest gain with a receipt, not a new reasoning paradigm.

[OMP's source](https://github.com/can1357/oh-my-pi) shows why it matters to me without a grand benchmark. It implements [ChatGPT OAuth](https://github.com/can1357/oh-my-pi/blob/45e12e5bb758198a920c6070e7e64cb33b21beac/packages/ai/src/registry/oauth/openai-codex.ts), [OpenCode Go credentials](https://github.com/can1357/oh-my-pi/blob/45e12e5bb758198a920c6070e7e64cb33b21beac/packages/ai/src/registry/oauth/opencode.ts), provider routing, extensions, and task agents with a default recursion depth of two. It also gives the agent the parts of an IDE I would otherwise have to bolt on: [LSP runs through writes and renames](https://github.com/can1357/oh-my-pi/blob/45e12e5bb758198a920c6070e7e64cb33b21beac/packages/coding-agent/src/lsp/tool.ts), [DAP drives a real debugger](https://github.com/can1357/oh-my-pi/blob/45e12e5bb758198a920c6070e7e64cb33b21beac/packages/coding-agent/src/dap/session.ts), and [subagents work in isolated worktrees](https://github.com/can1357/oh-my-pi/blob/45e12e5bb758198a920c6070e7e64cb33b21beac/packages/coding-agent/src/task/isolation-runner.ts) before returning structured results.

Those features close failures I can see: broken imports after a rename, print-statement debugging, and sibling agents colliding in one tree. I can use the same subscriptions, models, and rules from the desktop or terminal, then send work to those child agents. I use that every day.

That is the bar now: the same model, provider, repository, task, context, and budget. If a new harness cannot beat Codex Desktop and OMP there, I can admire it without moving into it.

## I Kept Reaching for the Same App

My last article had already caught the turn: [the CLI won execution, but the GUI was returning for management, verification, and taste](/blog/ai-engineer-verification/#interfaces-acp-and-the-agent-browser). I thought I was describing the market. I was describing my next move.

The desktop app keeps parallel tasks, local files, browser work, tools, and long-running jobs in one place. I can see what is happening without rebuilding the story from tabs and shell history.

[Codex Remote](https://learn.chatgpt.com/docs/remote) surprised me. I connected my Windows machine by scanning a QR code. From my phone I can start work, check progress, approve an action, change direction, and review the result. Remote control went from an infrastructure project to another view of the task on my desk.

[Twelve Keyboards Later](/blog/endgame-keyboard/) ended with voice as the other input endgame. [Codex Voice](https://learn.chatgpt.com/docs/features/voice) put that layer inside the agent. I can talk until an idea has shape, interrupt when the answer drifts, and send the work into separate tasks before the thought goes cold.

Codex Desktop is also how I orchestrate the OMP CLI. From my phone, I can send work to the terminal on my Windows machine and steer it by voice while I am outside or in the bath. That is what the GUI changed: the TUI can keep running without keeping me at the terminal.

[Scheduled tasks](https://learn.chatgpt.com/docs/automations) return to the conversations, context, and tools that gave them meaning. Automation no longer lives in a separate cron-shaped world.

Each feature removed a job I had been doing around the agent: remember, reconnect, re-explain, check. I was choosing the place where the work stayed together.

## The Setup I Actually Use

Claude Max is gone. My rules still travel, I can still swap providers, and OMP is one voice instruction away. Codex Desktop stays open, with Georgie at the edge of the screen until something needs me.

Codex did not win by giving me more control. It won by asking for less of my attention.
