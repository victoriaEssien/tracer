/**
 * "Should I take this?"
 *
 * The defining product feature (spec section 12). The verdict is not a pure
 * function of the score: a high score with an unclear issue becomes "possible",
 * because the number is an average and an average can hide the one thing that
 * will waste your weekend.
 *
 * Every rule here can only move a verdict *down*.
 */

import { VERDICT_GUARDS, VERDICT_THRESHOLDS } from "@/config/scoring";
import { formatHours } from "@/lib/utils";
import type { OpportunityAnalysis, ScoreBreakdownEntry, Verdict } from "@/types";

export interface VerdictResult {
  verdict: Verdict;
  /** One sentence, in the user's terms. */
  summary: string;
}

export function decideVerdict(
  score: number,
  analysis: OpportunityAnalysis,
  breakdown: ScoreBreakdownEntry[],
): VerdictResult {
  let verdict: Verdict =
    score >= VERDICT_THRESHOLDS.recommended
      ? "recommended"
      : score >= VERDICT_THRESHOLDS.possible
        ? "possible"
        : "not-recommended";

  // Availability is a floor, not a weight. An issue somebody else is already
  // shipping is not a recommendation at any score.
  const availability = analysis.status.availability;
  if (availability === "closed") {
    return {
      verdict: "not-recommended",
      summary: "This issue is no longer open.",
    };
  }
  if (availability === "has-pull-request" || availability === "assigned") {
    verdict = "not-recommended";
  } else if (availability === "likely-claimed" && verdict === "recommended") {
    verdict = "possible";
  }

  // A weak dimension the user would feel immediately caps the verdict.
  for (const dimension of VERDICT_GUARDS.cappedByWeakness) {
    const entry = breakdown.find((item) => item.dimension === dimension);
    if (entry && entry.raw < VERDICT_GUARDS.weakDimensionScore && verdict === "recommended") {
      verdict = "possible";
    }
  }

  if (VERDICT_GUARDS.capUnclearScope && analysis.scope === "unclear" && verdict === "recommended") {
    verdict = "possible";
  }

  const competition = breakdown.find((item) => item.dimension === "competition");
  if (
    competition &&
    competition.raw < VERDICT_GUARDS.competitionBlocksRecommendation &&
    verdict === "recommended"
  ) {
    verdict = "possible";
  }

  return { verdict, summary: summarize(verdict, analysis) };
}

/**
 * The sentence under the verdict. Hedged by design: "appears", "estimated",
 * never a promise about how long something will take (spec section 3.4).
 */
function summarize(verdict: Verdict, analysis: OpportunityAnalysis): string {
  const availability = analysis.status.availability;

  if (availability === "has-pull-request") {
    return `Someone has already opened a pull request for this (#${analysis.status.openPullRequestNumber}).`;
  }
  if (availability === "assigned") {
    return `This is already assigned to ${analysis.status.assignees.map((login) => `@${login}`).join(", ")}.`;
  }
  if (availability === "likely-claimed") {
    return "Someone appears to have claimed this in the comments, so check before starting.";
  }

  const hours = analysis.estimatedHours ? formatHours(analysis.estimatedHours) : null;

  if (verdict === "recommended") {
    const pieces = [
      `The stack matches what you know`,
      analysis.clarity === "high" ? "the issue is clearly specified" : null,
      hours ? `and it is estimated at ${hours}` : null,
    ].filter(Boolean);
    return `You should probably take this one. ${pieces.join(", ")}.`;
  }

  if (verdict === "possible") {
    const caveat =
      analysis.scope === "unclear"
        ? "the scope is not clear enough to be sure how big it is"
        : analysis.clarity === "low"
          ? "the issue does not say much about what finished looks like"
          : availability === "stale"
            ? "it has been quiet for a long time, so it may no longer be wanted"
            : "some parts of it are outside what you have worked with";
    return `Worth considering, but ${caveat}.`;
  }

  const reason =
    availability === "stale"
      ? "it has been inactive long enough that it may no longer be wanted"
      : analysis.difficulty === "hard"
        ? "it appears substantially harder than the work you said you have time for"
        : "the match with your skills and available time is weak";
  return `Probably skip this one — ${reason}.`;
}
