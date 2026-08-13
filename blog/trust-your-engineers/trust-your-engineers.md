# The AI Gap: Why Leaders Struggle to Equip Their Engineers

**Ask engineers where approved tools fail, then test one alternative for 30 days.**

*By Jory Pestorious*

> "I don't really like AI."

An AI leader confided this at a weekend gathering. They lead AI initiatives for a major enterprise, answer engineers asking for advanced tools, and carry responsibility for technology they struggle to evaluate.

One conversation cannot show whether an organization chose the wrong tool or whether a newer one improves engineering work. The conversation exposes a decision problem: the person accountable for adoption may not have enough hands-on evidence to judge an engineer's request.

I call the distance between the workflows engineers can demonstrate and the tools their organization provides **the AI tool gap**. The term describes tool access rather than a skills shortage. Closing the gap starts with a specific blocked task, not a general promise that AI makes engineers faster.

An engineer using Claude on a personal account may be crossing an approved data boundary. The same behavior can also signal that an official workflow failed. Leaders need to learn which task drove the workaround before deciding whether the answer is enforcement, a safer configuration, or a different tool.

![The AI tool gap](ai-excellence-optimized.png)
*One team has tools in hand; the other is still trying to decide what to approve.*

## Start With the Blocked Task

Ask an engineer to demonstrate one recent task that the approved setup could not complete well. Record the intended artifact, the manual steps, the data involved, the permissions required, and the point where the current tool stopped helping. Define acceptable quality before discussing a replacement.

A task demonstration turns a product request into a workflow requirement. A request for Claude Code, for example, might be a request for repository context, terminal access, reusable project instructions, or an external integration. Each need has different controls and can be evaluated separately.

The tools available in August 2025 provide mechanisms worth testing, not outcomes to assume. My [July 2025 `CLAUDE.md`](https://github.com/joryeugene/calmhive-cli/blob/ece1ec8c8f431c8f21e8cac1eaf05013e3bcc29d/CLAUDE.md) shows how one repository can carry project instructions. The June 2025 [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-06-18/server/index) defines resources, prompts, and tools that a server can expose to a client. Neither mechanism proves that documentation stays current, bugs take hours instead of days, or junior engineers ramp up faster.

## Run a 30-Day Comparison

Select a small set of representative tasks before the pilot begins. Run them with the approved setup, then give one team the candidate tool for 30 days under the same repository, test data, review policy, and task definitions. Record the tool and model versions so a later change does not silently alter the comparison. Measure only fields that can change the decision:

- completion rate against the predefined acceptance criteria;
- elapsed time, active engineering time, and review time;
- defects, rework, and rejected output;
- permission requests, data-boundary violations, and security incidents;
- tool, model, infrastructure, and support cost.

Keep code review and production controls in place through the entire comparison. A pilot should compare tools, not remove the safeguards that make the work acceptable.

Do not multiply an assumed few hours of weekly savings across 1,000 engineers. First establish whether the pilot saves time after review and rework, how much results vary by task, and whether the change affects quality or risk. An extrapolation is useful only after those measurements exist.

## Govern the Risk the Tool Creates

Leadership caution can protect engineers and customers from risks that a local workflow does not reveal. The pilot should test these four risks separately before broader access:

- **Data exposure:** Which source code, customer records, credentials, and logs may leave the approved boundary?
- **Vendor dependency:** Can the team export instructions, traces, and work products if the service changes?
- **Budget impact:** What does normal and heavy usage cost after the pilot reaches more teams?
- **Integration complexity:** Who owns authentication, upgrades, incident response, and removal?

Product labels do not answer these questions. A claim such as SOC 2 compliance, data isolation, or audit logging needs a named product and plan, the applicable report scope, retention and training terms, and the exact events administrators can review.

MCP also requires implementation-specific review. Its June 2025 [tool guidance](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) says people should be able to deny tool calls, clients should identify exposed tools and invocations, and annotations from untrusted servers must not determine tool-use decisions. Its [authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) covers HTTP authorization, token validation, and audience binding. The protocol does not make every client, server, or tool safe by default.

## Let the Result Decide

Expand the candidate when it improves the chosen task without unacceptable losses in quality, security, or cost. When benefits vary, restrict access to the tasks that improve; stop when the comparison shows no material improvement.

Engineers should help choose the tasks and inspect the output because they know the workflow. Security, legal, finance, and platform owners should define the boundaries they are accountable for. The pilot gives both groups the same evidence.

The leader at the weekend gathering did something useful by naming their uncertainty. The next step is to ask an engineer to show the blocked work, test one alternative inside real controls, and share the result. A shared result turns trust into an engineering decision instead of a slogan.

**Historical links:**

- [Claude Code](https://github.com/anthropics/claude-code/tree/eb48d5e4a80a5c120757b576003d7cecd5d82b45)
- [A July 2025 `CLAUDE.md` example](https://github.com/joryeugene/calmhive-cli/blob/ece1ec8c8f431c8f21e8cac1eaf05013e3bcc29d/CLAUDE.md)
- [Sequential thinking tools](https://github.com/spences10/mcp-sequentialthinking-tools/tree/114cddb7a484ee3c5e0ae3fb2ca21b929629562b)
- [Model Context Protocol, June 2025](https://modelcontextprotocol.io/specification/2025-06-18/)
- [MCP reference servers](https://github.com/modelcontextprotocol/servers/tree/4f953be6f4e22077bf7240f0dc60e5c562e3159f)
