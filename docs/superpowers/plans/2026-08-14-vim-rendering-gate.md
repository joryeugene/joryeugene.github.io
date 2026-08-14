# Phalene-Vim Rendering Gate Decision

**Status:** Closed. No production rendering change.

**Decision date:** 2026-08-14

**Baseline commit:** `331c890`

## User outcome

The current renderer already returns a visible completion result on a 10,000-line document within the approved latency target. A viewport renderer, virtual DOM, canvas editor, worker, or rendering cache would add architecture without unlocking a currently blocked user journey.

## Exact measured journey

The focused Wave 6 Chromium journey created one localStorage-backed browser document with exactly 10,000 lines:

```text
ULTRA_
ULTRA_VIOLET_BEACON
filler_0
...
filler_9997
```

The journey opened that document with `:e completion-10000`, entered Insert mode at the end of `ULTRA_`, synchronously dispatched `Ctrl-N` through the real document key handler, and measured from immediately before dispatch until the handler returned. The measured interval includes candidate scanning, buffer mutation, and the existing full `render()` call. The visible first line had to become `ULTRA_VIOLET_BEACON`.

Environment:

- Local static site and real `/vim/` page.
- Playwright Chromium.
- One worker.
- One browser test process at a time.
- No test-only editor state hook.

## Evidence

| Serial attempt | Visible result | Input-to-render time | Focused test time |
|---|---|---:|---:|
| Wave 6 first GREEN | `ULTRA_VIOLET_BEACON` | 28.9 ms | 3.9 s |
| Wave 6 final GREEN | `ULTRA_VIOLET_BEACON` | 31.2 ms | 4.5 s |

Both attempts passed the 100 ms completion KPI. Both individual measurements also stayed below the Wave 8 10,000-line ordinary-key target of 88.44 ms, even though completion does more work than an ordinary motion.

## Gate result

The approved vision opens rendering work only after a required journey misses its latency target twice in serial measurements. This journey passed twice. The gate therefore remains closed.

No median, p95 profile, or production rendering experiment is warranted now. Those are required before implementation only after the gate opens. Running a new benchmark suite here would add proof machinery without changing the product decision.

## Cost and constraints

- Production files changed: none.
- Runtime bytes added: 0.
- Gzip growth: 0.
- Dependencies added: none.
- New verification process: none. This decision reuses the two completed one-worker browser measurements.

## Reopen condition

Reopen Wave 8 only if the real `:teacher` project or another approved large-buffer journey misses its visible latency target twice in serial runs. Then capture exact file size, input sequence, warm-up, median, p95, and a profile naming the dominant cost before editing the renderer.

## Largest remaining gap

The six-file Phalene Analytics `:teacher` experience is not built yet. That capstone is the next user-visible product outcome.
