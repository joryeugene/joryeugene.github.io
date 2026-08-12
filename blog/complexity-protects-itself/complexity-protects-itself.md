# Complexity Protects Itself

_By Jory Pestorious | April 2026_

---

## The Pattern

Netscape spent nearly three years between major browser releases while it rewrote the codebase. [Joel Spolsky wrote](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) that its market share plummeted during that gap. He called a rewrite from scratch "the single worst strategic mistake that any software company can make" because the working code held years of fixes and production knowledge that the replacement had not earned yet. The old code was ugly. It worked.

That does not mean every rewrite fails or every custom platform is a mistake. I care about a narrower pattern: a working path is replaced before the team understands its constraints, and the replacement gathers more responsibilities as it grows. It may look cleaner while becoming more coupled/fragile. The question is whether that new ownership solves a product problem worth owning.

[G.K. Chesterton described the first test in 1929](https://catholiclibrary.org/library/view?chunk.id=00000011&docId=%2FContemporary-EN%2FXCT.165.html): before removing a fence or gate across a road, understand why it was put there. In software, the fence may be an awkward branch, duplicated check, or boring service that already encodes a failure the replacement has not seen.

[Fred Brooks](https://openlibrary.org/books/OL5044740M/The_mythical_man-month) described the ambition that follows. He called it the Second System Effect: the architect of the first system, having been restrained by budgets and deadlines, pours the deferred ideas into the second. "The general tendency is to over-design the second system, using all the ideas and frills that were cautiously sidetracked on the first one."

[Dan McKinley asks readers](https://mcfunley.com/choose-boring-technology) to imagine that a company gets about three innovation tokens. He calls the number approximate, a way to describe limited attention rather than a measured budget. Spend those tokens on a novel database, deployment system, and secrets layer, and the team must learn how each fails while it is also trying to build the product. Spend all three, and even an outage can become a research project.

---

## What Gets Complected

[Rich Hickey's "Simple Made Easy"](https://www.infoq.com/presentations/Simple-Made-Easy/) gives the mechanism a name. Hickey contrasts _simplex_, one twist, with _complexus_, braided together, and uses _complect_ for concerns that have been interleaved. Simple and easy are different properties: easy is familiar to a person, while simple describes a system whose concerns are not intertwined. A complected system can feel easy to its builders because they already carry the missing context.

A deployment platform might handle infrastructure state, secrets, CI orchestration, tenant configuration, and approvals in one codebase. Putting them together expands what an engineer must understand and change at once. Narrower tools can shrink that reasoning boundary even when they still depend on one another at runtime.

[Sandi Metz reached the same problem through abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction): "Duplication is far cheaper than the wrong abstraction." A unified platform may remove duplicated code, then recover every real difference through another conditional. Each exception makes the shared abstraction harder to change than the separate code it replaced.

Each conditional also increases how much of the system the team must hold in mind. [Margaret-Anne Storey applied the existing term _cognitive debt_ to software teams](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) in February 2026: system complexity can grow faster than the team's understanding of it. [Addy Osmani calls the related gap _comprehension debt_](https://addyosmani.com/blog/comprehension-debt/), especially when AI increases the amount of code faster than anyone can explain it.

---

## Stress Exposes the Ownership Model

Nassim Taleb's [_Antifragile_](https://www.penguinrandomhouse.com/books/176227/antifragile-by-nassim-nicholas-taleb/) distinguishes systems that are harmed by stress, resist it, or gain from it. That taxonomy does not make a managed service antifragile or an internal platform fragile by definition. Whether either system gets stronger depends on what happens after a failure.

A managed service can improve when customer incidents become tested fixes for every tenant, but it can also spread one defect across them. An internal platform can improve if incidents produce structural checks, shared documentation, and ownership that survives the original team. It becomes fragile when each incident adds another exception while the required context concentrates in fewer people.

Brooks's communication formula helps explain one part of that risk. A team of _n_ people can have _n_(_n_ - 1) / 2 pairwise communication channels, so ten people can have 45 and one hundred can have 4,950. The formula describes pairwise coordination, not whether a one-person system can transfer knowledge. A bus factor of one becomes dangerous when that person's context is not documented or shared.

The [_Visible Ops Handbook_](https://www.computerworld.com/article/1725198/an-introduction-to-visible-ops.html) cites Gartner analysis that 80 percent of unplanned downtime came from people and process issues, including poor change management. That figure does not measure opacity. My concern is that opaque systems give reviewers less chance to see the effect of a change and responders fewer ways to recover without the original author.

The [2024 DORA report](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf) also undercuts the idea that slower change is automatically safer. Its elite cluster deployed on demand, reported a 5 percent change-fail rate, and recovered from failed deployments in under an hour. Its low-performing cluster deployed between monthly and twice yearly, reported a 40 percent change-fail rate, and recovered in one week to one month. The report does not blame complexity for the gap. It does show that the low-performing cluster delivered less often and was not safer.

---

## Before You Build It

Before building a deployment platform, I want one question answered: who already built the parts we would now own? Products such as [Spacelift](https://spacelift.io/about-us), [GitHub Actions](https://github.com/features/actions), and [Terraform](https://developer.hashicorp.com/terraform) already cover parts of that stack. None is automatically the right fit. A custom build should still name the product-specific requirement those options cannot meet, along with the failures and maintenance the team is choosing to absorb.

[Dan Luu's case studies of billion-dollar companies with comparatively simple architectures](https://danluu.com/simple-architectures/) are a useful counterweight to the assumption that growth automatically demands a platform. Scale can justify custom infrastructure, but it does not do so by itself.

McKinley's innovation tokens make this a question of focus. For a company whose product is not infrastructure, I would require a concrete advantage before spending scarce engineering attention on it. [Charity Majors calls developer cycles the scarcest resource in a company](https://www.honeycomb.io/blog/future-ops-platform-engineering), so outsourcing infrastructure can keep them on the product. A vendor may amortize reliability work across customers, but the team still has to verify that the vendor's incentives and boundaries match its own.

AI lowers the cost of starting a build while leaving the team responsible for maintaining the result. In a [2025 randomized trial](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 16 experienced open-source developers completed 246 tasks in mature repositories they knew well. With early-2025 AI tools, they took 19 percent longer while estimating that AI had made them 20 percent faster. METR warns against generalizing beyond that setting, and later tools may behave differently. The result still gives me a reason to measure the maintenance cost instead of assuming generated code removed it.

The [2025 DORA report](https://dora.dev/research/2025/dora-report/) describes AI as an amplifier of organizational strengths and weaknesses. DORA uses a different capability set than Hickey, but the finding gives me a practical check: is AI accelerating a system with clear boundaries and executable checks, or merely producing more code around an unclear one?

[Kelsey Hightower put the social cost plainly](https://github.com/tgogos/kelsey-hightower-wisdom): "We tend to build overly complex solutions and dedicate our careers justifying their existence." Once a platform becomes the path to production, replacing it can threaten the work, status, and routines built around it. That is one way complexity starts protecting itself.

---

## Convention and Structure

In [Verified Context Is the Moat](../knowledge-sidecar/), I argued that a rule people must remember is weaker than one the system enforces. Consider a deployment pipeline where every code path must call a function that injects required configuration. The rule can be documented and understood, yet one missed call still ships a deployment without the configuration.

Now change the design so every deployment is validated for required variables before it can proceed. The implementation could be custom or managed. What matters is that the invalid state is rejected at the boundary instead of relying on every caller to remember the rule.

I see a related asymmetry between protection and verification in the [agent experiments I wrote about earlier](../emergent-religion/). Those experiments produced protection mechanisms without spontaneous verification. In an organization, sunk cost and operational dependency protect a platform automatically; checking whether it still earns its cost takes deliberate work.

---

## Three Tests

Three questions help evaluate a replacement before it becomes the only path to production.

**Does more stress make this stronger?** Name what changes after an incident. Tested fixes and shared context can strengthen the system; another undocumented exception and narrower ownership make it more fragile.

**What am I braiding together that should be separate?** List the concerns that must be understood or changed together. If a secrets change requires tracing provisioning, tenant configuration, CI, and approvals, the reasoning boundary is already too wide.

**Who already solved this?** List the managed and open-source options, then state the exact product requirement each one cannot meet. "More flexibility" is not enough unless the team prices the ownership that flexibility creates.

A custom platform can pass all three tests, and when it does, build it with explicit ownership. Without those answers, do not let it become the only path to production.

---

## Sources

### Foundational

Chesterton, G.K. (1929). [_The Thing_, "The Drift from Domesticity."](https://catholiclibrary.org/library/view?chunk.id=00000011&docId=%2FContemporary-EN%2FXCT.165.html) The fence or gate example and the requirement to understand a structure before removing it.

Brooks, F. (1975). [_The Mythical Man-Month: Essays on Software Engineering_.](https://openlibrary.org/books/OL5044740M/The_mythical_man-month) Addison-Wesley. The Second System Effect and pairwise communication channels.

Hickey, R. (2011). ["Simple Made Easy."](https://www.infoq.com/presentations/Simple-Made-Easy/) Strange Loop Conference. Simple versus easy and the cost of complecting concerns.

Taleb, N.N. (2012). [_Antifragile: Things That Gain from Disorder_.](https://www.penguinrandomhouse.com/books/176227/antifragile-by-nassim-nicholas-taleb/) Random House. Fragile, robust, and antifragile systems.

### Software Engineering

Spolsky, J. (2000). ["Things You Should Never Do, Part I."](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) Joel on Software. Netscape's rewrite and the production knowledge held in old code.

McKinley, D. (2015). ["Choose Boring Technology."](https://mcfunley.com/choose-boring-technology) Innovation tokens and the operational cost of novelty.

Metz, S. (2016). ["The Wrong Abstraction."](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) "Duplication is far cheaper than the wrong abstraction."

Luu, D. (2022). ["In Defense of Simple Architectures."](https://danluu.com/simple-architectures/) Case studies of billion-dollar companies running on comparatively simple technical foundations.

### Data and Reports

DORA Team, Google Cloud. (2024). [_Accelerate State of DevOps Report._](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf) Software delivery performance clusters and their throughput and stability measures.

DORA Team, Google Cloud. (2025). [_State of AI-Assisted Software Development._](https://dora.dev/research/2025/dora-report/) AI as an amplifier of existing organizational strengths and weaknesses.

METR. (2025). ["Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity."](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) A randomized trial of 16 experienced developers completing 246 tasks in familiar open-source repositories.

Kim, G., Behr, K., & Spafford, G. (2004). [_The Visible Ops Handbook._](https://www.computerworld.com/article/1725198/an-introduction-to-visible-ops.html) People, process, and change-management sources of unplanned downtime.

### Complexity and Cognitive Load

Storey, M.-A. (2026). ["Cognitive Debt."](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) Applying cognitive debt to the gap between software complexity and team understanding.

Osmani, A. (2026). ["Comprehension Debt."](https://addyosmani.com/blog/comprehension-debt/) The gap between code volume and human understanding.

### Industry Voices

Hightower, K. (2019). ["We tend to build overly complex solutions and dedicate our careers justifying their existence."](https://github.com/tgogos/kelsey-hightower-wisdom)

Majors, C. (2022). ["The Future of Ops Is Platform Engineering."](https://www.honeycomb.io/blog/future-ops-platform-engineering) Developer cycles as a scarce resource and the case for outsourcing infrastructure.

Grugbrain.dev. (2022). ["The Grug Brained Developer."](https://grugbrain.dev/) A developer-voice treatment of complexity, Chesterton's Fence, and premature abstraction.
