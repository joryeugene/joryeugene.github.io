# AI Engineers World Fair 2025: Takeaways & Spec
*San Francisco, June 2025*

## Foundation: Three Core Ideas

### 1. SPEC (Ideal State)
Living documentation that drives everything. Key shift: writing specifications that fully capture intent and values becomes the bottleneck, not coding.

*This thinking was heavily influenced by Sean Grove's keynote "The New Code" at the AI Engineer World Fair. Sean (from OpenAI) articulated how specifications are becoming the primary development artifact--an insight that crystallized this framework.*

**What it looks like:**
- Markdown files in version control
- [Google Docs](https://docs.google.com/) or [Notion](https://www.notion.so/) for collaboration
- [GitHub Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis) for team access

### 2. EXPOSURE (Reality)
What customers actually experience. Code is temporary; the spec is permanent.

**Key insight:** As foundational models improve, the same spec generates better implementations over time--across languages, frameworks, and paradigms.

**Spec becomes everything:**
- Source of truth for development
- Marketing materials generator
- Onboarding documentation
- Demo and content foundation

### 3. TASK DELTA (Work)
Continuous loop: evaluate SPEC ↔ PRODUCT, identify gaps, decompose into actionable tasks.

**Success = Educatability**: The teams that win are those constantly asking better questions, seeking more context, and learning from every iteration.

## What Matters Most: Context & Quality

**First-Class Citizens:**
- SPECS (markdown, version-controlled)
- Rules/Values (company principles)
- Prompt Banks (curated, effective prompts)

**Context Sources:**
- Customer feedback
- [Slack](https://slack.com/) conversations
- [Granola](https://www.granola.so/) transcripts
- Sketches, mockups ([Figma](https://www.figma.com/)), screenshots
- Bug reports and [Sentry](https://sentry.io/) logs

## Building Toward This Vision

**Parallelization Strategy:**

**Project-Level:**
- Multiple repo clones on different branches
- Git worktrees (multiple workspace instances)
- Containers (reliable environments)
- [1Password](https://1password.com/) secrets management

**Task-Level:**
- One agent generates code
- One agent works on tests
- One agent updates docs
- Start by coordinating through shared markdown files

**Tool Stack Reality:**

**Terminal-First:**
- [Claude Code CLI](https://github.com/anthropics/claude-code) (Pro/Max subscription)
- [OpenCode CLI](https://github.com/sst/opencode) + OpenRouter (multi-model)

**IDE-Integrated:**
- [Cursor](https://cursor.com/), [Windsurf](https://codeium.com/windsurf), [Zed](https://zed.dev/)
- [VS Code](https://code.visualstudio.com/) + [GitHub Copilot](https://copilot.github.com/)
- [Augment Code](https://augmentcode.com/) (massive codebase context)
- [Kilocode.ai](https://kilocode.ai/) (Roo/Cline alternative)

**Quality Philosophy:**

**Multi-Layer Detection:**
1. Static Analysis: Lints, type checking
2. Dynamic Testing: Unit/integration tests in sandboxes
3. AI Review: LLM-based code review against specs
4. Production Monitoring: Bug/log analysis

> Bug prevention > Bug squashing

## Getting Started

**Foundation:**
- Pick ONE AI tool and master it (terminal-based recommended)
- Start writing specs before code
- Set up parallel development (git worktrees or multiple clones)

**Growth:**
- Add memory systems (start with shared markdown)
- Build prompt banks and templates
- Create your first autonomous workflows

**Scale:**
- Container isolation for AI agents
- Context ingestion pipelines
- Team-wide knowledge sharing


## Critical Anti-Patterns to Avoid

### "AI Whisperer" Trap
- **Problem:** One person becomes the go-to for all AI tools
- **Solution:** Mandatory team rotation on AI experiments
- **Goal:** Distributed AI literacy across entire team

### Documentation Debt Explosion
- **Problem:** Code generation accelerates, documentation lags
- **Solution:** Documentation IS the spec--write structured communication first
- **Reality:** In a spec-first world, clear written communication becomes the core skill

### Review Bottleneck
- **Problem:** Human review becomes the constraint when AI generates code 10x faster
- **Solution:** Tiered review system--AI for patterns, humans for logic
- **Key practices:**
  - Batch similar changes for efficient review sessions
  - Focus human review on architecture decisions and business logic
  - Use AI to summarize large PRs before human review
- **Warning:** Don't let unreviewed code accumulate--technical debt compounds faster with AI

## Conference Hot Topics

- Eval platforms for prompt optimization ([Braintrust](https://www.braintrustdata.com/))
- Code review automation overload (market saturation)
- Safe spaces for AI agents ([Gitpod](https://gitpod.io/), containers)
- Memory systems and team-wide context platforms

### Memory Systems (Extremely Popular)
- Mimic human memory architectures
- Bridging conversation gaps with AI agents
- Start with shared markdown files (temporal, graph relational, vector... other types of memory you'll find need for depending on use cases)

### Missing Piece: Team-Wide AI Context Systems
**Problem:** MCP tools and AI context live on individual developer machines  
**Solution:** Centralized intelligence platforms where one integration benefits all

**Platform Comparison** (focusing on MCP support + team features):

**[Mem0 AI](https://mem0.ai)** - OpenMemory MCP ✓
- **GitHub**: 34k⭐ stars, announced OpenMemory MCP
- **Team power**: Memory layer for AI agents, local & secure
- **Best for**: Teams needing persistent memory across AI agents

**[n8n](https://n8n.io/)** - Strong MCP Support ✓
- **Pricing**: Self-hosted free, Cloud from $20/month
- **Team power**: Connect 400+ apps, trigger workflows from Claude/Cursor
- **Best for**: Teams wanting workflow automation with AI agents

**[Dify.ai](https://dify.ai/)** - Active MCP Development ✓
- **Pricing**: Open source free, Cloud from $59/month team plan
- **Team power**: Visual RAG builder, shared AI apps, version control
- **Best for**: Teams building AI apps on internal documents


## Reality Check: What Actually Matters

### Missing from Most AI Dev Discussions

**Human Bottlenecks > Tool Limitations**
- Context switching capacity remains the biggest constraint
- Parallelization helps but requires new mental models
- Best tools can't fix unclear specifications

**Cost Reality (June 2025)**
- API usage for heavy development: $50-200/day easily
- Subscription models create predictability
- Most teams see positive returns within weeks (shipping 3-5x faster outweighs tool costs)

**Security Blind Spots**
- AI agents with full file system access = nuclear option
- Container isolation isn't optional anymore
- Auth tokens in AI context = eventual breach


## Key Takeaway

In the AI era, teams that excel at building shared context and collective specifications will dominate. Success isn't about individual AI mastery--it's about raising the entire team's capability together through shared understanding and continuous learning.

## Final Insight: Specification as North Star

Future belongs to teams that rally around living specifications--documents that capture not just what to build, but why it matters. When documentation becomes the primary artifact, when every team member contributes to the spec, when AI amplifies collective intelligence rather than individual productivity--that's when sustainable velocity emerges.

**New engineering excellence:**
- Writing specifications so clear that both humans and AI execute flawlessly
- Creating context so rich that any team member can own any task
- Building review systems that elevate everyone's capabilities
- Maintaining educatability as a core team value

In 2025, your competitive advantage isn't keeping knowledge siloed--it's how fast your entire team learns, adapts, and ships quality together. Specification is your shared language. Clear communication is your superpower. Collective educatability is your moat.

## The Next Frontier

**From Collaboration to Federation**: While we're mastering team collaboration, the next wave involves cross-organizational AI agent cooperation--auth systems that trust each other, payment flows across boundaries, and deep orchestrations requiring formal agreements. Parallelization solved individual productivity. Collaboration solves team productivity. Federation could solve ecosystem productivity.
