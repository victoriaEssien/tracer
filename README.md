# Tracer

**Find open-source work worth doing.**

Tracer analyzes GitHub repositories and issues to answer one question: *is this actually a good contribution for me?*

It is not a better GitHub search. Searching `good first issue` returns thousands of results, many of them stale, already claimed, badly specified, or far harder than the label suggests. Tracer looks at the repository, the issue, and your own skills, then gives each opportunity a Contribution Fit Score, an explanation of that score, and a plain verdict on whether you should take it.

> Stop searching. Start contributing.

## Status

The V1 scope from [`docs/spec.md`](docs/spec.md) section 21 is implemented: GitHub sign-in, a skill profile, discovery, repository and issue analysis, the Contribution Fit Score with its explanation, the feed, the deep dive, save and dismiss, the saved-opportunity refresh, and the optional AI layer.

What it has not had yet is real use. The scoring weights in [`src/config/scoring.ts`](src/config/scoring.ts) are the starting model from [`docs/scoring.md`](docs/scoring.md), not numbers refined against how often a recommendation actually leads to a contribution. Disagreeing with a recommendation is a useful bug report — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Next.js route handlers and server modules |
| Database | PostgreSQL on [Neon](https://neon.tech), via Drizzle ORM |
| Auth | GitHub OAuth through Auth.js (NextAuth v5) |
| Data source | GitHub REST API, GitHub GraphQL API where it saves round trips |
| AI (optional) | Provider-agnostic service layer, OpenAI first |

## Local setup

Requirements: Node.js 20 or newer, pnpm, and a PostgreSQL database.

```bash
git clone <your-fork-url> tracer
cd tracer
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`:

1. Create a GitHub OAuth app at <https://github.com/settings/developers> with callback URL `http://localhost:3000/api/auth/callback/github`, then set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
2. Point `DATABASE_URL` at a Neon project (the free tier is enough). Any PostgreSQL database works.
3. Set `AUTH_SECRET` — `npx auth secret` generates one.
4. The AI layer is optional. Leave `AI_PROVIDER=none` to run without it; the product is designed to work with it switched off.

Create the tables, then start:

```bash
pnpm db:push
pnpm dev
```

The app runs at <http://localhost:3000>. Sign in, fill in the profile, and the first discovery run starts automatically.

## Scripts

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm db:push      # sync the schema to the database
pnpm db:generate  # generate a SQL migration from the schema
pnpm db:studio    # browse the database
```

## Project layout

```text
src/
  app/                    routes and route handlers
    api/                  internal API (see spec section 20)
    onboarding/           skill and preference profile
    feed/                 ranked opportunity feed
    opportunities/[id]/   repository and issue deep dive
    saved/                bookmarked opportunities
    profile/              account and preferences
  components/             UI, grouped by feature
  server/
    github/               GitHub data collector, caching, rate limits
    analysis/             repo health, issue analysis, skill match, difficulty
    recommendation/       scoring, explanation, verdict, learning loop
    ai/                   provider-agnostic AI service
    db/                   schema, client, queries
    jobs/                 discovery and saved-opportunity refresh
    opportunities.ts      the service the routes and pages call
  config/                 scoring weights, label sets, skill catalog
  lib/                    shared helpers
  types/                  shared TypeScript types
docs/
  spec.md                 full product specification
  architecture.md         architecture and module boundaries
  scoring.md              recommendation methodology
```

GitHub-specific services stay separate from recommendation logic. The analysis engine reads collected data and does not call GitHub directly.

## Principles

These are load-bearing, not decoration. See spec section 3.

- **Recommendations over search results.** Make the decision easier, do not return hundreds of repositories.
- **Explain every recommendation.** Never show a score without showing what produced it.
- **Optimize for realistic contributions.** A 100k-star repository is not automatically a better opportunity than a 2k-star one.
- **Avoid pretending certainty.** Say "likely", "appears to", "estimated". Never promise that an issue will take a specific amount of time.
- **Distinguish observed data from inference.** Anything the AI layer concluded must be visibly marked as such.
- **Dogfood it.** The tool should be good enough to find its author real contributions, and eventually good enough to recommend its own issues.

## Background jobs

Two things run outside the request cycle:

- **Discovery.** `POST /api/jobs/discovery` searches GitHub for candidate issues, collects them, and scores them against a profile. The feed's "find more" button calls it; a scheduler can too, with `Authorization: Bearer $CRON_SECRET` and a `userId` in the body.
- **Saved-opportunity refresh.** `POST /api/jobs/refresh-saved` re-checks saved issues for closure, assignment or a new pull request, and records what changed. Scheduler-only, and it needs `GITHUB_TOKEN` for its rate-limit budget.

On Vercel, both fit a `vercel.json` cron entry. Anything that can make an authenticated POST on a schedule works.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues labelled `good first issue` are a reasonable place to start.

## License

MIT. See [LICENSE](LICENSE).
