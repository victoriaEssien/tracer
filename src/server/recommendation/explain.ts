/**
 * The explanation.
 *
 * "Why did you recommend this to me?" has to be answerable from what the
 * analysis already produced (spec section 10). Nothing is invented here — this
 * module only selects and orders reasoning that the analysers emitted alongside
 * their scores.
 */

import { unique } from "@/lib/utils";
import type { Explanation, ScoreBreakdownEntry } from "@/types";

/** Enough to be convincing, few enough to be read. */
const MAX_POSITIVES = 6;
const MAX_CONCERNS = 4;

export function buildExplanation(breakdown: ScoreBreakdownEntry[]): Explanation {
  // Positives are ordered by how much the dimension actually contributed, so
  // the first line is the strongest real reason rather than the nicest phrase.
  const byContribution = [...breakdown].sort((a, b) => b.contribution - a.contribution);

  const positives = unique(
    byContribution
      .filter((entry) => entry.raw >= 0.5)
      .flatMap((entry) => entry.reasons),
  ).slice(0, MAX_POSITIVES);

  // Concerns come from the weakest dimensions first: the thing most likely to
  // cost the contributor time should be the thing they read first.
  const byWeakness = [...breakdown].sort((a, b) => a.raw - b.raw);

  const concerns = unique(byWeakness.flatMap((entry) => entry.concerns)).slice(0, MAX_CONCERNS);

  return { positives, concerns };
}

/** The two or three lines the feed card shows without expanding anything. */
export function summarizeForFeed(breakdown: ScoreBreakdownEntry[]): {
  reasons: string[];
  concerns: string[];
} {
  const explanation = buildExplanation(breakdown);
  return {
    reasons: explanation.positives.slice(0, 3),
    concerns: explanation.concerns.slice(0, 2),
  };
}
