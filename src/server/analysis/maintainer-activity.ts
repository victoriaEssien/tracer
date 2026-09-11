/**
 * Maintainer activity.
 *
 * The question this answers is narrow: if I open a pull request, does anyone
 * look at it? Estimated from historical behaviour, and always described as an
 * estimate (spec section 3.4).
 */

import { clamp, daysSince } from "@/lib/utils";
import type { CollectedIssue, CollectedRepository, Signal } from "@/types";

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function analyzeMaintainerActivity(
  repo: CollectedRepository,
  issue: CollectedIssue,
): Signal {
  const reasons: string[] = [];
  const concerns: string[] = [];
  const activity = repo.activity;

  const responseHours = activity.medianFirstResponseHours;
  const responsiveness =
    responseHours === null
      ? null
      : responseHours <= 24
        ? 1
        : responseHours <= 72
          ? 0.85
          : responseHours <= 168
            ? 0.6
            : responseHours <= 720
              ? 0.3
              : 0.1;

  if (responseHours !== null) {
    if (responseHours <= 48) {
      reasons.push(
        `Maintainers reply to pull requests in about ${Math.round(responseHours)} hours`,
      );
    } else if (responseHours <= 168) {
      reasons.push(
        `Pull requests get a first reply in about ${Math.round(responseHours / 24)} days`,
      );
    } else {
      concerns.push(
        `A first reply to a pull request takes about ${Math.round(responseHours / 24)} days here`,
      );
    }
  }

  const mergeHours = activity.medianMergeHours;
  const mergeSpeed =
    mergeHours === null
      ? null
      : mergeHours <= 72
        ? 1
        : mergeHours <= 336
          ? 0.7
          : mergeHours <= 1440
            ? 0.4
            : 0.15;

  if (mergeHours !== null && mergeHours > 720) {
    concerns.push(
      `Pull requests take about ${Math.round(mergeHours / 24)} days to merge`,
    );
  } else if (mergeHours !== null && mergeHours <= 168) {
    reasons.push(
      `Pull requests merge in about ${Math.round(mergeHours / 24) || 1} days`,
    );
  }

  // Whether a maintainer has said anything on this specific issue is a stronger
  // signal than repository-wide averages.
  const maintainerComments = issue.comments.filter((comment) =>
    MAINTAINER_ASSOCIATIONS.has(comment.authorAssociation ?? ""),
  );
  const maintainerOnIssue = maintainerComments.length > 0;
  if (maintainerOnIssue) {
    const latest = maintainerComments[maintainerComments.length - 1];
    reasons.push(
      `A maintainer commented on this issue ${daysSince(latest.createdAt)} days ago`,
    );
  } else if (issue.commentCount > 3) {
    concerns.push("People are talking here and no maintainer has answered");
  }

  const issueIsFromMaintainer = MAINTAINER_ASSOCIATIONS.has(issue.authorAssociation ?? "");
  if (issueIsFromMaintainer) {
    reasons.push("A maintainer opened it, so the work is wanted");
  }

  // Blend what we know. Missing signals are skipped rather than scored as zero.
  const parts: { value: number; weight: number }[] = [];
  if (responsiveness !== null) parts.push({ value: responsiveness, weight: 0.4 });
  if (mergeSpeed !== null) parts.push({ value: mergeSpeed, weight: 0.25 });
  parts.push({ value: maintainerOnIssue ? 1 : 0.4, weight: 0.2 });
  parts.push({ value: issueIsFromMaintainer ? 1 : 0.5, weight: 0.15 });

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = clamp(parts.reduce((sum, part) => sum + part.value * part.weight, 0) / totalWeight);

  const confidence =
    responseHours === null && mergeHours === null
      ? "low"
      : activity.pullRequestsMergedLast90Days >= 5
        ? "high"
        : "medium";

  if (confidence === "low") {
    concerns.push("Too little history to tell how fast maintainers reply");
  }

  return { score, confidence, reasons, concerns };
}
