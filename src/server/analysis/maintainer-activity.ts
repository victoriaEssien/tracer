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
        `Maintainers responded to recent pull requests within about ${Math.round(responseHours)} hours, based on repository history`,
      );
    } else if (responseHours <= 168) {
      reasons.push(
        `Recent pull requests appear to get a first response within roughly ${Math.round(responseHours / 24)} days`,
      );
    } else {
      concerns.push(
        `A first response to a pull request has recently taken around ${Math.round(responseHours / 24)} days`,
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
      `Recently merged pull requests took a median of about ${Math.round(mergeHours / 24)} days to merge`,
    );
  } else if (mergeHours !== null && mergeHours <= 168) {
    reasons.push(
      `Recent pull requests were merged in a median of about ${Math.round(mergeHours / 24) || 1} days`,
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
      `A maintainer has commented on this issue (${daysSince(latest.createdAt)} days ago)`,
    );
  } else if (issue.commentCount > 3) {
    concerns.push("The issue has discussion but no visible maintainer response");
  }

  const issueIsFromMaintainer = MAINTAINER_ASSOCIATIONS.has(issue.authorAssociation ?? "");
  if (issueIsFromMaintainer) {
    reasons.push("The issue was opened by a maintainer, so the work is likely wanted");
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
    concerns.push("There is not enough recent pull request history to estimate responsiveness");
  }

  return { score, confidence, reasons, concerns };
}
