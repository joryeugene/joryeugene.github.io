#AIDevTooling
## Stop Coding Like It's 2024:
### An AI-Amplified Dev Playbook
#### (for early 2025)
**By Jory Pestorious | April 16, 2025**

> "Colour is the keyboard, the eyes are the harmonies, the soul is the piano with many strings."
> -- Vasily Kandinsky

---

### Quick Start: Top 3 Dev+ Wins

1. Try an *agentic workflow* for multi-file implementation/refactor with [**Cursor Agent**](https://docs.cursor.com/chat/overview), [**Claude Code**](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), and/or [**Cline**](https://github.com/cline/cline).
2. Use *model context protocols* ([**MCPs**](https://modelcontextprotocol.io/introduction)) to *orchestrate, gather, and change* data from non-code sources--they're **high leverage**.
3. *Parallelize your work* with AI to speed up development. (For most, this will be the **next big bottleneck**.)

---

### Introduction:
#### Why This Playbook? Who Is It For?
AI tools are transforming how we work with code at *breathtaking speed*--Dev+ use AI to **amplify understanding**, not surrender it.

This playbook is for engineers, tech leads, and builders who wield AI as a *force multiplier*--without giving up control, creativity, or deep code mastery.

---

> **We're entering what our CTO calls 'the maelstrom'--a time of extraordinary transformation in software development.**
>
> AI-Amplified developers at the forefront are already realizing productivity gains of up to **100x** in certain areas.

---

In the coming years, tools, workflows, and even integrated development environments (IDEs) will undergo *significant changes*. This playbook is designed to help you navigate this period of transition, though it may become outdated quickly...

> *The half-life of technical knowledge is shrinking rapidly. What matters now is your ability to adapt and learn.*

---

### What You'll Discover:
- 🧩 A **framework** for AI-Amplified development
- 🛠️ **Practical tools** for your daily workflow
- 🧠 **Strategies** to maintain deep code understanding while accelerating development

*I hope this playbook helps you build a toolchain that amplifies your capabilities.*

---

## The Four Core Goals of AI-Amplified Development

> ### **M.A.T.H.**

1. **M**aster Your Codebase
   - *Use AI to illuminate, not obscure*
   - *Never let automation replace your understanding*

---

2. **A**ccelerate with Confidence
   - *Move at breakneck speed without sacrificing quality*
   - *Maintain security and state management even at high velocity*

---

3. **T**est & Debug Intelligently
   - *Partner with AI for deep, agentic workflow testing*
   - *Keep a human in the loop for critical decisions*
   - *When things break, real debugging skills (VS Code, nvim-dap, browser devtools) are non-negotiable*

---

4. **H**arness Compute Power
   - *Let machines do the heavy lifting*
   - *Focus your mental energy on what matters most*

> *As simple as MATH. So... not simple. The power of these tools is immense, but mastery comes with practice and patience.*

---

## Key Principles for Dev+

> *These principles separate Dev+ from the novices*

---

<table>
<tr>
<td width="50%">

#### Input Quality
- **Context is King** 👑
  - *Give rich, relevant context*
  - *Logs, goals, constraints*
  - *Remember: Garbage in, garbage out*

- **Craft Your Prompts** 🎯
  - *Start broad, iterate, and refine*
  - *Maintain a prompt library*
  - *Learn the [**art of conversation with AI**](https://www.kaggle.com/whitepaper-prompt-engineering)*
</td>
<td width="50%">

#### Safety & Verification
- **Master Version Control** 🔄
  - *Commit early, branch often*
  - *Use Git as your safety net*
  - *Perfect for AI-Amplified exploration with git worktrees*
- **Verify Relentlessly** ✅
  - *Console logs, tests, visual checks*
  - *CI/CD pipelines are your friends*
  - *Debugging skills are crucial in the AI era*

</td>
</tr>
</table>

---

### Context Priming Techniques

<table>
<tr>
<td width="50%">

**General AI Context Standards:**
- [**llms.txt**](https://llmstxt.org/): Cross-tool standard for AI context files
- [**GitHub repo**](https://github.com/AnswerDotAI/llms-txt): Official specification and tooling

</td>
<td width="50%">

**Tool-Specific Implementations:**
- **Cursor**: [**`.cursor/rules/*.mdc`**](https://docs.cursor.com/context/rules-for-ai)
- **Cline**: [**`.clinerules`**](https://docs.cline.bot/improving-your-prompting-skills/prompting)
- **Netlify**: [**AI Context**](https://docs.netlify.com/welcome/build-with-ai/)

</td>
</tr>
</table>

**MCP Integrations:** [**Figma**](https://github.com/GLips/Figma-Context-MCP), [**Perplexity**](https://github.com/tanigami/mcp-server-perplexity), [**more**](https://github.com/punkpeye/awesome-mcp-servers)

---

### Workspace-Driven Tooling

**Scenario:** You need to organize your AI tools by workspace and workflow type.

---

<table>
<tr>
<td width="50%">

### Core Development Workspaces
- **Research & Planning Tools**
- **Terminal Tools**
- **Code Completion**
- **In-File Editing**

</td>
<td width="50%">

### Advanced Workflows
- **Multi-File & Agentic**
- **Parallelization**
- **Supplementary Tools**
- **Code Quality Tools**

</td>
</tr>
</table>

---

### Research & Planning Tools

**Scenario:** You need to understand, organize, and plan before you build.

---

- [**OpenAI ChatGPT**](https://chat.openai.com/): Versatile research assistant with multiple models and Mac app integration.
- [**Google Gemini**](https://gemini.google.com/): Summarizes content, integrates with Google Workspaces.
- [**Perplexity AI**](https://www.perplexity.ai/): Real-time web search with AI reasoning.
- [**Anthropic Claude**](https://claude.ai/): Excels in complex reasoning and document analysis.

---

**LLM Specializations (April 2025):**

<table>
<tr>
<td width="50%">

**Top Models:**
- [**Claude 3.7 Sonnet**](https://www.anthropic.com/claude): Agentic coding, "thinking mode" (High [SWE-bench](https://swebench.com/) score)
- [**GPT-4.1**](https://openai.com/index/gpt-4-1/): 1M token context (Medium-High SWE-bench)
- [**GPT-4o**](https://chat.openai.com/): Multimodal (text, image, audio) (Medium SWE-bench)
- [**OpenAI O3 / O4-mini**](https://openai.com/index/introducing-o3-and-o4-mini/): Efficient next-gen reasoning models (projected high SWE-bench)
- [**Gemini 2.5 Pro**](https://gemini.google.com/): Advanced reasoning, multimodal (High SWE-bench score)

</td>
</tr>
</table>

*SWE-bench is a Python-focused benchmark, not comprehensive. Scores update frequently.*

---

### Terminal Power Moves

**Scenario:** You need to move fast, automate, and chain tools like a command-line ninja.

---
**Terminal Tools:**
- [**Warp**](https://www.warp.dev/): Modern terminal with built-in AI
- [**Cursor Terminal**](https://cursor.sh/blog/cursor-terminal): Cmd+K for context-aware suggestions
- [**Butterfish**](https://github.com/charliermarsh/butterfish): Context-aware CLI tool
- [**LazyGit**](https://github.com/jesseduffield/lazygit): Terminal-based Git interface with lightning-fast keymaps for version control
- [**Tmux**](https://github.com/tmux/tmux)/[**Zellij**](https://github.com/zellij-org/zellij): Terminal multiplexers for persistent sessions and organizing AI tools side-by-side

---

**Power Moves:**
```sh
# Generate commit messages
git diff --staged | claude -p \
"Generate a concise, descriptive commit message. \
Only print the commit message itself, nothing else."

# Chain commands
cat error.log | grep Exception | claude
```

---

### Code Completion

**Scenario:** You want instant, context-aware code suggestions as you type--across languages and frameworks.

---

**Code Completion Tools:**
- [**GitHub Copilot**](https://github.com/features/copilot): Industry standard for AI code completion
- [**Cursor Tab Completion**](https://cursor.sh/blog/cursor-completions): Best-in-class completions with context awareness
- [**Supermaven**](https://supermaven.com/): Lightning-fast completions, acquired by Cursor

---

### In-File Editing: Modal Mastery

**Scenario:** You're deep in a file--refactoring, debugging, or writing new logic. Speed and precision matter.

---

| | |
|-------|-------|
| - [**Cursor IDE**](https://cursor.sh/docs): Inline AI chat with Cmd+K for context-aware suggestions<br>- [**Zed**](https://zed.dev/): High-performance, collaborative code editor with AI capabilities<br>- [**VSCode Neovim**](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim): Efficient VIM navigation in VS Code | **Why VIM Matters:**<br><br>*» VIM motions remain a powerful force multiplier--letting you edit at the speed of thought while AI handles the complex generation*<br><br>**VIM-Powered Tools:**<br>- [**Butterfish Neovim**](https://github.com/charliermarsh/butterfish): OpenAI-powered editing in Neovim<br>- [**claude.vim**](https://github.com/pasky/claude.vim): Claude integration for Neovim |

---

### Multi-File & Agentic Workflows

**Scenario:** You need to refactor, generate, or orchestrate changes across many files or services.

---

- [**Cursor Agent**](https://docs.cursor.com/chat/overview): Multi-file editing, YOLO mode, and MCPs.
- [**Windsurf**](https://windsurf.com/editor): IDE with powerful AI-native features and multi-file capabilities.
- [**Roo**](https://github.com/RooVetGit/Roo-Code), [**Cline**](https://github.com/cline/cline): Agentic workflow, multi-file editing with transparent token usage and MCP integration. VS Code/Cursor extension.
- [**augment code**](https://augmentcode.com/): Handles large codebases and complex agentic workflows with MCP integration. VS Code/Cursor/Neovim extension.

---

**CLI / Terminal Tools:**
- [**Claude Code CLI**](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview): Agentic, human-in-the-loop, multi-file approach.
- [**Aider**](https://github.com/paul-gauthier/aider): Terminal-based, multi-file coding assistant.
- [**RA.Aid**](https://github.com/ai-christianson/RA.Aid): Research assistant and coding CLI tool.
- [**OpenAI Codex CLI**](https://openai.com/index/openai-codex/): OpenAI's Claude Code copy that needs some work.

---

**Agentic Power: [Model Context Protocols](https://github.com/punkpeye/awesome-mcp-servers)**
- Use MCPs to let AI plan, track, and execute tasks end-to-end.
  - *Example:* [**Micromanage**](https://github.com/yodakeisuke/mcp-micromanage-your-agent)
- [**Memory Bank**](https://github.com/alioshr/memory-bank-mcp): MCP for organizing project information that AI can reference

---

**MCP Integration Examples:**
- Design files: **[Figma MCP](https://github.com/GLips/Figma-Context-MCP)**
- Web search: **[Perplexity MCP](https://github.com/tanigami/mcp-server-perplexity)**
- Research papers: **[ArXiv MCP](https://github.com/blazickjp/arxiv-mcp-server)**
- *Remember:* Always review the plan and outputs--AI is powerful, but you are the final authority.

---

**Agentic vs. Autonomous Workflows:**
- **Agentic workflows** require human interaction and oversight
- **Autonomous agents** attempt to complete tasks with minimal human intervention
- *Best practice:* Start with agentic workflows before moving to autonomous agents

---

### Parallelization & Orchestration

**Scenario:** You want to scale your productivity by working in parallel and orchestrating agents or workflows.

---

**Beginner Techniques:**
- **Simple:** Multiple tabs, multiple LLMs, multiple agentic workflows
- *Perfect for:* Quick prototyping, parallel research tasks

---

**Intermediate Techniques:**
- **Parallel Dev:** Multiple cloned repos, parallel PRs, [**VSCode**](https://code.visualstudio.com/docs/editor/workspaces) workspaces
- **CI/CD Automation:** [**GitHub Actions**](https://github.com/features/actions), [**GitLab CI**](https://docs.gitlab.com/ee/ci/), or [**Jenkins**](https://www.jenkins.io/) for automated workflows
- *Perfect for:* Feature development, multi-service projects, automated testing

---

**Advanced Techniques:**
- **Git Worktrees:** Advanced git workflows for parallel feature/refactor streams
- **Parallel Processing:** Running multiple tasks simultaneously across different environments
- **Agent Orchestration:** Multi-agent frameworks ([**CrewAI**](https://crewai.com/), more to come)
- *Perfect for:* Complex system refactoring, multi-team coordination


---

**Pro Tips:**

• Use *visual automation* tools like [n8n](https://n8n.io/) (open source) or [Make](https://www.make.com/)
  to create, visualize, and manage *complex agent workflows* without code.

• Create *"MCP Hubs"* - collections of specialized MCP servers that can be easily accessed
  and shared across your team for different tasks.

• Use *Mermaid.js diagrams* for documentation and planning of complex workflows.

---

### Supplementary Tools

**Scenario:** You need specialized tools to enhance your workflow and productivity.

---

<table>
<tr>
<td width="50%">

**Keyboard & Input:**
- [**Karabiner**](https://karabiner-elements.pqrs.org/): Keyboard customization for macOS
- [**Homerow**](https://www.homerow.app/): Mouse-free UI interaction
- [**Wispr Flow**](https://wisprflow.ai/): Voice dictation
- [**Espanso**](https://espanso.org/): Text expansion

</td>
<td width="50%">

**Browser & Web Dev:**
- [**Tridactyl**](https://tridactyl.xyz/): VIM-style browser navigation
- [**Zen Browser**](https://zen-browser.app/): Advanced Firefox fork
- [**Replit**](https://replit.com/): Browser-based coding
- [**Builder.io**](https://www.builder.io/): Figma-to-code conversion

</td>
</tr>
</table>

**SMART Workflow:** **S**hortcuts, **M**aintain library, **A**utomation, **R**ich prompts, **T**ext expansion

---

### Code Quality Tools

**Scenario:** You need to maintain high code quality and consistency across your projects.

---

- [**Biome**](https://biomejs.dev/): Fast linter and formatter (alternative to Prettier/ESLint)
  - *Advantage:* Significantly faster performance for large codebases
- [**Knip**](https://github.com/webpro-nl/knip): Find unused code, exports, and dependencies
  - *Perfect for:* Cleaning up technical debt and improving maintainability
- **Strict Linting**: Enforce consistent code style across your team
  - *Pro tip:* Configure your editor to format on save for maximum efficiency (or use a pre-commit hook)

---

### Operational Excellence

**Scenario:** You need to optimize team workflows and ensure consistent practices across your organization.

---

#### Team Collaboration
- **Create shared tool configs** for consistent development environments
- **Document AI patterns** that work well for your specific codebase
- **Foster upskilling** by celebrating early AI adopters and creating learning spaces
- **Embrace role fluidity** as traditional boundaries between product, design, and engineering blur

---

#### Competitive & Economic Considerations

<table>
<tr>
<td width="50%">

**Team Models:**
- **Enhanced teams**: Same size but increased velocity and broader ownership
- **Builder teams**: Smaller, more fluid teams with generalist "builders"
- **Reality check**: "How can we compete if we don't adopt?"

</td>
<td width="50%">

**Business Impact:**
- **Competitive necessity**: Teams mastering Dev+ will outpace others
- **Enterprise adoption**: Drives formalization of AI tools and practices
- **Measuring ROI**: Use [**Workhelix**](https://www.workhelix.com/) to track impact

</td>
</tr>
</table>

---

#### Additional Considerations

<table>
<tr>
<td width="50%">

**Documentation & Accessibility:**
- AI-generated docs with human review
- Automated knowledge base updates
- Voice tools and keyboard workflows

</td>
<td width="50%">

**Metrics & Measurement:**
- Measure PRs/week, lines changed/day
- Team velocity trends, time-to-completion for features
- Code quality scores, defect rates, and resolution time

</td>
</tr>
</table>

</td>
</tr>
</table>

---

#### Security & Privacy

<table>
<tr>
<td width="50%">

**Key Precautions:**
- Never paste sensitive code/envs into AIs
- Consider compliance (GDPR, SOC2) requirements

</td>
<td width="50%">

**Security Reality:**
- AI-generated code needs rigorous testing
- Authentication requires specialized expertise

</td>
</tr>
</table>

---

### Common Pitfalls & Balanced Perspectives

#### Common Mistakes to Avoid: VITAL

<table>
<tr>
<td width="100%">

**V.I.T.A.L. Mistakes to Avoid:**
- **V**erify all AI outputs
- **I**gnore compliance (don't!)
- **T**est/feedback loops are essential
- **A**bandon fundamentals (don't!)
- **L**ean on AI too heavily (find balance)

</td>
</tr>
</table>

---

#### The Value of Specific Tools in the Transition Era

<table>
<tr>
<td width="100%">

**Why Tool Knowledge Still Matters:**
- **Immediate leverage:** Mastering tools like Cursor or Claude Code gives you productivity advantages *now*
- **Transferable skills:** Learning how to prompt *one* LLM teaches patterns that work *across* all AI tools
- **Timeless decision criteria:** The principles for choosing the *right* tool (speed vs accuracy, context handling, specialized capabilities) remain *valuable* even as specific tools change

</td>
</tr>
</table>

---

#### Why Low-Level Skills Will Still Matter
Even as we move toward agent fleets and higher-level abstractions:
- **System understanding**: Knowing what's happening *"under the hood"* will enable more nuanced prompting and precise problem-solving.

> A balanced view recognizes both the transformative potential of AI agents AND the enduring value of deep technical expertise.



---

### Balancing Benefits & Challenges

**Scenario:** You want to maximize AI benefits while addressing legitimate concerns.

---

<table>
<tr>
<td width="50%">

#### Respecting Agency & Process
- **Choice Matters**
  - *Encourage, don't mandate adoption*
  - *Value the creative journey, not just output*
- **Quality Awareness**
  - *Know when AI creates more work than it saves*
  - *Focus on outcomes, not tool usage metrics*

</td>
<td width="50%">

#### People & Ethics
- **Support Your Team**
  - *Foster open dialogue about AI integration*
  - *Bridge management-developer perspective gaps*
- **Consider Implications**
  - *Respect intellectual property boundaries*
  - *Maintain transparency about AI usage*

</td>
</tr>
</table>

---

#### Core Competencies
- **Realistic Gains:** Aim for sustainable 15-30% improvement without sacrificing understanding
- **Skill Independence:** Practice coding in "Airplane Mode" without AI assistance
- **Prevent Dependency:** Using AI without learning creates technical debt; balance quick wins with skill development

---

### Dev+ Principles: MASTER BASIC

**Scenario:** You need a framework for effective AI-augmented development practices.

---

*You thought MATH was the only acronym? Here's MASTER BASIC for Dev+ fundamentals:*

<table>
<tr>
<td width="50%">

**M-A-S-T-E-R**
- **M**aster your tools
- **A**utomate repetitive work
- **S**hare workflows with team
- **T**est and iterate rapidly
- **E**nhance creativity
- **R**eview code thoroughly

</td>
<td width="50%">

**B-A-S-I-C**
- **B**alance oversight
- **A**utomate (yes, again!)
- **S**tart with clear specs
- **I**terate and learn
- **C**ontinuously improve

</td>
</tr>
</table>

---

### Dev+ Workflow Example

**Scenario:** You want to see how cutting-edge AI tools can transform your team's development process.

---

1. **Research & Planning:**
   Use [**Perplexity**](https://www.perplexity.ai/) for market research and
   [**Claude**](https://claude.ai/) for competitor analysis.

2. **Spec Generation:**
   Dictate PRD with [**Wispr Flow**](https://wisprflow.ai/),
   refine in [**Cursor**](https://cursor.sh/docs) using Cmd+K.

---

3. **Parallel Development:**
   Use [**git worktrees**](https://git-scm.com/docs/git-worktree) with Cursor for simultaneous development.
   See [Claude Code tutorials](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials).

4. **Collaborative AI Workflow:**
   Use [**Cline**](https://github.com/cline/cline) with
   [**Micromanage MCP**](https://github.com/yodakeisuke/mcp-micromanage-your-agent) for PRD implementation.

---

5. **Automation of Common Dev Processes (example):**
    - **Shared Claude Commands:** Utilize shared `.claude/commands/*.md` files for common agentic workflows.
    - **Unified Makefile:** Implement a shared [**Makefile**](https://www.gnu.org/software/make/manual/make.html) for generating commit messages. This can be achieved by adding the following rule:

  ```
  commit-msg:
      git diff --staged |
      claude -p "Generate a concise commit message."
  ```

---

### Current Limitations & Difficulties
**Scenario:** You need to understand the boundaries and challenges of AI development tools.

---

<table>
<tr>
<td width="60%">

**Key Challenges:**
- Human context switching capacity
- LLM context window constraints
- API rate limits
- Hidden prompts and token usage
- Difficulty reviewing all changes

</td>
<td width="40%">

<br>

**Strategy:**
*Know your tools' boundaries and master recovery strategies when AI fails you.*

</td>
</tr>
</table>

---

## Future-Proofing & Next Horizons

> *"The future is already here – it's just not evenly distributed."* – William Gibson

### The Rapid Evolution of AI Development

---

We're witnessing a **fundamental shift** in how software is created. One frontier developer reported writing *10,000+ lines of code in just 4 days*--compared to their previous norm of 50-100 lines per day.
> While such metrics have obvious caveats (**quantity ≠ quality**), this 100x productivity leap offers a preview of what's becoming possible with tools like a good PRD, task orchestration with MCP, and parallel development.

---

### How Fast Will Things Change?

<div align="center">
<em>The transition will be uneven across different domains and organizations</em>
</div>

<br>

<table>
<tr>
<td width="33%" align="center">
<h4>Now</h4>
<p><strong>Individual Mastery</strong></p>
<p><em>Mastery of individual AI tools and agents is the competitive edge</em></p>
</td>
<td width="33%" align="center">
<h4>Soon</h4>
<p><strong>Orchestration Era</strong></p>
<p><em>Multi-agent orchestration becomes mainstream; IDEs begin transforming dramatically</em></p>
</td>
<td width="33%" align="center">
<h4>Soonish</h4>
<p><strong>Agent-Driven Development</strong></p>
<p><em>Agent-driven development environments replace traditional IDEs</em></p>
</td>
</tr>
</table>

---

### What's Coming Next

<div align="center">
<h4>🔮 The horizon is closer than you think</h4>
</div>

<table>
<tr>
<td width="50%">

#### Development Paradigm Shifts
- **Mobile/remote dev workflows**
  - *LLM-powered tools enabling sophisticated development from anywhere*
  - *Code from your phone with the power of a full workstation*
- **The IDE transformation**
  - *Many experts predict "the IDE will eventually be mostly gone"*
  - *Replaced by intent-driven development environments*

</td>
</tr>
</table>

---

<div align="center">
<p><em>Presentation materials available at: <a href="https://github.com/joryeugene/ai-dev-tooling">github.com/joryeugene/ai-dev-tooling</a></em></p>

<p><strong>The maelstrom is upon us--learning to pilot in it will define the next generation of Dev+.</strong></p>
</div>

---

### TL;DR: The Dev+ Acronym Toolkit

<div align="center">
<h4>🧠 A cheat sheet for Dev+</h4>
</div>

<table>
<tr>
<td width="50%" align="center">
<p><strong>M.A.T.H.</strong> - Four Core Goals</p>
<p><strong>S.M.A.R.T.</strong> - Workflow Acceleration</p>
</td>
<td width="50%" align="center">
<p><strong>M.A.S.T.E.R. B.A.S.I.C.</strong> - Dev+ Principles</p>
<p><strong>V.I.T.A.L.</strong> - Common Mistakes to Avoid</p>
</td>
</tr>
</table>
