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
