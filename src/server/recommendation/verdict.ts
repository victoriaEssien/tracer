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
      summary: "This one is closed.",
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
    return `Pull request #${analysis.status.openPullRequestNumber} is already doing this.`;
  }
  if (availability === "assigned") {
    return `Already assigned to ${analysis.status.assignees.map((login) => `@${login}`).join(", ")}.`;
  }
  if (availability === "likely-claimed") {
    return "Someone called it in the comments. Ask before you start.";
  }

  const hours = analysis.estimatedHours ? formatHours(analysis.estimatedHours) : null;

  if (verdict === "recommended") {
    const pieces = [
      "The stack is yours",
      analysis.clarity === "high" ? "the issue says what it wants" : null,
      hours ? `and it looks like ${hours}` : null,
    ].filter(Boolean);
    return `${pieces.join(", ")}.`;
  }

  if (verdict === "possible") {
    const caveat =
      analysis.scope === "unclear"
        ? "there is no telling how big it is from what the issue says"
        : analysis.clarity === "low"
          ? "the issue never says what finished looks like"
          : availability === "stale"
            ? "it has been quiet long enough that nobody may want it now"
            : "parts of the stack are new to you";
    return `Worth a look, but ${caveat}.`;
  }

  const reason =
    availability === "stale"
      ? "it has been dead long enough that nobody may want it now"
      : analysis.difficulty === "hard"
        ? "it is harder than the time you said you have"
        : "it does not match your skills or your time";
  return `Skip it. ${capitalise(reason)}.`;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
