# Recommendation methodology

Tracer's scoring is published on purpose. A recommendation engine nobody can inspect is not trustworthy, and transparent methodology is one of the project's open-source priorities (spec section 23).

This document records the starting model. It is implemented in [`src/config/scoring.ts`](../src/config/scoring.ts) (the weights and the verdict guardrails), [`src/server/recommendation/score.ts`](../src/server/recommendation/score.ts) (the arithmetic) and [`src/server/recommendation/verdict.ts`](../src/server/recommendation/verdict.ts) (the verdict).

## Contribution Fit Score

Each opportunity gets a score from 0 to 100, made up of weighted dimensions:

| Dimension | Weight | What it measures |
| --- | --- | --- |
| Skill match | 25% | Overlap between the repository's technologies and what the user knows |
| Issue suitability | 20% | Whether the issue is genuinely available and appropriate to pick up |
| Repository health | 15% | Maintenance activity, contribution throughput, project vitality |
| Issue clarity | 15% | Whether the issue says enough to act on |
| Difficulty fit | 10% | Match against the user's experience level and available time |
| Learning opportunity | 5% | Overlap with the user's stated learning goals |
| Maintainer activity | 5% | Likelihood a submitted PR gets reviewed |
| Competition and activity | 5% | Whether someone else appears to be on it already |

Weights live in `src/config/scoring.ts`. They are a starting point, to be refined against real usage rather than defended.

## Verdict

The score maps to one of three verdicts, which is the part the user actually reads:

- **Recommended.** "You should probably take this one."
- **Possible.** "Worth considering."
- **Not recommended.** "Probably skip this one."

A verdict is never shown without its reasoning. A high score with an unclear issue scope becomes "possible", not "recommended", so verdict boundaries are not a pure function of the score.

## Rules the scorer must follow

1. **Labels are evidence, not proof.** A `good first issue` label raises a prior. It does not set difficulty.
2. **Stars are weakly informative.** A 2k-star project with responsive maintainers beats a 100k-star project with a six-month review backlog.
3. **No single metric condemns a project.** Warning signs are surfaced as concerns, not as a verdict.
4. **Learning goals can offset a skill gap.** A partial technology match that matches a learning goal is not penalised as heavily as a plain mismatch.
5. **Estimates stay estimates.** Time and difficulty are reported as ranges with hedged language.
6. **Every dimension carries its reasons.** Reasoning is produced with the score, not reconstructed afterwards.

## Personal learning loop

The engine adjusts to behaviour: saved issues, dismissed issues, viewed projects, and the technologies, contribution types, and difficulty levels associated with each.

This starts as simple rules that nudge weights per user. Machine learning is explicitly out of scope for V1.

## Evaluating the model

The metric that matters is not how many repositories are indexed. It is how often a recommendation leads to someone actually attempting a contribution. Changes to weights should be justified against that, not against how plausible the numbers look.
