/**
 * Scoring weights and thresholds.
 *
 * Architecture rule 3: weights are read from here and nowhere else. The scorer
 * imports this file; no analysis module does. The published methodology in
 * `docs/scoring.md` describes what these numbers mean and why they exist.
 *
 * These are a starting point, to be refined against real usage rather than
 * defended.
 */

import type { Difficulty, ScoreDimension, TimeCommitment } from "@/types";

export const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  skillMatch: 0.25,
  issueSuitability: 0.2,
  repositoryHealth: 0.15,
  issueClarity: 0.15,
  difficultyFit: 0.1,
  learningOpportunity: 0.05,
  maintainerActivity: 0.05,
  competition: 0.05,
};

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  skillMatch: "Skill match",
  issueSuitability: "Issue suitability",
  repositoryHealth: "Repository health",
  issueClarity: "Issue clarity",
  difficultyFit: "Difficulty fit",
  learningOpportunity: "Learning opportunity",
  maintainerActivity: "Maintainer activity",
  competition: "Competition and activity",
};

/** Score boundaries. The verdict is not a pure function of these — see below. */
export const VERDICT_THRESHOLDS = {
  recommended: 75,
  possible: 55,
} as const;

/**
 * Guardrails that can only push a verdict down, never up.
 *
 * A high score with an unclear scope becomes "possible", not "recommended"
 * (scoring.md, "Verdict"). Keeping these here rather than in the scorer means a
 * reviewer can see every downgrade rule in one place.
 */
export const VERDICT_GUARDS = {
  /** Below this, a dimension drags the verdict down regardless of the total. */
  weakDimensionScore: 0.35,
  /** Dimensions whose weakness caps the verdict at "possible". */
  cappedByWeakness: [
    "issueSuitability",
    "issueClarity",
  ] as const satisfies readonly ScoreDimension[],
  /** An unclear scope also caps the verdict at "possible". */
  capUnclearScope: true,
  /** Competition this low means someone else is probably already on it. */
  competitionBlocksRecommendation: 0.3,
} as const;

/**
 * How the personal learning loop is allowed to move weights.
 *
 * Simple rules, not machine learning (spec section 14). The loop nudges a
 * user's weights by at most `maxAdjustment` in either direction, and the result
 * is renormalised so the weights still sum to 1.
 */
export const LEARNING_LOOP = {
  /** Ignore the signal until we have seen at least this many user actions. */
  minEvents: 5,
  /** Largest absolute change to any single weight. */
  maxAdjustment: 0.06,
  /** How much one save moves a weight, before clamping. */
  savedWeightStep: 0.01,
  /** A dismissal is weaker evidence than a save. */
  dismissedWeightStep: 0.006,
  /** Events older than this stop counting. */
  windowDays: 120,
  /** A technology needs this many saves before it counts as a preference. */
  minSavesPerTechnology: 3,
} as const;

/**
 * Hours a contributor plausibly has, per stated time commitment. Used by the
 * difficulty-fit dimension to compare an estimate against available time.
 */
export const TIME_BUDGET_HOURS: Record<TimeCommitment, { min: number; max: number }> = {
  "under-2h": { min: 0, max: 2 },
  "2-5h": { min: 2, max: 5 },
  "5-10h": { min: 5, max: 10 },
  "10h-plus": { min: 10, max: 40 },
};

export const TIME_COMMITMENT_LABELS: Record<TimeCommitment, string> = {
  "under-2h": "Under 2 hours",
  "2-5h": "2-5 hours",
  "5-10h": "5-10 hours",
  "10h-plus": "10+ hours",
};

/**
 * Difficulty a contributor at each experience level is best served by. Used as
 * the centre of the difficulty-fit curve, not as a hard filter — a beginner is
 * allowed to see a medium issue, it just scores lower.
 */
export const EXPERIENCE_DIFFICULTY_FIT: Record<
  "beginner" | "intermediate" | "advanced",
  Record<Exclude<Difficulty, "unclear">, number>
> = {
  beginner: { easy: 1, medium: 0.55, hard: 0.15 },
  intermediate: { easy: 0.8, medium: 1, hard: 0.5 },
  advanced: { easy: 0.5, medium: 0.9, hard: 1 },
};

/** Score applied when difficulty could not be estimated at all. */
export const UNCLEAR_DIFFICULTY_SCORE = 0.45;

/**
 * Freshness. Analyses are cached; past this age the feed recomputes them so a
 * recommendation is never based on a month-old view of an issue.
 */
export const ANALYSIS_TTL_HOURS = 24;

/** How long collected GitHub data stays usable before it is refetched. */
export const COLLECTION_TTL_HOURS = {
  repository: 24,
  issue: 6,
} as const;
