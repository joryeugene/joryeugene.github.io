# AI-Amplified Development: Tools and Workflows for Modern Engineers
## Stop Coding Like It's 2024
### An AI-Amplified Dev Playbook
**By Jory Pestorious | April 15, 2025**

\#AIDevTooling

> "Colour is the keyboard, the eyes are the hammers, the soul is the piano with many strings."
> -- Vasily Kandinsky

---

## Why this playbook exists

> **We're entering what our CTO calls "the maelstrom," a time of extraordinary transformation in software development.**

The useful question is whether an engineer can finish a defined task faster without losing understanding, security, or review quality. A generated line count cannot answer it.

The April 2025 playbook organizes the available tools around that test.

---

## Three moves to try first

1. Give one bounded multi-file task to [Cursor Agent](https://docs.cursor.com/chat/overview), [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), or [Cline](https://github.com/cline/cline).
2. Use the [Model Context Protocol](https://modelcontextprotocol.io/introduction) when an agent needs a named external source or action. Review the server's permissions before connecting it.
3. Run independent work in separate Git worktrees only after one task has a clear acceptance check.

The first useful result matters more than the number of tools in the stack.

---

## The four goals: M.A.T.H.

1. **Master your codebase.** Use AI to inspect unfamiliar code, then verify the explanation against the repository.
2. **Accelerate with confidence.** Define the result before asking an agent to edit several files.
3. **Test and debug intelligently.** Keep logs, tests, browser checks, and a human decision at the end of the loop.
4. **Harness compute power.** Give repeatable work to machines and keep architecture, risk, and acceptance with people.

As simple as MATH. So, not simple.

---

## Context is an input, not a slogan

Give the agent the goal, relevant files, constraints, and acceptance checks. Keep reusable instructions in version-controlled files such as [llms.txt](https://llmstxt.org/) or tool-specific rules such as [Cursor rules](https://docs.cursor.com/context/rules-for-ai) and [Cline rules](https://docs.cline.bot/improving-your-prompting-skills/prompting).

The [llms.txt repository](https://github.com/AnswerDotAI/llms-txt), [Netlify AI Context](https://docs.netlify.com/welcome/build-with-ai/), and the [Kaggle prompt-engineering paper](https://www.kaggle.com/whitepaper-prompt-engineering) offer different ways to structure that input. None removes the need to inspect the result.

---

## Put safety beside the action

- Commit or create a clean branch before an agent edits files.
- Inspect the plan before a multi-file change.
- Review the diff, run the relevant checks, and stage only accepted changes.
- Do not send credentials, customer data, proprietary code, or private logs to a provider unless the transfer is authorized and its retention terms are acceptable.
- Treat authentication and authorization changes as specialist review work.

Git is a recovery tool, not proof that generated code is correct.

---

## Match each tool to one job

| Job | April 2025 options |
| --- | --- |
| Research and planning | [ChatGPT](https://chat.openai.com/), [Gemini](https://gemini.google.com/), [Perplexity](https://www.perplexity.ai/), [Claude](https://claude.ai/) |
| Terminal work | [Warp](https://www.warp.dev/), [Cursor Terminal](https://cursor.sh/blog/cursor-terminal), [Butterfish](https://github.com/charliermarsh/butterfish), [LazyGit](https://github.com/jesseduffield/lazygit) |
| Completion | [GitHub Copilot](https://github.com/features/copilot), [Cursor Tab](https://cursor.sh/blog/cursor-completions), [Supermaven](https://supermaven.com/) |
| Editors | [Cursor](https://cursor.sh/docs), [Zed](https://zed.dev/), [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim) |
| Multi-file agents | [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), [Cline](https://github.com/cline/cline), [Roo Code](https://github.com/RooVetGit/Roo-Code), [Windsurf](https://windsurf.com/editor), [Augment](https://augmentcode.com/), [Aider](https://github.com/paul-gauthier/aider), [RA.Aid](https://github.com/ai-christianson/RA.Aid) |

A product link identifies an option. It does not establish that the option is faster or better for your repository.

---

## The model list is a dated snapshot

- [Claude 3.7 Sonnet](https://www.anthropic.com/claude) supports an extended-thinking mode.
- [GPT-4.1](https://openai.com/index/gpt-4-1/) launched in the API on April 14 with support for up to one million tokens of context.
- [GPT-4o](https://chat.openai.com/) accepts text, image, and audio inputs.
- [Gemini 2.5 Pro](https://gemini.google.com/) accepts multimodal input and supports a long context window.

[SWE-bench](https://swebench.com/) measures repository-level work on a Python-heavy benchmark without settling which model will work best on a particular codebase.

---

## Compose terminal tools carefully

Claude Code 0.2.70 supports `-p` for non-interactive output, so a reviewed staged diff can become input to a one-shot command:

```sh
git diff --staged | claude -p "Review this diff. Report correctness risks and missing tests. Do not edit files."
```

Logs can be filtered the same way:

```sh
grep Exception error.log | claude -p "Group these errors by likely cause."
```

Before either command, check that the diff or log is authorized for the configured provider and contains no credentials, customer data, or proprietary material that must stay local.

---

## Make repeated prompts reproducible

A Make target can keep a reviewed prompt with the repository. The recipe must be one shell pipeline and begin with a tab:

```make
commit-msg:
	@git diff --staged | claude -p "Generate one concise commit message. Print only the message."
```

The target still sends the staged diff to the configured provider. Run it only when that transfer is allowed.

---

## MCP connects capabilities and permissions

An MCP server can expose data or actions to a client. Examples available to inspect include [Figma](https://github.com/GLips/Figma-Context-MCP), [Perplexity](https://github.com/tanigami/mcp-server-perplexity), [ArXiv](https://github.com/blazickjp/arxiv-mcp-server), [Memory Bank](https://github.com/alioshr/memory-bank-mcp), and [Micromanage](https://github.com/yodakeisuke/mcp-micromanage-your-agent).

The [community server list](https://github.com/punkpeye/awesome-mcp-servers) is a discovery index, not a security review. Check the exact server revision, credentials, data access, network access, and confirmation behavior before use.

---

## Parallel work needs separate state

[Git worktrees](https://git-scm.com/docs/git-worktree) give each branch a separate working directory. [VS Code workspaces](https://code.visualstudio.com/docs/editor/workspaces), [tmux](https://github.com/tmux/tmux), and [Zellij](https://github.com/zellij-org/zellij) can keep those work areas visible.

Use parallel agents only for tasks that can be reviewed independently. Shared files, shared databases, and overlapping migrations turn parallel work into merge and state risk.

[CrewAI](https://crewai.com/) and other orchestration frameworks can coordinate agents, but coordination does not replace task boundaries or acceptance checks.

---

## Keep input tools separate from coding claims

The presentation also lists tools for navigation and input:

- [Karabiner-Elements](https://karabiner-elements.pqrs.org/) for keyboard remapping
- [Homerow](https://www.homerow.app/) and [Tridactyl](https://tridactyl.xyz/) for keyboard-driven navigation
- [Wispr Flow](https://wisprflow.ai/) and [Espanso](https://espanso.org/) for text input
- [Zen Browser](https://zen-browser.app/) and [Replit](https://replit.com/) for browser workflows
- [Builder.io](https://www.builder.io/) for design-to-code workflows
- [Butterfish Neovim](https://github.com/charliermarsh/butterfish) and [claude.vim](https://github.com/pasky/claude.vim) for editor experiments

Input and navigation tools can remove a local interaction cost without proving that they improve software quality or team productivity.

---

## Quality tools have narrow jobs

- [Biome](https://biomejs.dev/) formats and lints supported source files.
- [Knip](https://github.com/webpro-nl/knip) finds unused files, dependencies, and exports in JavaScript and TypeScript projects.
- [GitHub Actions](https://github.com/features/actions), [GitLab CI](https://docs.gitlab.com/ee/ci/), and [Jenkins](https://www.jenkins.io/) run checks in repeatable environments.
- [Make](https://www.gnu.org/software/make/manual/make.html) records local commands and dependencies.

Formatting, linting, tests, and human review catch different failures. Passing one does not imply that the others passed.

---

## Measure a completed task, not generated volume

Choose one recurring task and record the baseline before changing the workflow:

| Measure | What to record |
| --- | --- |
| Completion | Accepted result versus rejected or abandoned result |
| Time | Start to accepted result, including review and rework |
| Quality | Relevant tests, defects found, and regressions after merge |
| Cost | Subscription or API cost attributable to the task |
| Understanding | Whether the reviewer can explain and safely modify the result |

Lines of code and pull-request counts can describe output volume. They do not measure productivity without comparable scope, acceptance, defects, review, and rework.

---

## One bounded workflow

1. Write the problem, constraints, and acceptance checks in the repository.
2. Use [Perplexity](https://www.perplexity.ai/) or [Claude](https://claude.ai/) for research only when the source material can be checked.
3. Refine the implementation plan in [Cursor](https://cursor.sh/docs).
4. Create a [Git worktree](https://git-scm.com/docs/git-worktree) for the task.
5. Let one agent implement the plan.
6. Review the diff, run the checks, and compare the result with the baseline task.

Add another agent only when this loop works once and the next task has independent state.

---

## Team adoption starts with boundaries

- Document the approved providers, repositories, data classes, and retention terms.
- Share prompts and commands only after they work on a real task.
- Let engineers opt into tools and report where review costs exceed the saved time.
- Compare completion time, defects, and rework instead of counting tool use.
- Use [Workhelix](https://www.workhelix.com/) or an internal measurement process only when the method and data access fit the team.

[n8n](https://n8n.io/) and [Make](https://www.make.com/) can make workflows visible, but a diagram does not establish that an automated step is safe.

---

## Four mnemonics, one workflow

**M.A.T.H.** keeps the goal on mastery, acceleration, testing, and compute.

**S.M.A.R.T.** covers shortcuts, maintained instructions, automation, rich context, and text input.

**V.I.T.A.L.** means verify outputs, include compliance, test the result, avoid abandoning fundamentals, and limit dependency.

**M.A.S.T.E.R. B.A.S.I.C.** keeps the longer checklist: master tools, automate repeated work, share proven workflows, test, enhance creativity, review, balance oversight, automate (yes, again!), start with a clear specification, iterate, and improve.

The names help recall the loop. The repository, checks, and reviewed result are the evidence.

---

## Current limits

- Context windows still constrain what a model can inspect at once.
- Rate limits can interrupt long tasks.
- Hidden prompts and token use make behavior harder to compare.
- Parallel work increases review and state-management costs.
- Generated changes can exceed a human reviewer's available attention.

Recovery starts with small tasks, visible state, source control, and checks that run without the model.

---

## What to keep when the tools change

The product list will age. The workflow should survive it:

1. Give the system authoritative context.
2. Bound its permissions and state.
3. Define the accepted result before execution.
4. Measure the full path through review and rework.
5. Keep enough code knowledge to debug the result without the agent.

> *"The future is already here - it's just not evenly distributed."* -- William Gibson

---

<div align="center">
<p><em>Presentation materials: <a href="https://github.com/joryeugene/ai-dev-tooling">github.com/joryeugene/ai-dev-tooling</a></em></p>

<p><strong>The maelstrom is upon us. Learning to pilot in it will define the next generation of Dev+.</strong></p>
</div>
