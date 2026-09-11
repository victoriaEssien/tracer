# Architecture

This document describes the module boundaries the code is organised around. See [`spec.md`](spec.md) for the product requirements this structure serves.

## High level

```text
                    ┌─────────────────┐
                    │     GitHub      │
                    │      API        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ GitHub Data     │
                    │ Collector       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Analysis        │
                    │ Engine          │
                    ├─────────────────┤
                    │ Repo Health     │
                    │ Issue Analysis  │
                    │ Skill Matching  │
                    │ Difficulty      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Recommendation  │
                    │ Engine          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Web App     │
                    └─────────────────┘
```

Data flows one direction. Each layer depends only on the one above it.

## Layers

### 1. GitHub Data Collector (`src/server/github/`)

The only code in the project that talks to GitHub.

Responsibilities:

- Repository search and metadata
- Issues, labels, assignees, comments
- Pull requests and merge history
- Contributors and commit activity
- Rate limit accounting and backoff
- Caching of fetched data

Constraints:

- REST for most reads, GraphQL where it saves round trips
- Never scrape GitHub pages when an API endpoint exists
- Respect rate limits, cache aggressively, treat GitHub as expensive

### 2. Analysis Engine (`src/server/analysis/`)

Reads collected data and produces signals. Does not call GitHub directly, and does not know about users' scores.

Modules:

| Module | Produces |
| --- | --- |
| `repo-health` | maintenance activity, release cadence, PR throughput, warning flags |
| `maintainer-activity` | responsiveness estimates from historical issue and PR behaviour |
| `issue-status` | open, assigned, claimed, stale, already has a PR |
| `issue-clarity` | clarity rating plus the reasons behind it |
| `scope-estimation` | small, medium, large, or unclear, plus signals used |
| `skill-matching` | overlap with the user's languages, frameworks, and interests |
| `difficulty` | estimated difficulty, independent of GitHub labels |
| `learning-value` | overlap with the user's stated learning goals |

Constraints:

- Labels are a signal, never proof. A `good first issue` may be stale, claimed, or hard.
- Every signal carries its reasoning, not just a number. The explanation is a product feature, so it cannot be reconstructed after the fact.
- Never express certainty the data does not support.

### 3. Recommendation Engine (`src/server/recommendation/`)

Combines signals into a single ranked result.

Responsibilities:

- Weighted Contribution Fit Score, 0 to 100
- Explanation, both the positives and the things to know
- Verdict: recommended, possible, or not recommended
- Personal learning loop, adjusting toward what the user saves and away from what they dismiss

Weights live in `src/config/scoring.ts` and nowhere else, so they can be tuned without touching the scorer. The starting model is in [`scoring.md`](scoring.md).

### 4. AI Service (`src/server/ai/`)

Optional layer, behind a provider interface so OpenAI can be swapped later.

Tasks: issue summarization, difficulty reasoning, likely-files reasoning, a high-level contribution plan, and questions the contributor should verify before starting.

Constraints:

- The product must work with the AI layer disabled
- AI conclusions are tagged as inference and rendered differently from observed GitHub data
- AI never overwrites an observed value

### 5. Persistence (`src/server/db/`)

PostgreSQL on Neon, through Drizzle. Entities are listed in spec section 19: `User`, `UserSkill`, `Repository`, `Issue`, `Analysis`, `SavedOpportunity`. Three more exist because the product needs them: `Profile` (time, experience and contribution preferences), `DismissedOpportunity`, and `UserEvent`, which is the raw material for the personal learning loop. Auth.js owns `account`, `session` and `verificationToken`.

Collected GitHub data and computed analyses are both cached here. An `Analysis` row records the score, the verdict, and the per-dimension reasoning that produced them, so a recommendation can be explained later without recomputation. It is scoped to a user, because skill match, learning value and difficulty fit only mean something relative to a profile.

### 6. Web App (`src/app/`)

Route handlers under `src/app/api/` stay thin and delegate to `src/server/opportunities.ts`, which is the one service that composes collection, analysis, scoring and persistence. Pages: onboarding, feed, deep dive, saved, profile.

## Dependency rules

These are the rules worth enforcing in review:

1. Only `src/server/github/` imports a GitHub client.
2. `src/server/analysis/` never imports from `src/server/github/` at call time. It receives collected data.
3. Scoring weights are only read from `src/config/`.
4. Only `src/server/ai/` imports an AI SDK.
5. Route handlers contain no analysis or scoring logic.

## Background work

Two jobs run outside the request cycle:

- **Discovery and analysis** (`src/server/jobs/discovery.ts`). Candidate repositories and issues are collected and scored ahead of time so the feed is fast. A run is capped by candidate count and spread across repositories, because repository collection is the expensive half.
- **Saved opportunity refresh** (`src/server/jobs/refresh-saved.ts`). Saved issues are re-checked periodically for closure, assignment, a new PR, or significant change, so the user can be told when something they bookmarked is no longer available.

Both are exposed as `POST /api/jobs/*` for a scheduler to call.
