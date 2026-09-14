# Adding a scoring dimension

The Contribution Fit Score is a weighted sum of eight dimensions. Adding a
ninth touches six files, in this order. TypeScript will catch most of a
half-finished job, because the dimension list is a union type and three of the
structures around it are `Record<ScoreDimension, …>` — but it will not catch
the two things at the end, which are the ones that matter to a user.

Read [`scoring.md`](scoring.md) first. A new dimension is a claim about what
makes a contribution worth taking, and that is a product decision before it is
a code one.

## 1. Name it

`src/types/index.ts`, the `ScoreDimension` union:

```ts
export type ScoreDimension =
  | "skillMatch"
  …
  | "reviewLatency";
```

Every `Record<ScoreDimension, …>` in the project now fails to typecheck. That
list is your checklist for the rest of this.

## 2. Give it a weight and a label

`src/config/scoring.ts` — and nowhere else. Architecture rule 3 exists so that a
reviewer can see every weight in one file.

```ts
export const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  …
  reviewLatency: 0.05,
};

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  …
  reviewLatency: "Review speed",
};
```

**The weights must sum to 1.** `normalizeWeights` in
`src/server/recommendation/score.ts` will rescale them if they do not, so
nothing visibly breaks — the published weights in `scoring.md` just stop
matching the ones being applied. There is a test in
`src/config/scoring.test.ts` that holds you to it.

The label is what the user reads in "How the score was built". Write it as the
question the dimension answers, not as the name of the module.

## 3. Write the analysis module

A new file in `src/server/analysis/`, exporting a function that returns a
`Signal`:

```ts
export function analyzeReviewLatency(repo: CollectedRepository): Signal {
  return { score, confidence, reasons, concerns };
}
```

Three rules, all load-bearing:

- **It receives collected data and never calls GitHub** (architecture rule 2).
  If the signal needs something the collector does not gather yet, add it to
  `src/server/github/` and to `CollectedRepository` first, as its own change.
- **`score` is 0–1.** The scorer applies the weight; the module does not.
- **`reasons` and `concerns` are the point.** A score with no reasoning cannot
  be shown at all (spec section 3), so a dimension that cannot explain itself
  is not finished. Write them as sentences a contributor would say, and prefer
  an observed number — "27 outside pull requests merged in the last 90 days" —
  over an adjective.

Set `confidence` honestly. `low` when the underlying data was thin: it is
rendered next to the dimension, and it is how the product avoids pretending.

## 4. Wire it into the analysis

`src/server/analysis/index.ts` — export it at the top with its siblings, then
add it to the `dimensions` object inside `analyzeOpportunity`:

```ts
dimensions: {
  …
  reviewLatency: analyzeReviewLatency(repository),
},
```

Nothing else in the scorer needs changing. `scoreOpportunity` iterates the
weights, so the new dimension appears in the breakdown, in the explanation and
in the learning loop on its own.

## 5. Decide whether it can veto

`VERDICT_GUARDS.cappedByWeakness` in `src/config/scoring.ts` lists the
dimensions that pull a verdict down to "possible" when they are weak, whatever
the total says. Add yours only if being weak on it genuinely makes a
recommendation wrong — a slow review queue is worth knowing about, but it does
not make an issue a bad one to take.

Guards only ever push a verdict **down**. Nothing in this file can promote one.

## 6. Publish it

Two things TypeScript cannot check, and the two a user would notice:

- **`docs/scoring.md`** documents the methodology, including the weights. The
  score is meant to be something anyone can take apart, so a dimension that
  exists in the code but not in the published method is a broken promise.
- **The weights you changed to make room.** Adding a dimension at 0.05 means
  taking 0.05 from somewhere. Say which, in the pull request, and why.

## Checklist

- [ ] `ScoreDimension` in `src/types/index.ts`
- [ ] `DIMENSION_WEIGHTS` and `DIMENSION_LABELS` in `src/config/scoring.ts`
- [ ] Weights still sum to 1 (`pnpm test`)
- [ ] Analysis module in `src/server/analysis/`, returning a `Signal`
- [ ] Exported and wired in `src/server/analysis/index.ts`
- [ ] `VERDICT_GUARDS` considered, and left alone if it does not belong there
- [ ] `docs/scoring.md` updated, including which weights moved
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`
