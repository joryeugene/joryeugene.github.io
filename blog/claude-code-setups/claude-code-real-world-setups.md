# Terminal Setups for Claude's 10,000-Line Outputs

**Use one local fixture to test rendering, search, copy, scrollback, and recovery before changing your shell, terminal, or multiplexer.**

*By Jory Pestorious*

My setup is zsh, WezTerm, Zellij, LazyVim, lazygit, and yazi. It works, with one recurring defect: Claude's output flickers at the bottom of a Zellij pane inside WezTerm. The text still arrives, but the last lines jump while they render.

A long Claude response does not care which shell has the best defaults. I care whether the terminal renders every line, lets me find and copy the part I need, and preserves the session when the window or connection disappears.

## Run the 10,000-Line Test

Create a deterministic local file instead of asking Claude to generate the test. The local fixture keeps model and network latency out of the terminal comparison. Claude Code requires Node.js in this September 2025 setup, so the same runtime can generate and replay exactly 10,000 numbered lines:

```bash
node -e "for(let i=1;i<=10000;i++) console.log(String(i).padStart(5,'0')+' '+'.'.repeat(94))" > claude-output-10000.txt
node -e "process.stdout.write(require('fs').readFileSync('claude-output-10000.txt'))"
```

Run the second command in every terminal setup you are considering, with the same window size and scrollback limit. Keep a short record of the result, then check four things:

1. Search for line `07421` and jump back to the final line.
2. Copy several lines around `07421` without losing line breaks or selecting terminal chrome.
3. Resize the window and confirm that the text remains readable.
4. Close and restore the terminal, or detach and reattach the multiplexer, and record what survives.

If old lines disappear, increase the scrollback limit and repeat the test before changing applications. If the flicker appears only inside a multiplexer, compare the emulator alone with the emulator-plus-multiplexer stack. The failure belongs to the smallest combination that reproduces it.

The fixture does not measure Claude, reasoning quality, or developer productivity. It tests what the terminal receives: a fixed stream of text. Record the visible failure and the work needed to recover from it. If two setups pass the same checks, the test gives no reason to switch.

## Change the Layer That Failed

A terminal setup has three separate layers. Identifying the layer that owns a failure prevents a new shell from being blamed for an emulator or session problem.

- **Shell:** [bash](https://www.gnu.org/software/bash/), [zsh](https://www.zsh.org/), and [fish](https://fishshell.com/) control command syntax, completion, aliases, and scripts.
- **Terminal emulator:** VS Code, [Warp](https://www.warp.dev/), [iTerm2](https://iterm2.com/), [WezTerm](https://wezfurlong.org/wezterm/), and [Kitty](https://sw.kovidgoyal.net/kitty/) control rendering, search, selection, scrollback, tabs, and windows.
- **Multiplexer:** [tmux](https://github.com/tmux/tmux), [Zellij](https://zellij.dev/), and WezTerm's multiplexer control panes, detach and reattach behavior, and session organization.

Changing bash, zsh, or fish does not repair dropped scrollback or a rendering defect. A shell change is worth considering when its syntax, completion, or configuration is the problem. It also carries the largest compatibility cost because scripts and aliases can depend on shell behavior. Fish intentionally differs from POSIX shell syntax, while bash and zsh still have differences of their own.

The terminal emulator owns the 10,000-line display test. Do not assume an integrated terminal fails merely because it lives inside an editor. By September 2025, [VS Code can move a terminal into another window](https://github.com/microsoft/vscode-docs/blob/059ba913fd38c4c00885071cb717a67a0031569e/docs/terminal/basics.md#terminals-in-new-windows). It also documents [process reconnection and process revive](https://github.com/microsoft/vscode-docs/blob/059ba913fd38c4c00885071cb717a67a0031569e/docs/terminal/advanced.md#persistent-sessions), although revive relaunches the process rather than preserving its in-memory state. Run the same fixture in VS Code and a standalone terminal before deciding that separation changes anything you use.

I add a multiplexer when I need a session to outlive the terminal window or an SSH connection. Zellij gives me discoverable pane controls, but the Zellij and WezTerm combination produces the flicker I see with Claude output. That is an observation about my stack, not a result for every OS, GPU, or version.

## My Stack

I use zsh in WezTerm with Zellij. LazyVim is the editor, [lazygit](https://github.com/jesseduffield/lazygit) handles Git, and [yazi](https://github.com/sxyazi/yazi) handles file browsing. Those adjacent tools do not make WezTerm render faster. They stay because I know their controls and can keep Claude in a separate pane while I inspect changes.

The Zellij flicker is annoying, but it has not lost text or blocked recovery in my use. If that changes, I will reproduce the failure with the local fixture in bare WezTerm, then add Zellij and compare. That test can tell me which layer to replace. A general terminal ranking cannot.

## Claude Code 1.0.113

This article uses [Claude Code 1.0.113](https://www.npmjs.com/package/@anthropic-ai/claude-code/v/1.0.113), released two days before publication. Its command help supports continuing the latest session, selecting a saved session, starting in plan mode, and printing a noninteractive result:

```bash
claude --continue
claude --resume
claude --permission-mode plan
claude --print --output-format json "summarize the current test failures"
```

Plan mode is useful when I want Claude to inspect the repository and propose changes before editing. `--continue` and `--resume` recover Claude conversations; a multiplexer recovers a running terminal process. Those are different recovery paths, and one does not replace the other.

Version 1.0.113 [deprecates piped input in interactive mode](https://github.com/anthropics/claude-code/blob/c382eb800e102bb901f6701e14e9a928b947f4df/CHANGELOG.md#10113). Use `--print` for a deliberate pipe, and inspect the input first. Diffs, logs, profiles, and audit output can contain credentials, customer data, proprietary code, internal URLs, or instructions copied from an untrusted source.

```bash
git diff --no-ext-diff | claude --print --permission-mode plan "Review this diff. Do not edit files."
```

Run that command only in a trusted repository after checking the diff for material you are allowed to send. Claude Code's `--print` help also says that print mode skips the workspace trust dialog, so the directory choice is part of the safety check.

I do not use `! cd` to carry one conversation into another repository. The supported `--add-dir` option can grant access to another directory explicitly, but a new project can have different instructions, permissions, and data boundaries. Starting the session from the intended repository keeps those boundaries visible.

## When a Switch Is Worth It

Keep the current setup when it renders the fixture, preserves the text you need, and gives you a recovery path you understand. Adjust scrollback before replacing the emulator. Add tmux, Zellij, or another multiplexer when detach and reattach behavior solves a real remote or long-running-session problem. Change the shell only for a shell problem.

Switch the emulator when the same visible failure survives configuration changes and disappears in another emulator under the same test. That is enough evidence for a personal decision. It is not evidence that one terminal makes code better or developers faster. The flicker has not lost text or blocked recovery in my use, so I am keeping WezTerm and Zellij.
