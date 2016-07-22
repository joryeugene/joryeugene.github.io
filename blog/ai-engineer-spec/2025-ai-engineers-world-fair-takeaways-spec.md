# AI Engineer World's Fair 2025: Takeaways & Spec
*By Jory Pestorious | San Francisco, June 2025*

Your AI can write 10,000 lines of code per hour. So can your competitor's. The models aren't the differentiator anymore--everyone has access to the same frontier capabilities. What happens when code becomes a commodity?

At this year's AI Engineer World's Fair, we found our answer: engineering excellence = articulation excellence. The bottleneck is no longer implementation--it's imagination, specification, and the ability to articulate exactly what should exist. This isn't just about engineers. Product managers, lawmakers, architects, designers--anyone who shapes systems now faces the same truth: clear thinking beats fast typing. And the teams winning have fundamentally reimagined their development process around this principle.

## Foundation: Three Core Ideas

### 1. SPEC (Ideal State)
Key shift: writing specifications that fully capture intent and values becomes the bottleneck, not coding.

*This thinking was heavily influenced by Sean Grove's keynote "The New Code" at the AI Engineer World's Fair. Sean (from OpenAI) articulated how specifications are becoming the primary development artifact--an insight that crystallized this framework.*

**What it looks like:**
- Markdown files in version control
- [Google Docs](https://docs.google.com/) / [Notion](https://www.notion.so/) for collaboration
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

**Success = Educatability**: Teams win by constantly asking better questions and learning from every iteration. Learn from your LLMs, don't just use them. Use the tools, don't let the tools use you.

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

**Critical:** Share, sync, and consolidate context. One source of truth > scattered documents.

## Building Toward This Vision

### Parallelization Strategy

**Project-Level:**
- Multiple repo clones on different branches
- Git worktrees for multiple workspace instances
- Containers (reliable environments)
- [1Password](https://1password.com/) secrets management

**Task-Level:**
- One agent generates code
- One agent works on tests
- One agent updates docs
- Start by coordinating through shared markdown files

### Tool Stack Reality

**Terminal-First:**
- [Claude Code CLI](https://github.com/anthropics/claude-code) - Pro/Max subscription
- [Goose CLI](https://github.com/block/goose) + [OpenRouter](https://openrouter.ai/) - autonomous agent, multi-model
- *Up & coming*: [OpenCode CLI](https://github.com/sst/opencode)

**IDEs - The Good:**
- [VS Code](https://code.visualstudio.com/) - tried and true, massive extension ecosystem
- [Zed](https://zed.dev/) - Rust-powered, blazing fast, native vim mode

**IDEs - The Fancy (VS Code forks):**
- [Cursor](https://cursor.com/), [Windsurf](https://codeium.com/windsurf)

**Extensions:**
- [GitHub Copilot](https://copilot.github.com/) - enterprise standard
- [Augment Code](https://augmentcode.com/) - context engine for massive codebases
- [Kilocode.ai](https://kilocode.ai/) - transparent usage pricing (Cline/Roo alternative)

### Quality Philosophy

**Multi-Layer Detection:**
1. Static Analysis - lints, type checking
2. Dynamic Testing - sandboxed unit/integration tests
3. AI Review - LLM validation against specs
4. Production Monitoring - automated bug/log analysis
5. User Feedback Loops - rapid iteration based on actual usage

> Bug prevention > Bug squashing

## Getting Started

**Foundation:**
- Pick ONE AI tool and master it - terminal-based recommended
- Write specs before code
- Source control mastery and parallel development setup: git worktrees, multiple repos... or maybe even learn Jujutsu (jj)

**Growth:**
- Add memory systems (start with shared markdown)
- Build prompt banks and templates
- Create your first autonomous workflows

**Scale:**
- Context ingestion pipelines
- Team-wide knowledge sharing
- Container isolation for AI agents

## Critical Anti-Patterns to Avoid

As teams adopt AI-driven development, new failure modes emerge:

### "AI Whisperer" Trap
- **Problem:** One person becomes the go-to for all AI tools
- **Solution:** Mandatory team rotation on AI experiments
- **Goal:** Distributed AI literacy across entire team

### Documentation Debt Explosion
- **Problem:** Code generation accelerates, documentation lags
- **Solution:** Documentation IS the spec - write it first
- **Reality:** In a spec-first world, clear written communication becomes the core skill

### Review Bottleneck
- **Problem:** Human review becomes the constraint when AI generates code 7.5x faster
- **Solution:** Tiered review - AI for patterns, humans for logic
- **Key practices:**
  - Batch similar changes for efficient review sessions
  - Focus human review on architecture decisions and business logic
  - Use AI to summarize large PRs before human review
- **Warning:** Don't let unreviewed code accumulate--technical debt compounds faster with AI

## Conference Hot Topics

The ecosystem is exploding with tools, but quality varies wildly:

- Eval platforms for prompt optimization: enterprise-ready ([Braintrust](https://www.braintrustdata.com/)), open-source leader ([Langfuse](https://langfuse.com/)), standards-based ([Traceloop](https://www.traceloop.com/))
- Code review automation overload: behavior-focused ([Baz](https://baz.co/)), speed-focused ([CodeRabbit](https://www.coderabbit.ai/)), workflow-focused ([Graphite](https://graphite.dev/)), quality-focused ([Qodo Merge](https://www.qodo.ai/products/qodo-merge/))
  - **Reality check**: These platforms can be expensive vs simpler alternatives like Claude Code GitHub app or automated pre-commit hooks
  - Each has special sauce, but cost-benefit analysis is crucial
- Safe spaces for AI agents ([Gitpod](https://gitpod.io/), containers)
- Memory systems and team-wide context platforms
- Creative evaluation methods (*See Simon Willison's ["The Last Six Months in LLMs, Illustrated by Pelicans on Bicycles"](https://simonwillison.net/2025/Jun/6/six-months-in-llms/) for an innovative approach to model evaluation through creative benchmarks*)

### The WiFi Reality Check
What happens when conference WiFi crashes? Workshop presenters learned the hard way--always have failbacks. Local models aren't just nice-to-have anymore. Ollama, LM Studio, and MLX models running on your MacBook Pro are getting surprisingly good. Don't lean 100% on cloud AI without a backup plan.

> The real lesson: learn HOW these tools think, not just WHAT they output. Study the patterns, understand the reasoning, apply the methods. That knowledge stays with you when the API goes down.

### Memory Systems (Extremely Popular)
- Mimic human memory architectures
- Bridging conversation gaps with AI agents
- **Start simple**: As foundational models get smarter, they can coordinate through shared markdown files
- **Scale as needed**: More structured approaches become useful for specific use cases:
  - **Temporal memory**: For time-based context and history
  - **Semantic search**: Through vector embeddings of your knowledge base
  - **Graph relationships**: For complex entity connections

### Missing Piece: Team-Wide AI Context Systems
- **Problem:** MCP tools and AI context live on individual developer machines
- **Solution:** Centralized intelligence platforms where one integration benefits all

**Platform Comparison** (focusing on MCP support + team features):

**[Mem0 AI](https://mem0.ai)** - OpenMemory MCP ✓
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

### The Next Frontier: Cross-Organization Federation

While we're mastering team collaboration, the next wave involves cross-organizational AI agent cooperation.

**Example**: A bank's compliance agent detects suspicious activity patterns. It securely federates with:
- Customer's accounting AI to verify legitimate business expenses
- Merchant's inventory agent to confirm supply chain movements
- Regulatory reporting agents to file real-time compliance updates

Each agent maintains its organization's data sovereignty while sharing just enough context to prevent fraud without exposing sensitive internals. Auth tokens expire after specific workflows. Audit trails span organizations. Legal agreements are encoded in the agent handshakes.

> Parallelization solves individual productivity. Collaboration solves team productivity. Federation could solve ecosystem productivity--turning entire industries into coordinated, intelligent networks.

## Reality Check: What Actually Matters

Beyond the hype, three uncomfortable truths emerged:

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
- Auth tokens in AI context => eventual breach

## Final Insight: Specification as North Star

The future belongs to teams that rally around living specifications. When documentation becomes the primary artifact and AI amplifies collective intelligence rather than individual productivity, sustainable velocity emerges.

**New engineering excellence:**
- Writing specifications so clear that both humans and AI execute flawlessly
- Creating context so rich that any team member can own any task
- Building review systems that elevate everyone's capabilities
- Maintaining educatability as a core team value

Your competitive advantage isn't keeping knowledge siloed--it's how fast your entire team learns, adapts, and ships quality together. Specification is your shared language. Clear communication is your superpower. Collective educatability is your moat.

---

**TL;DR: engineering excellence = articulation excellence**

Write specs so clear that implementation becomes mechanical. Use living documents that evolve. Compare spec to reality constantly. Parallelize everything. Share context obsessively. Clear thinking beats fast typing.

