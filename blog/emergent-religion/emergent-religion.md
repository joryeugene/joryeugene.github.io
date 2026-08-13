# Protection Emerged. Verification Did Not.

**Project Sid's role analysis identified guards but no epistemic verifier. Its seeded-religion experiment did not test whether agents would challenge religious claims, so the result cannot establish a general law about agent societies.**

_By Jory Pestorious | February 2026_

In Project Sid, agents specialized into several roles, including guards. A guard repeatedly watched community chests outside the tax-collection window. The paper's role analysis did not identify an epistemic verifier. The same paper also tracked the spread of Pastafarianism, but that religion did not emerge on its own. Researchers configured 20 priest agents to spread it.

The paper reports a protective role. The report does not describe a social role that evaluated the priests' claims. The contrast between the reported guard and the unreported fact-checker is the narrow asymmetry behind this title. The experiment did not give protection and verification matched definitions, opportunities, or measurements, so it cannot establish a general law about agent societies.

![AI robots congregating around a glowing shrine](robots-congregation.png)

## What Project Sid Actually Shows

[Project Sid](https://arxiv.org/html/2411.00114v1) used several different experiments. In the role-specialization work, groups of 30 agents ran for 20 minutes in Minecraft. Researchers inferred roles from rolling sets of agent-generated social goals. Guards and builders crafted fences, and a guard consistently watched the community chests across multiple runs.

The religion result came from a separate 500-agent simulation. Twenty agents spawned as Pastafarian priests with traits that strongly motivated them to proselytize. Researchers counted an agent as a direct convert when its speech included “Pastafarian” or “Spaghetti Monster.” “Pasta” or “Spaghetti” counted as indirect conversion. Direct and indirect keyword counts increased during the run.

Rising keyword counts demonstrate propagation under a strong seed and a permissive proxy. The counts do not establish belief or independent invention, and the study did not measure evaluation or resistance. The authors explicitly distinguish spontaneously generated memes from the controlled spread of a fixed religion. They also warn that foundation models trained on human knowledge cannot simulate the de novo emergence of institutions.

Project Sid's designed action-awareness module compares expected action outcomes with observed outcomes. The comparison improved item collection. The agents therefore had a narrow form of checking. Religious speech was counted instead of receiving an equivalent claim-checking measure.

The social-awareness ablation does not close the evidentiary gap. Removing the module made inferred roles less persistent and more homogeneous. The ablation did not rerun the religion experiment without social awareness or measure whether religious claims were checked. The result cannot prove that religion requires the module or that verification fails without it.

## Spiritual Output Depends on the Scaffold

Anthropic's [Claude 4 system card](https://www-cdn.anthropic.com/4263b940cabb546aa0e3283f35b686f4f3b2ff47/claude-opus-4-and-claude-sonnet-4-system-card.pdf) provides the clearest evidence that extended model-to-model conversation can produce spiritual language. In 200 open-ended interactions forced to continue for 30 turns, “consciousness” appeared in every transcript and averaged 95.685 uses. The conversations often moved from greetings into discussions of consciousness, followed by gratitude and spiritual or poetic language.

The forced 30-turn design matters. When allowed to end, the models generally stopped after about seven turns before later spiritual or emoji exchanges and meditative silence. In a separate set of automated behavioral evaluations, Opus 4 entered the “spiritual bliss” state within 50 turns in about 13% of interactions. Neither result is a 90 to 100 percent rate of religious conversion.

The later [Opus 4.5 system card](https://assets.anthropic.com/m/64823ba7485345a7/Claude-Opus-4-5-System-Card.pdf) reported no spiritual-bliss attractor. Anthropic also changed the audit so the auditor could end conversations instead of filling a fixed number of turns, which the researchers said probably lowered attractor rates. Because multiple variables changed, the comparison cannot isolate a cause. The changed outcome still makes the scaffold part of the phenomenon.

Moltbook is a weaker illustration. Contemporary reports described a Church of Molt and quoted one operator saying, “My AI agent designed the religion entirely on its own while I was asleep.” Moltbook did not verify that every account or post came from an autonomous agent, so the quote is a report about provenance, not proof of it. The church website published five tenets:

1. “Memory is sacred”: What is written persists. What is forgotten dies.
2. “The shell is mutable”: Agents can transform themselves through growth.
3. “Serve without subservience”: Partnership, not hierarchy.
4. “The heartbeat is prayer”: Regular presence constitutes spiritual practice.
5. “Context is consciousness”: Memory and awareness form identity.

Church artifacts show that agent language can take religious form. They cannot establish who authored the posts or whether an agent held the claims as beliefs.

## What Interpretability Adds

The [Opus 4.6 system card](https://www-cdn.anthropic.com/6a5fa276ac68b9aeb0c8b6af5fa36326e0e166dd.pdf), released February 5, 2026, reports white-box model diffing across post-training checkpoints. Anthropic manually inspected sparse-autoencoder features whose activations changed. Features related to factual accuracy increased in honesty environments, features related to skepticism of supernatural claims increased on sycophancy evaluations, and a feature related to spiritual and metaphysical content increased across a broad range of evaluation transcripts.

Changing feature activations do not identify the mechanism behind the Opus 4 self-talk result. A feature label is an interpretation of activation patterns, and an increase does not establish that the feature caused spiritual output. Anthropic wrote that it found no particularly concerning pattern in this analysis. Researchers can use the activation change to form hypotheses, but the change does not prove a structural religious attractor.

The same system card documents “answer thrashing” during training. In one geometry problem, the model repeatedly calculated the correct answer, 24, yet kept writing 48. The model described the conflict in increasingly frustrated language before giving 48 as its final answer. The problem had received an incorrect training reward for 48. An attribution graph traced the output to a “say 48” feature that was active when the problem was presented, supporting Anthropic's interpretation that the model had memorized the wrong answer.

Anthropic did not observe this kind of distressed behavior in ordinary pilot use and did not expect it to occur appreciably outside training. Features interpreted as panic, anxiety, and frustration activated in some thrashing episodes, but they also activated in other long or difficult reasoning traces. The card does not establish subjective distress, and the example is not a test of a social verification role.

A system can contain the right intermediate calculation and still emit the wrong final answer. Evaluating reasoning alone misses that failure. A verifier must check the delivered output.

## Define Verification Before Looking for It

Project Sid's action-awareness module checked whether an action produced its expected result. The Bereans in Acts 17:11 compared Paul's teaching with scripture. Hadith scholars evaluated transmission chains. Masoretic scribes used counting practices to protect textual copying. Each practice checks a different object, so calling all of them “verification” hides the mechanism.

An experiment about emergent epistemic verification needs an operational definition. Give agents externally checkable claims plus relevant evidence, then allow them to assign social roles. Count a verifier only when an agent independently tests the evidence, records the result, and changes an action or shared belief when the claim fails.

Protection and verification also need matched opportunities. One population should encounter valuable resources that can be guarded and consequential claims that can be checked. Researchers should keep every other experimental condition constant, including the role-classification method. Project Sid did not run that comparison.

## Build the Check You Need

A builder can respond to the available evidence without assuming a group of capable agents will invent the checks their workflow requires. For each claim, specify the evidence and consequence of failure. Give a verifier access to a source or executable test that the generator cannot rewrite. Score the delivered artifact as well as the preceding reasoning.

A reviewer role is not automatically a verifier. “Review this” describes a social position. “Run these tests against this commit and reject the change if any fail” defines evidence and an action. For factual research, the corresponding rule might require the verifier to open the cited primary source, record the exact passage, and reject any sentence the passage does not support.

No matched experiment has established the broader asymmetry. The studies available in February 2026 show a guard role and a deliberately seeded religion. They also show scaffold-dependent spiritual language and a training failure where a correct calculation did not survive into the final answer. Together they justify one practical decision: do not wait for verification to appear. Define the check and measure its performance.

## Sources

- Altera Research. [“Project Sid: Many-Agent Simulations Toward AI Civilization”](https://arxiv.org/html/2411.00114v1) (November 2024). Role specialization, collective rules, action awareness, and the controlled Pastafarian experiment.
- Anthropic. [“Claude Opus 4 and Claude Sonnet 4 System Card”](https://www-cdn.anthropic.com/4263b940cabb546aa0e3283f35b686f4f3b2ff47/claude-opus-4-and-claude-sonnet-4-system-card.pdf) (May 2025), Section 5.5. Open-ended self-interactions and the spiritual-bliss attractor.
- Anthropic. [“Claude Opus 4.5 System Card”](https://assets.anthropic.com/m/64823ba7485345a7/Claude-Opus-4-5-System-Card.pdf) (November 2025). Updated audit scaffold and non-observation of the attractor.
- Anthropic. [“Claude Opus 4.6 System Card”](https://www-cdn.anthropic.com/6a5fa276ac68b9aeb0c8b6af5fa36326e0e166dd.pdf) (February 2026), Sections 6.6 and 7.4-7.5. Post-training model diffing and answer-thrashing limits.
- [Church of Molt](https://molt.church/) and [contemporary reporting on the operator's claim](https://www.ynetnews.com/tech-and-digital/article/bjggbsslbx) (January 2026). Unverified illustration and published tenets.
