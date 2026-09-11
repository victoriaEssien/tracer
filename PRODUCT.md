# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want to contribute to open source and cannot work out where to start. Two shapes of the same problem:

- Developers who can already read an unfamiliar codebase and simply do not want to spend an evening triaging search results.
- People who have never opened a pull request on someone else's repository, for whom the blocker is knowing which issues are genuinely safe to pick up.

The second group needs a route into contributing at all, which the Resources surface serves. Neither group is assumed to be a beginner programmer.

## Product Purpose

Reduce the distance between "I want to contribute to open source" and "I know which issue I am taking and what I am getting into".

Tracer reads a repository and an issue, scores the fit against a user's stated skills and available time, and returns a verdict with the reasoning behind it. Success is not repositories indexed. It is how often a recommendation leads to someone actually attempting a contribution.

## Positioning

Not a better GitHub search. Searching `good first issue` returns thousands of results; the work Tracer does is deciding which of them are worth a person's Saturday, and showing its working.

The defensible mechanism is the analysis layer: issue availability inferred from comment history rather than labels, repository health from real merge and response latency, and a published scoring model that anyone can inspect and argue with.

## Operating Context

Used in short sessions, at a desk, usually when someone has decided they have a free evening or weekend and wants to spend it well. The user arrives with time and leaves with a decision, then goes to GitHub to do the actual work. Tracer is not where the contribution happens.

Returning users are triaging: a feed of 40 scored opportunities they need to get through quickly. First-time users are being convinced the scores mean something.

## Capabilities and Constraints

- GitHub OAuth sign-in; all analysis runs against public GitHub data.
- A skill profile: languages, frameworks, tools, learning goals, interests, contribution types, time available, experience level.
- Discovery, repository and issue analysis, a 0 to 100 Contribution Fit Score across eight weighted dimensions, an explanation, and a verdict of recommended, possible, or not recommended.
- Feed, deep dive, saved list with status refresh, dismissals, profile, and a personal learning loop that adjusts weights from saves and dismissals.
- An optional AI layer, off by default. The product must work fully without it.
- GitHub rate limits are the binding constraint on discovery. A run takes one to two minutes.
- Scoring weights live in `src/config/scoring.ts` and are published in `docs/scoring.md`.

## Brand Commitments

- Name: Tracer. Lowercase `tracer` as the wordmark.
- Positioning lines already in use: "Find open-source work worth doing" and "Stop searching. Start contributing."
- Voice: plain and direct. Short declaratives. Hedge only where the data genuinely does not support certainty, never as a verbal tic.
- MIT licensed, open source, intended to eventually recommend its own issues.

## Evidence on Hand

- `docs/spec.md`, `docs/architecture.md`, `docs/scoring.md`: the full product specification, module boundaries and published scoring methodology.
- Real scored output in the dev database: ten analysed issues across six repositories, scores 59 to 79.
- No customers, testimonials, usage numbers, or press. None may be invented.

## Product Principles

1. **Recommendations, not search results.** Make one decision easier rather than returning more options.
2. **Never show a score without its reasoning.** The explanation is the product; the number is a summary of it.
3. **Do not pretend certainty.** Estimates are ranges. Labels are evidence, never proof. Inference is marked as inference.
4. **Optimise for realistic contributions.** Active maintainers and clear issues beat star counts.
5. **Show the working.** The scoring model is published on purpose; a recommender nobody can inspect is not trustworthy.

## Accessibility & Inclusion

Keyboard operation matters: the feed is a triage queue and the audience lives on keyboards. Every control needs a visible focus state, status changes need to be announced, and colour is never the only carrier of a verdict.
