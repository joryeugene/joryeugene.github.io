# Calmhive: Claude That Never Quits

**A CLI that makes Claude intelligent about usage limits, background processing, and real automation.**

*By Jory Pestorious | May 31, 2025*

> 🚀 **Now Available**: [npm](https://www.npmjs.com/package/@calmhive/calmhive-cli) | [GitHub](https://github.com/joryeugene/calmhive-cli) | [calmhive.com](https://calmhive.com)
> 💡 **Try Claude**: New to Claude? [Get started here](https://claude.ai/referral/rb3lQwQWDg) (affiliate link)

> *Building on the terminal-centric AI development concepts from my previous articles, I'm excited to announce Calmhive CLI - a missing piece that transforms Claude into a true development companion.*

![CalmBee - The friendly bee mascot representing persistent AI workflows that never quit](calmbee.png)
*CalmBee: Your tireless AI companion that keeps working even when you're away*

## The Problem: Claude CLI Isn't Enough

Claude Code CLI is revolutionary, but it has some fundamental gaps that break real-world workflows:

1. **Usage Limit Deaths**: Your overnight automation dies when you hit usage limits
2. **No Background Processing**: Can't run long tasks while you work on other things
3. **Repetitive Tool Setup**: Constantly approving the same 97 tools for every session
4. **No Process Management**: No way to monitor, pause, or resume long-running tasks
5. **Voice Wishlist**: Everyone wants "hey Claude" but there's no official solution

These aren't minor inconveniences--they're productivity killers that prevent Claude from being a true AI development partner.

## The Solution: Calmhive CLI

Calmhive wraps Claude Code with intelligent automation, adaptive retry, and proper process management. It's not a replacement--it's an amplifier that makes Claude work the way you always wished it would.

### 5 Simple Commands

```bash
# Interactive chat with all tools pre-approved
calmhive chat "help me debug this auth flow"

# Headless automation (actually headless)
calmhive run "create comprehensive test suite for the API"

# Background processing with adaptive retry
calmhive afk "refactor entire codebase for TypeScript" --iterations 25

# Voice control with speech recognition
calmhive voice  # Say "hey friend, create unit tests"

# Process management with beautiful TUI
calmhive tui    # Monitor all your AI sessions
```

## Quick Start: Get Running in 60 Seconds

```bash
# Install
npm install -g @calmhive/calmhive-cli

# Prerequisites check
claude --version  # Need Claude CLI Max/Pro/Teams for MCP tools

# Test it works
calmhive chat "hello"

# Try adaptive retry
calmhive afk "analyze this project structure" --iterations 3
```

**Requirements**:
- Node.js 18+
- [Claude CLI](https://docs.anthropic.com/en/docs/claude-cli) with Max/Pro/Teams subscription
- OpenAI API key (voice features only)

## Killer Features That Actually Matter

### 🔄 Adaptive Retry - The Game Changer

Ever had a perfect overnight automation die because of usage limits? Not anymore:

```
Iteration 10 ✓
⚠️ Claude Max usage limit reached
⏳ Usage limit likely hit. Waiting 1 minutes before retry...
⏰ Next retry at: 1:05:23 AM
🔄 Retrying iteration 10 after usage limit delay...
✅ Iteration 10 started!
```

Calmhive now properly detects "Claude Max usage limit reached" messages and waits with exponential backoff (30s → 1m → 2m → 4m → 8m → 16m → 32m → 60m max). Your long-running tasks complete even when hitting multiple usage limits!

### 🎙️ Voice Control - "Hey Friend"

Real speech recognition and text-to-speech using OpenAI's APIs:

```bash
calmhive voice
# Say "hey friend, create a React component for user profiles"
# Claude responds with voice and executes the task
```

Trigger words: "hey friend", "calmhive", "ok friend", "now friend"

### 🏃 AFK Iterative Sessions

```bash
# Start a long task and forget about it
calmhive afk "audit all dependencies for security issues" --iterations 20

# Check status anytime
calmhive afk status        # Compact view
calmhive afk status -d     # Detailed view

# Watch live progress
calmhive afk tail abc-123

# Stop a specific session (actually kills the process!)
calmhive afk stop abc-123

# Clean up any orphan Claude processes
calmhive afk killorphans

# Beautiful TUI for everything
calmhive tui
```

**V3 Process Management**: Every Claude process is tracked by PID, making stop commands actually work. No more orphan processes!

### 📊 97 MCP Tools Pre-Approved

No more clicking "approve" 97 times. Calmhive automatically provides access to:
- **Memento**: Knowledge graph for persistent insights
- **Sequential Thinking**: Structured problem-solving
- **Playwright**: Browser automation
- **GitHub/GitMCP**: Code research
- **OmniSearch**: Multi-engine research
- Plus 81 other safe MCP tools

## Architecture: How It Works (V3)

Calmhive V3 is built with enhanced reliability and process tracking:

```
calmhive/v3/
├── commands/           # 5 core commands + aliases
│   ├── chat (c)       # Interactive with full tools
│   ├── run (r)        # Headless automation
│   ├── afk (a)        # Background processing
│   ├── voice (v)      # Speech interface
│   └── tui (t)        # Process management
├── lib/
│   ├── adaptive-retry.js     # Enhanced usage limit handling
│   ├── process-manager.js    # PID tracking & orphan cleanup
│   ├── session-database.js   # SQLite with session persistence
│   ├── tool-manager.js       # 97 MCP tools management
│   └── tui/                  # Terminal UI components
│       ├── views/            # Session list, detail, logs
│       └── tui-manager.js    # Main TUI controller
└── config/
    └── allowed-tools.json    # Pre-approved MCP tools
```

**V3 Improvements**:
- Proper PID tracking for all Claude processes
- `killorphans` command to clean up stuck processes
- Better usage limit detection (not confused with context limits)
- Auto-compaction for context management
- Enhanced TUI with working stop/logs commands

### Key Design Principles

1. **Wrapper, Not Replacement**: Uses Claude CLI under the hood
2. **Separation of Concerns**: Clear distinction between interactive, single-run, and iterative modes
3. **State Management**: SQLite database tracks AFK sessions and iterations
4. **Fail-Safe Design**: Graceful handling of API limits, network issues, and interruptions

## Real-World Usage Examples

### Overnight Code Refactoring
```bash
calmhive afk "migrate entire React app to TypeScript with proper types" --iterations 30
# Runs overnight, automatically retries on usage limits
# Check progress: calmhive tui
```

### Voice-Driven Development
```bash
calmhive voice
# "hey friend, analyze the performance bottlenecks in the API"
# "now friend, create unit tests for the authentication service"
# "calmhive, refactor the database queries for better performance"
```

### Parallel Development Streams
```bash
# Terminal 1
calmhive afk "implement user authentication system" --iterations 15

# Terminal 2
calmhive afk "create comprehensive test suite" --iterations 10

# Terminal 3
calmhive tui  # Monitor both processes
```

### Pipeline Integration
```bash
# CI/CD friendly
calmhive run "audit security vulnerabilities and create report" > security-report.md

# Pipe input
cat error.log | calmhive run "analyze these errors and suggest fixes"
```


## Voice Control: "Hey Friend"

The voice system deserves special attention because it actually works:

### Features
- **Real Speech Recognition**: Uses industry-standard APIs, not browser hacks
- **Natural Trigger Words**: "hey friend", "calmhive", "ok friend", "now friend"
- **OpenAI TTS**: High-quality text-to-speech responses
- **Process Control**: Start AFK tasks, check status, stop processes by voice
- **Sound Effects**: 7 different audio cues for different events

### Voice Commands
```
"Hey friend, start a new task to implement user authentication"
"Tell me the status of my sessions"
"Stop the authentication task"
"Create an AFK task for 15 iterations to analyze the API"
```

### Setup
```bash
# Install uv package manager for Python dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh

# Set OpenAI API key
export OPENAI_API_KEY=your_key_here

# Test voice system
calmhive voice --test
```

## Installation & Setup

### Quick Install
```bash
npm install -g @calmhive/calmhive-cli
```

### MCP Tools Setup
The most powerful feature requires MCP tools. Easy setup:

1. **Install Claude Desktop** and configure MCP tools
2. **Import to CLI**: `claude mcp add-from-claude-desktop -s user`
3. **Verify**: `calmhive chat "test memento search"`

For detailed MCP setup, see my [Terminal Velocity guide](https://github.com/joryeugene/ai-dev-tooling/blob/main/blog/02-terminal-velocity.md#must-use-mcp-tools-amplify-your-ai).

### Requirements
- **Node.js 18+**
- **Claude CLI with Max/Pro/Teams**: MCP tools require subscription
- **OpenAI API key**: Voice features only (everything else works without it)

> **💡 Claude Max Advantage**: For serious automation work, Claude Max provides 5-20x higher rate limits than Pro, perfect for AFK sessions running 25+ iterations.

## Current Version: V3.0.19

The latest Calmhive V3 includes all the critical fixes users requested:

- ✅ **Proper Process Tracking**: Every Claude process tracked by PID
- ✅ **Working Stop Commands**: `afk stop` actually kills processes
- ✅ **Orphan Cleanup**: `afk killorphans` finds and terminates stuck processes
- ✅ **Fixed Usage Limit Detection**: Properly triggers exponential backoff on usage limits
- ✅ **Auto-Compaction**: Handles "Context low" automatically
- ✅ **Improved TUI**: All keyboard shortcuts work properly
- ✅ **Detailed Status View**: `afk status -d` shows full session information

## Pro Tips & Tricks

- **Large Prompts**: Use `calmhive afk "$(cat prompt.md)" -i 30`
- **CLAUDE.md Setup**: Create `~/.claude/CLAUDE.md` for persistent context across sessions
- **Continue After AFK**: Use `calmhive chat -c` to pick up context
- **Monitor Everything**: Keep `calmhive tui` open in a terminal
- **Clean Shutdown**: Always use `afk stop`, never Ctrl+C
- **Orphan Cleanup**: Run `calmhive afk killorphans` if processes get stuck

The goal isn't just productivity--it's creating an AI development environment that actually works reliably, every time.

## Try It Today

```bash
npm install -g @calmhive/calmhive-cli
calmhive chat "hello world"
```

Calmhive transforms Claude from a conversational tool into a true AI development partner. No more broken automations, no more usage limit deaths, no more repetitive tool approvals.

The terminal-centric AI future is here. **lets bee friends** 🐝

---

**Links:**
- [GitHub Repository](https://github.com/joryeugene/calmhive-cli)
- [npm Package](https://www.npmjs.com/package/@calmhive/calmhive-cli)
- [Architecture Guide](https://github.com/joryeugene/calmhive-cli/blob/main/docs/ARCHITECTURE.md)
- [Previous Article: Terminal Velocity](https://github.com/joryeugene/ai-dev-tooling/blob/main/blog/02-terminal-velocity.md)

*Questions? Issues? [Open a GitHub issue](https://github.com/joryeugene/calmhive-cli/issues)*
