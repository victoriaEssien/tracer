import type { DiscoveryProgress } from "@/types";

export interface ProgressCopy {
  label: string;
  detail: string;
  percent: number;
  partial: boolean;
}

/**
 * A progress event, as a line of copy and a position on the bar.
 *
 * Phases carry unequal weight: searching is quick, collecting a repository is
 * seven API calls, and scoring is local. The bar tracks the real wait rather
 * than counting steps evenly.
 *
 * Separate from the widget because it is the part worth testing, and a node
 * test cannot import a file with JSX in it.
 */
export function describeProgress(progress: DiscoveryProgress): ProgressCopy {
  switch (progress.phase) {
    case "searching": {
      // Until the server has said how many searches there are, report what is
      // known. Guessing a denominator means the count and the bar both jump
      // backwards when the real one arrives.
      const total = progress.queriesTotal;
      return {
        label: "Searching GitHub",
        detail:
          total === undefined
            ? `${progress.candidates} candidates so far`
            : `${progress.candidates} candidates from ${progress.queriesRun} of ${total} searches`,
        percent: total === undefined ? 4 : 4 + (progress.queriesRun / Math.max(total, 1)) * 16,
        partial: false,
      };
    }
    case "collecting":
      return {
        label: "Reading the projects",
        detail: `${progress.repositories} projects, ${progress.issues} issues collected`,
        percent: 20 + (progress.issues / Math.max(progress.issuesTarget, 1)) * 60,
        partial: false,
      };
    case "scoring":
      return {
        label: "Scoring against your profile",
        detail: `${progress.analyzed} of ${progress.total} issues`,
        percent: 80 + (progress.analyzed / Math.max(progress.total, 1)) * 20,
        partial: false,
      };
    case "done":
      return {
        label: progress.scored > 0 ? `${progress.scored} new issues scored` : "Nothing new found",
        detail:
          progress.scored > 0
            ? "They are in your queue, ranked by fit."
            : "Everything GitHub returned was already scored for you.",
        percent: 100,
        partial: progress.rateLimited,
      };
    case "error":
      return { label: "Search stopped", detail: progress.message, percent: 100, partial: false };
  }
}
