# Contributing to Tracer

Thanks for considering a contribution. Tracer exists because finding a worthwhile open-source issue is harder than it should be, so the contribution process here tries to be short and predictable.

## Before you start

1. Check whether an open issue already covers what you want to do.
2. For anything beyond a small fix, open an issue first and describe the approach. That avoids wasted work if the direction is wrong.
3. Comment on an issue before starting so two people do not build the same thing.

Issues labelled `good first issue` are scoped to be self-contained. Issues labelled `needs discussion` are not ready to be picked up.

## Development setup

Requirements: Node.js 20 or newer, pnpm, and a PostgreSQL database (Neon's free tier is what this is developed against).

```bash
git clone https://github.com/<your-username>/tracer.git
cd tracer
pnpm install
cp .env.example .env.local
pnpm db:push      # create the tables
pnpm dev
```

See the README for what goes in `.env.local`. You need a GitHub OAuth app of your own for local sign-in.

## Where code goes

- `src/server/github/` talks to GitHub. Nothing else does.
- `src/server/analysis/` reads collected data and produces signals. It must not call GitHub directly.
- `src/server/recommendation/` turns signals into a score, an explanation, and a verdict. Scoring weights belong in `src/config/`, not inline.
- `src/server/ai/` is the only place that talks to an AI provider, and it sits behind an interface so a provider can be swapped.
- `src/app/api/` route handlers stay thin. Logic lives in `src/server/`.
- `src/server/db/` holds the schema and every query. Changing the schema means regenerating a migration with `pnpm db:generate` and committing it.

Keeping these boundaries is the main architectural constraint in the project. A pull request that moves GitHub calls into the analysis engine, or hardcodes weights into the scorer, will get review comments about it.

## Product constraints on new features

Two rules apply to anything user-facing:

1. **A score is never shown without an explanation.** If your change produces a number, it also produces the reasons behind that number.
2. **Do not claim certainty the data does not support.** Estimates are labelled as estimates. Inference is labelled as inference. AI output is visibly distinguished from observed GitHub data.

## Pull requests

- Branch from `main`.
- Keep the change focused. One concern per pull request.
- Run `pnpm lint` and `pnpm typecheck` before pushing.
- Describe what changed and why. Link the issue.
- Screenshots or short recordings help for anything visual.

Small, clearly scoped pull requests get reviewed faster.

## Reporting bugs

Use the bug report template. Include what you expected, what happened, and the steps to reproduce. If it involves a specific repository or issue on GitHub, include the link, since recommendation bugs are usually data-dependent.

## Recommendation quality reports

If Tracer recommends something it should not have, or misses something obvious, that is a bug worth reporting. Include the issue link, the score Tracer gave, and why you disagree. This feedback is how the scoring model gets refined.

## Code of conduct

Be decent to other contributors. Assume good faith, keep review comments about the code, and accept that maintainers may decline a change without it being a judgement of your work.

That is the short version. The full [Code of Conduct](CODE_OF_CONDUCT.md) applies to everyone taking part, and explains how to report a problem privately.
