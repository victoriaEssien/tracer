# Working on Tracer

Conventions for anyone — human or agent — writing code in this repository.

## Git

**Commit messages are short.** A conventional-commit prefix, then a summary. Two lines maximum, and the second line is only for when the first genuinely cannot carry it.

```text
feat: score issue clarity from the issue body
fix: stop treating an old claim as an active one
docs: describe the two background jobs
chore: move the eslint ignore for next-env.d.ts
```

Prefixes in use: `feat:`, `fix:`, `copy:`, `chore:`, `docs:`, `refactor:`, `test:`, `security:`.

**No tool attribution.** Commit messages and pull request descriptions never mention the tool that wrote them — no `Co-Authored-By` trailers for an assistant, no "generated with" footers.

**Agents do not open pull requests.** Write the PR title and body as markdown and hand it over. Opening it is the maintainer's call.

## Before pushing

Run the slop cleaner over the change, then `pnpm lint` and `pnpm typecheck`. Do this after committing and before the push, so what lands is what was reviewed.

```bash
pnpm lint
pnpm typecheck
```

## Running the app

`pnpm dev` is the whole stack — the database is hosted, so there is no second service to start.

**Never run `pnpm build` while `pnpm dev` is running.** Both write to `.next`, and the production output is not something the dev server can serve: it dies with `ENOENT ... .next/server/pages/_document.js`. Stop dev first, or keep them apart:

```bash
pnpm exec next build --distDir .next-build
```

If it has already happened, `rm -rf .next` and restart. Check that port 3000 is actually free before restarting — a killed wrapper can leave the node process holding it, and the dev server will quietly move to 3001, which breaks OAuth because the callback URL is registered for 3000.

## Database

`pnpm db:push` is a dev convenience and needs an interactive terminal for its confirmation prompt. It only ever touches the dev branch.

Production schema changes go through a committed migration, and the production deploy applies it:

```bash
pnpm db:generate    # after editing schema.ts
git add drizzle/    # the migration is part of the change, not a side effect
```

`pnpm build` ends with `node scripts/migrate.mjs`, which applies any migration production has not seen yet. It runs only when `VERCEL_ENV` is `production`; a preview deployment or a local build prints why it is skipping and exits. If a migration fails, the build fails and nothing is promoted.

`pnpm db:migrate:prod` does the same thing from a terminal, for when a database needs fixing without a deploy.

Dev and production are separate Neon branches. On Vercel, `DATABASE_URL` is production. Locally it is dev, and production lives in `PROD_DATABASE_URL`, which nothing reads at runtime. Never point `push` at production: it reshapes the database to match the schema, dropping columns it does not recognise.

Two things the deploy step does not do, both of which shape how a migration should be written:

- **The schema changes before the new code is serving.** The build finishes, migrations run, then the deployment is promoted. For that window the old code runs against the new schema, so migrations must be additive. Drop a column in a later deploy, once nothing reads it.
- **A rollback does not roll the schema back.** Redeploying an older commit applies nothing and leaves the schema where it is.

A database with no tables fails every query with `42P01`. That is a missing migration, not a broken connection string.

## Package manager

pnpm. Not npm, not yarn. Setup instructions in the README and CONTRIBUTING use `pnpm`.

This machine runs pnpm 12, where the build-script allowlist lives in `pnpm-workspace.yaml` under `allowBuilds:` and is written by `pnpm approve-builds <pkg>`. The older `pnpm.onlyBuiltDependencies` key in `package.json` is ignored.

## Architecture boundaries

These are enforced in review. [`docs/architecture.md`](docs/architecture.md) has the reasoning.

1. Only `src/server/github/` talks to GitHub.
2. `src/server/analysis/` receives collected data. It never calls GitHub.
3. Scoring weights are read from `src/config/` and nowhere else.
4. Only `src/server/ai/` talks to an AI provider, and it sits behind an interface.
5. Route handlers stay thin. Logic lives in `src/server/`.
6. Schema changes come with a generated migration: `pnpm db:generate`, committed.

## Product constraints

From [`docs/spec.md`](docs/spec.md) section 3, and they are load-bearing:

- A score is never displayed without the reasoning that produced it.
- Estimates are labelled as estimates. Nothing promises how long an issue will take.
- AI output is visibly marked as inference and never overwrites an observed value.
- Labels are evidence, never proof.

## Code style

Match the file you are in. Comments explain why something is the way it is, not what the line does — if a line needs a comment to be read, rewrite the line.
