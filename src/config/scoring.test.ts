import { describe, expect, it } from "vitest";

import {
  DIMENSION_LABELS,
  DIMENSION_WEIGHTS,
  VERDICT_GUARDS,
  VERDICT_THRESHOLDS,
} from "./scoring";

describe("the scoring weights", () => {
  it("sum to 1", () => {
    // `normalizeWeights` would rescale them silently, so the only thing that
    // would break is the published methodology in docs/scoring.md matching the
    // numbers actually applied. See docs/adding-a-dimension.md.
    const total = Object.values(DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("give every dimension a weight and a label", () => {
    expect(Object.keys(DIMENSION_LABELS).sort()).toEqual(Object.keys(DIMENSION_WEIGHTS).sort());
  });

  it("give every dimension a label written for a reader, not a module name", () => {
    for (const label of Object.values(DIMENSION_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/[A-Z][a-z]+[A-Z]/); // camelCase leaking through
    }
  });

  it("has no negative or zero weight", () => {
    for (const weight of Object.values(DIMENSION_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0);
    }
  });
});

describe("the verdict guards", () => {
  it("only name dimensions that exist", () => {
    for (const dimension of VERDICT_GUARDS.cappedByWeakness) {
      expect(DIMENSION_WEIGHTS).toHaveProperty(dimension);
    }
  });

  it("put the recommended threshold above the possible one", () => {
    expect(VERDICT_THRESHOLDS.recommended).toBeGreaterThan(VERDICT_THRESHOLDS.possible);
  });

  it("keep the weakness bar below the thresholds it can veto", () => {
    // A guard that fired at every score would make the total meaningless.
    expect(VERDICT_GUARDS.weakDimensionScore).toBeLessThan(0.5);
  });
});
