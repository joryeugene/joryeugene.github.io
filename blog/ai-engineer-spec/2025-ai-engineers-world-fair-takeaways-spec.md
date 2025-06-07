# AI Engineers World Fair 2025: Takeaways & Spec

## The Foundation: Three Core Ideas

### 1. SPEC (The Ideal State)
The living documentation that drives everything. The shift: writing specifications that fully capture intent and values becomes the bottleneck, not coding.

**What it looks like:**
- Markdown files in version control
- [Google Docs](https://docs.google.com/) or [Notion](https://www.notion.so/) for collaboration
- [GitHub Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis) for team access

### 2. EXPOSURE (The Reality)
What customers actually experience. Code is temporary; the spec is permanent.

**Key insight:** As foundational models improve, the same spec generates better implementations over time—across languages, frameworks, and paradigms.

**The spec becomes everything:**
- Source of truth for development
- Marketing materials generator
- Onboarding documentation
- Demo and content foundation

### 3. TASK DELTA (The Work)
The continuous loop: evaluate SPEC ↔ PRODUCT, identify gaps, decompose into actionable tasks.

## Development Spec Emerging

**Context Ingestion Excellence:**

**First-Class Citizens:**
- SPECS (markdown, version-controlled)
- Rules/Values (company principles)
- Prompt Banks (curated, effective prompts)

**Context Sources:**
- Customer feedback
- Slack conversations
- [Granola](https://www.granola.so/) transcripts
- Sketches, mockups, screenshots
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
- [Cursor](https://cursor.com/), [Windsurf](https://codeium.com/windsurf)
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

## Implementation Approach

### Stage 1 - Foundation
- Audit current tool stack
- Establish SPEC-first workflow and values
- Set up parallel development
- Create prompt bank

### Stage 2 - Acceleration
- A core agent interface for orchestrating workflows and/or other agents
	- Personalized, responsive, ambient
- Establish feedback loops, command and tool libraries, rules
- Create template library

### Stage 3 - Integration
- Build context ingestion pipeline
	- Establish quality metrics
	- Clean data
- Expand AI orchestration
- Deploy [Dagger.io](https://dagger.io/) or container environments
- Durability: [Temporal.io](https://temporal.io/)

## Most Important Success Indicator

**Educatability** (based on Leslie Valiant's research)
- Asking better questions
- Seeking more sources and context
- Sharing in sculpting the SPEC
- Improving the output to client/market
- High-quality communication
- Learning from every iteration

## Critical Anti-Patterns to Avoid

### The "AI Whisperer" Trap
- **Problem:** One person becomes the go-to for all AI tools
- **Solution:** Mandatory team rotation on AI experiments
- **Goal:** Distributed AI literacy across entire team

**Documentation Debt Explosion**
- **Problem:** Code generation accelerates, documentation lags
- **Solution:** Documentation IS the spec—write structured communication first
- **Reality:** In a spec-first world, clear written communication becomes the core skill

**The Review Bottleneck**
- **Problem:** Human review becomes the constraint
- **Solution:** Tiered review system—AI for patterns, humans for logic

**Conference Hot Topics:**
- Eval platforms for prompt optimization ([Braintrust](https://www.braintrustdata.com/))
- Code review automation overload (market saturation)
- Safe spaces for AI agents ([Gitpod](https://gitpod.io/), containers)
- Memory systems and team-wide context platforms

### Memory Systems (Extremely Popular)
- Mimic human memory architectures
- Bridging conversation gaps with AI agents
- Start with shared markdown files (temporal, graph relational, vector... other types of memory you'll find need for depending on use cases)

### The Missing Piece: Team-Wide AI Context Systems
**The Problem:** MCP tools and AI context live on individual developer machines
**The Solution:** Centralized intelligence platforms where one integration benefits all

**Leading Options for Shared Context** (none of these were represented at the conference—the AI infra on display was underwhelming):
- **[Dify.ai](https://dify.ai/)**: Visual RAG builder, production-ready workflows
- **[Kestra](https://kestra.io/)**: Code-first orchestration, Git-native approach
- **[n8n](https://n8n.io/)**: Self-hosted automation with AI capabilities
- **[Dust.tt](https://dust.tt/)**: Team-focused, fastest deployment
- **[Latenode](https://latenode.com/)**: AI-driven with custom JavaScript flexibility

The integration platform space is getting crowded, with foundational models increasingly building these features directly into their tools (see Claude Desktop). Team context and auth/authorization remain critical challenges.

## The Next Frontier: From Collaboration to Federation

**Current State - Collaboration:**
- Teams working together within organizations
- Shared tools and workflows
- Common repositories and standards

**Emerging Need - Federation:**
- Cross-organizational AI agent cooperation
- Auth systems that trust each other
- Payment flows across boundaries
- Deep orchestrations requiring formal agreements

**Why This Matters:**
Parallelization solved individual productivity. Collaboration solved team productivity. Federation will solve ecosystem productivity.

## The Reality Check: What Actually Matters

### Missing from Most AI Dev Discussions

**Human Bottlenecks > Tool Limitations**
- Context switching capacity remains the biggest constraint
- Parallelization helps but requires new mental models
- The best tools can't fix unclear specifications

**Cost Reality (May 2025)**
- API usage for heavy development: $50-200/day easily
- Subscription models create predictability
- ROI positive within weeks for most teams

**Security Blind Spots**
- AI agents with full file system access = nuclear option
- Container isolation isn't optional anymore
- Auth tokens in AI context = eventual breach

### The 90-Day Transformation Path

**Days 1-30: Foundation**
- Pick ONE terminal-based AI tool and master it
- Start writing specs before code
- Set up basic parallelization (even just multiple clones)

**Days 31-60: Acceleration**
- Add memory systems (start with markdown)
- Implement container isolation
- Build your first AFK workflows

**Days 61-90: Integration**
- Connect context sources
- Measure actual productivity gains
- Share learnings with team

## Key Takeaway

In the AI era, teams that excel at building shared context and collective specifications will dominate. Success isn't about individual AI mastery—it's about raising the entire team's capability together through shared understanding and continuous learning.

## Final Insight: The Specification as North Star

The future belongs to teams that rally around living specifications—documents that capture not just what to build, but why it matters. When documentation becomes the primary artifact, when every team member contributes to the spec, when AI amplifies collective intelligence rather than individual productivity—that's when sustainable velocity emerges.

**The new engineering excellence:**
- Writing specifications so clear that both humans and AI execute flawlessly
- Creating context so rich that any team member can own any task
- Building review systems that elevate everyone's capabilities
- Maintaining educatability as a core team value

In 2025, your competitive advantage isn't keeping knowledge siloed—it's how fast your entire team learns, adapts, and ships quality together. The specification is your shared language. Clear communication is your superpower. Collective educatability is your moat.
