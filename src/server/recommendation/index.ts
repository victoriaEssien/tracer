/**
 * The recommendation engine.
 *
 * Combines the analysis engine's signals into one ranked, explainable result:
 * a score, a verdict, and the reasoning behind both.
 */

import { DIMENSION_WEIGHTS } from "@/config/scoring";
import { analyzeOpportunity, type AnalysisInput } from "@/server/analysis";
import type { AiInsights, Recommendation } from "@/types";

import { buildExplanation } from "./explain";
import { scoreOpportunity, type Weights } from "./score";
import { decideVerdict } from "./verdict";

export { buildExplanation, summarizeForFeed } from "./explain";
export { learnPreferences } from "./learning-loop";
export type { LearnedPreferences, LearningEvent } from "./learning-loop";
export { normalizeWeights, scoreOpportunity } from "./score";
export type { ScoreResult, Weights } from "./score";
export { decideVerdict } from "./verdict";

export interface RecommendInput extends AnalysisInput {
  /** Identifier of the stored issue, carried through to the result. */
  issueId: string;
  /** Personalised weights from the learning loop, or the defaults. */
  weights?: Weights;
  /** Optional AI insights, already generated. Never merged into observed data. */
  ai?: AiInsights | null;
}

export interface RecommendResult {
  recommendation: Recommendation;
  technologies: string[];
}

export function recommend(input: RecommendInput): RecommendResult {
  const { analysis, technologies } = analyzeOpportunity(input);

  const { score, breakdown } = scoreOpportunity(analysis, input.weights ?? DIMENSION_WEIGHTS);
  const { verdict, summary } = decideVerdict(score, analysis, breakdown);
  const explanation = buildExplanation(breakdown);

  return {
    technologies,
    recommendation: {
      issueId: input.issueId,
      score,
      verdict,
      summary,
      explanation,
      breakdown,
      analysis,
      ai: input.ai ?? null,
    },
  };
}
