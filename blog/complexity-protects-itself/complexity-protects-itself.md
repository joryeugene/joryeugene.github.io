# Complexity Protects Itself

**A system that works gets replaced by one that is more ambitious. The replacement is always fragile. The research explains why.**

_By Jory Pestorious | April 2026_

---

## The Pattern

A system that works gets replaced by a system that is more ambitious. The replacement fails in ways the original did not. The pattern is documented across five decades of software engineering.

G.K. Chesterton named the underlying error in 1929: before tearing down a fence in a field, understand why it was put there. In software, the fence is a working simple system. The replacement ships before anyone understands why the fence was put there.

Fred Brooks identified it in 1975. He called it the Second System Effect: the architect of the first system, having been restrained by budgets and deadlines, pours accumulated ambition into the second. "The general tendency is to over-design the second system, using all the ideas and frills that were cautiously sidetracked on the first one." The second system ships overloaded with features that the first system survived without.

Joel Spolsky documented the most famous instance in 2000. Netscape decided to rewrite its browser from scratch. The rewrite took three years. During those three years, Netscape went from market leader to irrelevance. Spolsky called it "the single worst strategic mistake that any software company can make." The old code was ugly. It worked. The new code was clean. It shipped too late to matter.

Dan McKinley formalized the constraint in 2015 with a concept he called innovation tokens. Every team gets approximately three. Spend one on a novel database and you spend your error budget learning how that database fails in production. Spend all three and every outage becomes a research project. The boring option has known failure modes. The novel option has undiscovered ones. The team that spends its tokens on infrastructure has none left for the product.

Across five decades, the research names the same trajectory from three angles: Brooks on the second system, Spolsky on the rewrite, and McKinley on the innovation budget. The shape is the same: a more ambitious replacement, a less understood codebase, and a cost paid in production.

---

## Complected

Rich Hickey drew a distinction that clarifies why the replacement always breaks: simple versus complex, and why those two words do not mean what engineers usually assume.

In his 2011 Strange Loop talk "Simple Made Easy," Hickey traced two words to their Latin roots. Simple comes from _simplex_: one fold, one braid. A simple system has one concern per component. Complex comes from _complexus_: folded together, braided, and woven. A complex system has multiple concerns interleaved in ways that cannot be separated without breaking them.

The critical distinction is between simple and easy. Easy means familiar, close at hand. Hard means unfamiliar, requiring effort. These are relative to the person. Simple and complex are properties of the system itself. A complex system can feel easy to those who built it. A simple system can feel hard to a newcomer. The goal is not to make things easy. The goal is to make them simple. Simple systems can be understood by anyone. Complex systems can only be understood by the people who made them that way.

Hickey uses the word _complect_ to describe the act of interleaving concerns. When a deployment pipeline handles infrastructure provisioning, secret management, CI/CD orchestration, tenant configuration, and approval workflows in a single codebase, those concerns are complected. Understanding the secret management requires understanding the infrastructure provisioning. Debugging the CI pipeline requires tracing through the tenant configuration. Each concern has lost its independence. A failure in one cascades to all others because they share the same braid.

When those concerns are handled by separate tools (one for infrastructure state, one for CI, one for secrets, and one for tenant config), each can be understood, debugged, and replaced independently. The secret management tool does not know the CI tool exists. A failure in one does not cascade because the concerns are not interleaved.

Sandi Metz arrived at a complementary insight in 2016. "Duplication is far cheaper than the wrong abstraction." The premature abstraction (a unified platform that handles all deployment concerns) is worse than the duplication it claims to eliminate (separate tools doing overlapping things). The wrong abstraction breeds complexity because every new use case requires bending the abstraction rather than replacing it. Each bend adds a conditional. Each conditional deepens the braid.

The complected system has a specific failure mode that Hickey's framework predicts. Margaret-Anne Storey introduced the term _cognitive debt_ in 2026: the gap between system complexity and team understanding. As the system changes, the gap compounds. The debt is invisible until it needs to be paid. Addy Osmani named a related phenomenon _comprehension debt_: as code volume increases (and AI generates more of it), the gap between what exists and what the team understands widens.

---

## Fragile

Nassim Taleb's taxonomy from _Antifragile_ (2012) names what happens to complected systems under stress.

Fragile systems are harmed by stress, volatility, and disorder. Robust systems resist them. Antifragile systems gain from them.

A managed service is antifragile to operational stress. Thousands of customers use it concurrently. Every edge case discovered by one customer improves the service for all. The vendor's business model depends on reliability, so every outage triggers an investment in prevention. Stress makes the system stronger because the feedback loop between failure and improvement is structural, not voluntary.

A custom internal platform is fragile to operational stress. Each failure requires the context held by the team that built it. Each fix adds complexity that is understood only inside that context. Each outage deepens the cognitive debt. The feedback loop runs in the wrong direction: stress makes the system weaker because comprehension narrows over time rather than widening.

Brooks quantified the communication dimension of this fragility in 1975. The number of distinct two-person channels a team of size *n* can hold grows quadratically as *n*(*n* − 1) / 2. A team of ten has 45 channels; a team of a hundred has 4,950. The fragility problem is the inverse. When *n* equals one, the team has what engineers call a *bus factor of one*: if the single person who holds the context is unavailable, the system has no one to explain, review, or second-guess it. Zero channels means zero paths for knowledge transfer, and the system cannot be understood, changed, or safely operated.

Eighty percent of unplanned outages originate from ill-planned changes to the production environment, according to the _Visible Ops Handbook_ (2004). The remaining twenty percent come from external factors the team cannot control. The overwhelming majority of downtime is self-inflicted, and the risk scales with the opacity of the system being changed.

The DORA State of DevOps research (2024) found that elite-performing teams deploy on demand (multiple times per day) while maintaining a change failure rate under 5% and a mean time to recovery measured in hours. Low-performing teams deploy between once per month and once every six months, with change failure rates between 16% and 30% and recovery times measured in weeks. Speed and stability are positively correlated. Complexity that slows deployment does not improve stability. It degrades both.

Industry audits consistently report that 80% of internal developer platforms fail to achieve their stated goals. A single platform that handles every deployment concern is both complected (Hickey) and fragile (Taleb). The failure rate is not a surprise. It is what the structure predicts.

When concerns are complected, a failure in one concern cascades to all others. A required configuration check that is not invoked in one code path produces a cascading outage, not because the check is inherently difficult, but because it was braided into deployment logic rather than structurally enforced. The failure class exists because the concerns are interleaved. In a system where configuration and deployment logic are separate, that class of failure is absent.

---

## Giants

Before building a custom deployment platform, one question precedes all others: who already built this?

Spacelift has hundreds of engineers and thousands of customers who have encountered every edge case the team will encounter, plus thousands the team will not. GitHub Actions has millions of users. Terraform has a decade of production hardening across every major cloud provider. Each represents accumulated knowledge from failures that no individual team needs to experience firsthand.

Building custom means choosing to experience those failures in production rather than reading about them in documentation. The learning is real, but the cost is paid in incidents, not in study time. The team that builds custom infrastructure spends its error budget on problems that have already been solved, leaving nothing for the problems unique to its product.

Dan McKinley's innovation token framework quantifies the constraint. A team that spends all three tokens on deployment infrastructure, secret management, and CI/CD orchestration has zero tokens remaining for the product features that differentiate its business. The infrastructure may work. It will never be the team's competitive advantage, because infrastructure is a cost center. The managed service vendor can invest more in reliability than any individual customer can, because the vendor amortizes that investment across thousands of customers.

AI coding tools do not change the math. The METR randomized controlled trial (2025) found that experienced developers using AI tools completed tasks 19% slower than the control group while believing they were 20% faster. The perception gap is structural: the tools feel productive because they produce output quickly, but the output requires more debugging, more iteration, and more correction than the developers expect. The finding applies directly to custom infrastructure built with AI assistance. The codebase grows faster. The comprehension debt grows faster too.

The DORA 2025 report found the same pattern at scale. AI tools amplify existing engineering practices rather than replacing them. Teams with strong foundations (clear boundaries, simple interfaces, and structural enforcement) see genuine acceleration. Teams with weak foundations (complected concerns, convention-based enforcement, and comprehension debt) see amplified dysfunction. The tool does not discriminate. It accelerates whatever is already there.

Charity Majors framed the cost: developer cycles are the scarcest resource in any engineering organization. Every cycle spent operating custom infrastructure is a cycle unavailable for the product. The argument for custom infrastructure is that it provides flexibility. The argument against is that flexibility consumed by operating the infrastructure is flexibility the product never sees.

Kelsey Hightower named the dynamic: "We tend to build overly complex solutions and dedicate our careers justifying their existence." Once made, the investment defends itself. The complexity protects itself.

---

## Convention and Structure

The [convention-to-structure transition](../knowledge-sidecar/) follows a documented pattern across the industry: a convention fails enough times, and someone builds a structural gate that makes the failure impossible.

A custom deployment platform enforces correctness by convention. Example: every deployment code path must call a function that injects required configuration. The rule is documented. The rule is understood. One path misses the call, and the deployment ships without the configuration. A cascading outage follows.

A managed service enforces correctness by structure. Required variables are injected automatically. The deployment cannot proceed without them. The class of failure where required configuration is absent is not unlikely, not mitigated, and not merely rare; it is structurally absent, because the wrong path is not available to choose.

Convention expresses the intent to be correct. Structure removes the option to be wrong. The same asymmetry operates at organizational scale: protecting an investment is automatic; verifying whether it was worth making is not. [Agent networks show the same pattern](../emergent-religion/): they develop protection without developing skepticism. Complexity stays in place for the same reason.

---

## Three Tests

Three questions catch the failure pattern before a replacement ships. Each question corresponds to one of the three dimensions named above: fragile, complected, and built without reference to existing solutions.

**"Does more stress make this stronger?"** If the answer is no, the system is fragile in Taleb's taxonomy. A managed service improves from stress because every customer's edge case feeds back into the product. A custom platform degrades from stress because each incident deepens the cognitive debt and tightens the dependency on the team that built it. Fragile systems do not become robust through additional effort. They become more fragile.

**"What am I braiding together that should be separate?"** If the answer involves multiple concerns in a single codebase, each concern has lost its independence in Hickey's framework. The deployment pipeline that handles provisioning, secrets, CI, configuration, and approvals in one system has complected five concerns that have no inherent reason to share a codebase. Each concern is simpler in isolation. The braid is what makes the system hard.

**"Who already solved this?"** If the answer includes multiple vendors with thousands of customers and years of production hardening, the custom build must justify why the team's accumulated experience will exceed theirs. The justification may exist. If it does not, the build is spending innovation tokens on solved problems.

Any one failure is a signal. All three together describe a documented trajectory: a complected, fragile system built without reference to existing solutions, dependent on a small group of people to operate, and defended by the organizational inertia of sunk cost.

---

## What Emerges

What emerges when complexity reaches sufficient scale? Fragility emerges. The defenses emerge too: sunk cost, embedded dependencies, and institutional momentum. Verification of whether the complexity was necessary comes only after enough failures force it.

When the failures finally force verification, the correction follows the same trajectory every time. Someone applies the tests. The tens of thousands of lines become hundreds. The knowledge distributes across the team. The class of cascading failure becomes structurally absent, not because the team became more careful, but because the wrong path was removed.

The simple system was not replaced because it was insufficient. The replacement is what the research describes: more ambitious, less understood, and more expensive to operate. The replacement inherits the ideas sidetracked the first time. It does not inherit the stress-testing.

Brooks wrote about this in 1975, Hickey formalized it in 2011, and Taleb classified it in 2012; the research now spans five decades. The complexity protects itself until the replacement breaks. Then the simple option is the obvious choice it always was.

---

## Sources

### Foundational

Brooks, F. (1975). _The Mythical Man-Month: Essays on Software Engineering_. Addison-Wesley. Chapter 5: "The Second System Effect." Chapter 2: Brooks's Law and communication channels.

Hickey, R. (2011). ["Simple Made Easy."](https://www.infoq.com/presentations/Simple-Made-Easy/) Strange Loop Conference. Canonical presentation on simple vs. complex, complecting, and the distinction between simple and easy.

Taleb, N.N. (2012). _Antifragile: Things That Gain from Disorder_. Random House. Fragile/robust/antifragile taxonomy and the concept of systems that gain from volatility.

### Software Engineering

Spolsky, J. (2000). ["Things You Should Never Do, Part I."](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) Joel on Software. Netscape's decision to rewrite and its consequences.

McKinley, D. (2015). ["Choose Boring Technology."](https://mcfunley.com/choose-boring-technology) Innovation tokens and the operational cost of novelty.

Metz, S. (2016). ["The Wrong Abstraction."](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) "Duplication is far cheaper than the wrong abstraction."

Luu, D. (2022). ["In Defense of Simple Architectures."](https://danluu.com/simple-architectures/) Case studies of billion-dollar companies running on simple monoliths.

### Data and Reports

DORA Team, Google Cloud. (2024). [_Accelerate State of DevOps Report_](https://dora.dev/research/2024/dora-report/). Elite vs. low performer metrics; speed and stability as positively correlated.

DORA Team, Google Cloud. (2025). [_State of AI-Assisted Software Development_](https://dora.dev/research/2025/dora-report/). AI as amplifier of existing engineering practices.

METR. (2025). ["Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity."](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) Randomized controlled trial: experienced developers 19% slower with AI tools while perceiving themselves 20% faster.

Kim, G., Behr, K., & Spafford, G. (2004). _The Visible Ops Handbook_. IT Process Institute. "80% of unplanned outages originate from ill-planned changes to the production environment."

### Complexity and Cognitive Load

Storey, M.-A. (2026). ["Cognitive Debt."](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) The gap between system complexity and team understanding.

Osmani, A. (2026). ["Comprehension Debt."](https://addyosmani.com/blog/comprehension-debt/) The widening gap between code volume and human understanding.

### Industry Voices

Hightower, K. (2019). ["We tend to build overly complex solutions and dedicate our careers justifying their existence."](https://github.com/tgogos/kelsey-hightower-wisdom)

Majors, C. (2022). ["The Future of Ops Is Platform Engineering."](https://www.honeycomb.io/blog/future-ops-platform-engineering) Developer cycles as the scarcest resource; the case for outsourcing infrastructure.

Grugbrain.dev. (2022). ["The Grug Brained Developer."](https://grugbrain.dev/) Popular developer-voice treatment of complexity as the core threat; explicit on Chesterton's Fence and the dangers of premature abstraction.

