## What this changes

<!-- One or two sentences. -->

## Why

<!-- Link the issue: Closes #123 -->

## How

<!-- Notable implementation decisions, and anything a reviewer should look at closely. -->

## Screenshots

<!-- For anything user-facing. Delete if not applicable. -->

## Checklist

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] The change is focused on one concern
- [ ] Layer boundaries respected: GitHub calls only in `src/server/github/`, scoring weights only in `src/config/`, AI calls only in `src/server/ai/`
- [ ] Any score or estimate this introduces is shown with its reasoning
- [ ] Any AI-generated conclusion is visibly distinguished from observed GitHub data
- [ ] Documentation updated if behaviour or setup changed
