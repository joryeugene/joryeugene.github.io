# AI Engineer World's Fair 2025: Takeaways & Spec
*By Jory Pestorious | San Francisco, June 2025*

At the AI Engineer World's Fair in San Francisco, Sean Grove's argument about specifications gave me a better way to describe the work around generated code. In [“The New Code”](https://www.riseos.com/blog/2025-06-15-the-new-code/), his essay based on the talk, Grove estimates that coding occupies 10 to 20 percent of his time. He spends the rest talking with users, distilling what he learns, planning, sharing the plan, and checking the result. His point is that structured communication becomes the bottleneck.

I came home with three labels for that loop: SPEC, EXPOSURE, and TASK DELTA. They are my synthesis, not a result measured at the conference. The framework records what a team intends to build, what users can actually observe, and the work required to close the difference.

## SPEC, EXPOSURE, and TASK DELTA

**SPEC** is the intended behavior. The spec names the user, the action, the constraints, and the evidence that will count as success. A useful spec can live in version-controlled Markdown. When discussion needs comments or sketches, a collaborative document can feed the final record, but the approved decision still needs one durable home.

**EXPOSURE** is the behavior a customer can observe. Exposure includes the interface, errors, latency, permissions, and recovery path. Source code can explain an implementation, but it does not replace checking the running product.

**TASK DELTA** is a specific difference between the two. If the spec requires keyboard operation and the product traps focus, that mismatch becomes a task with a reproducible check. A passing check closes the task; another tool or architecture does not create work by itself.

Together, the three labels form a five-step loop. The loop stops when the product meets the recorded success criteria:

1. Write the behavior and success criteria.
2. Build or change the product.
3. Observe the result under the stated conditions.
4. Record each mismatch as a bounded task.
5. Recheck the product after the task lands.

The comparison does not prove that a specification improves productivity. I have not run a controlled before-and-after study on this framework. This method gives the team a reviewable basis for deciding whether generated output is correct.

## Put evidence beside the decision

Teams should put the evidence needed to understand a decision in the spec, not every artifact they can collect. Customer feedback can establish the problem. A design can establish the intended interaction. A bug report, test failure, or production trace can establish the observed behavior. Each source needs an owner, access boundary, and retention rule before it is copied into an AI system. Slack messages, meeting transcripts, customer data, credentials, and internal logs do not become safe to share because they might improve context.

Start with shared Markdown because teammates can inspect and diff it. Add temporal memory, semantic retrieval, or graph relationships only when a concrete retrieval failure justifies them. A memory system that no one can audit can make stale context harder to find instead of easier.

## Parallel work still needs ownership

Git worktrees let separate processes work on separate branches without sharing a working directory. Containers can provide a repeatable environment and one useful isolation boundary. A secrets manager such as [1Password](https://1password.com/) can keep credentials out of prompts and repository files. None of these controls decides which changes belong together.

Parallel work is easiest to review when the spec divides it along clear interfaces. One branch can change the implementation, another can add the acceptance test, and a third can update the documentation, provided one person owns integration and checks the combined behavior. When tasks overlap in the same files or assumptions, running more agents creates merge and review work instead of removing it.

The quality checks also have different jobs. Static analysis catches classes of syntax and type errors. Tests check stated examples and invariants. A comparison against the spec checks whether the requested behavior survived implementation.

Production monitoring and user reports reveal conditions the earlier checks missed. An LLM can help locate a mismatch, but its review is another input, not proof that the product is correct. My conference note, `Bug prevention > Bug squashing`, means comparing the implementation with the spec before users have to report the difference.

## The conference WiFi test

When the conference WiFi failed during workshops, I watched cloud-dependent demonstrations stop. The failure did not show that local models were better, or that every team needed one. The outage showed that a workshop relying on a network service needed a tested fallback. For a demonstration, that might be a recording, a cached result, or a local path that has already been exercised on the presentation machine.

Simon Willison's [pelicans-on-bicycles comparison](https://simonwillison.net/2025/Jun/6/six-months-in-llms/) makes a related point about evaluation. A fixed, inspectable task tells me more than a general claim that one model or tool is better. The same discipline applies to a specification: hold the requested behavior steady, then compare the product with it.

## What the framework changes

The conference does not establish a productivity gain or return-on-investment multiple, and it does not identify a winning tool stack. Tool names, prices, and model rankings change too quickly to carry the argument. The durable part is the comparison between a recorded decision and observable behavior.

Someone must be able to use the specification to judge the product. SPEC records the decision. EXPOSURE supplies the evidence. TASK DELTA names the next piece of work. The comparison record lets a team change the code without losing the reason for the change.
