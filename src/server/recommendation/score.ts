/**
 * The Contribution Fit Score.
 *
 * A weighted sum, kept deliberately boring: the interesting part of this
 * product is the reasoning that travels with the number, not the arithmetic.
 * Weights come from `src/config/scoring.ts` and nowhere else (architecture
 * rule 3).
 */

import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/config/scoring";
import { clamp } from "@/lib/utils";
import type { OpportunityAnalysis, ScoreBreakdownEntry, ScoreDimension } from "@/types";

export type Weights = Record<ScoreDimension, number>;

export interface ScoreResult {
  /** 0-100, rounded. */
  score: number;
  breakdown: ScoreBreakdownEntry[];
}

export function scoreOpportunity(
  analysis: OpportunityAnalysis,
  weights: Weights = DIMENSION_WEIGHTS,
): ScoreResult {
  const normalized = normalizeWeights(weights);
  const breakdown: ScoreBreakdownEntry[] = [];
  let total = 0;

  for (const dimension of Object.keys(normalized) as ScoreDimension[]) {
    const signal = analysis.dimensions[dimension];
    const weight = normalized[dimension];
    const raw = clamp(signal.score);
    const contribution = raw * weight * 100;
    total += contribution;

    breakdown.push({
      dimension,
      label: DIMENSION_LABELS[dimension],
      weight,
      raw,
      contribution,
      confidence: signal.confidence,
      reasons: signal.reasons,
      concerns: signal.concerns,
    });
  }

  breakdown.sort((a, b) => b.contribution - a.contribution);

  return { score: Math.round(clamp(total, 0, 100)), breakdown };
}

/**
 * Keeps weights summing to 1 after the learning loop has nudged them, so a
 * personalised score stays comparable to a default one.
 */
export function normalizeWeights(weights: Weights): Weights {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return { ...DIMENSION_WEIGHTS };

  const result = {} as Weights;
  for (const [dimension, weight] of Object.entries(weights) as [ScoreDimension, number][]) {
    result[dimension] = weight / total;
  }
  return result;
}
