/**
 * Issue status and competition.
 *
 * Two questions, both about availability rather than quality:
 *
 * - Is this issue actually free to pick up? (`issueSuitability`)
 * - Is someone else already on it? (`competition`)
 *
 * A `good first issue` that three people claimed in the comments last week is
 * not available, whatever the label says.
 */

import { hasBlockedLabel, hasClaimedLabel, hasHelpWantedLabel } from "@/config/labels";
import { clamp, daysSince } from "@/lib/utils";
import type { CollectedIssue, IssueStatusDetail, Signal } from "@/types";

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

/** Phrases people use when they intend to take an issue. */
const CLAIM_PATTERNS = [
  /\bi(?:'| a)?m (?:working|going to work) on (?:this|it)\b/i,
  /\bi(?:'| woul)?d? like to (?:work on|take|try|tackle) (?:this|it)\b/i,
  /\bcan i (?:work on|take|try|pick up) (?:this|it)\b/i,
  /\bmay i (?:work on|take) (?:this|it)\b/i,
  /\bi(?:'ll| will) (?:take|pick|handle|do) (?:this|it|a look)\b/i,
  /\bplease assign (?:this|it|me)\b/i,
  /\bassign (?:this|it) to me\b/i,
  /\btaking (?:this|it) (?:on|up)\b/i,
  /\bon it\b/i,
  /\bworking on a (?:pr|fix|patch)\b/i,
];

/** Phrases that indicate a maintainer pointed at where to start. */
const GUIDANCE_PATTERNS = [
  /\bthe (?:relevant|related) code is\b/i,
  /\byou (?:can|should) (?:start|look) (?:at|in|with)\b/i,
  /\bthis (?:lives|is implemented) in\b/i,
  /\bsee `?[\w./-]+\.[a-z]{2,4}`?/i,
  /\bhappy to (?:review|guide|help)\b/i,
  /\bpr(?:s)? welcome\b/i,
  /\bgo ahead\b/i,
];

export function analyzeIssueStatus(
  issue: CollectedIssue,
  now = new Date(),
): { detail: IssueStatusDetail; signal: Signal } {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const labels = issue.labels.map((label) => label.name);
  const daysSinceUpdate = daysSince(issue.updatedAt, now);
  const daysSinceCreated = daysSince(issue.createdAt, now);

  const openPullRequest = issue.linkedPullRequests.find((pr) => pr.state === "open" && !pr.merged);
  const mergedPullRequest = issue.linkedPullRequests.find((pr) => pr.merged);
  const claim = findClaim(issue);

  const detail: IssueStatusDetail = {
    availability: "available",
    assignees: issue.assignees,
    claimedBy: claim?.author ?? null,
    daysSinceUpdate,
    daysSinceCreated,
    hasMaintainerGuidance: hasMaintainerGuidance(issue),
    openPullRequestNumber: openPullRequest?.number ?? null,
  };

  // Hard availability problems first. Each one sets the ceiling for the score.
  if (issue.state === "closed" || mergedPullRequest) {
    detail.availability = "closed";
    return {
      detail,
      signal: {
        score: 0,
        confidence: "high",
        reasons: [],
        concerns: [
          mergedPullRequest
            ? `A pull request for this issue (#${mergedPullRequest.number}) has already been merged`
            : "The issue is closed",
        ],
      },
    };
  }

  let score = 0.75;

  if (openPullRequest) {
    detail.availability = "has-pull-request";
    score = 0.1;
    concerns.push(
      `Pull request #${openPullRequest.number} already appears to address this issue`,
    );
  } else if (issue.assignees.length > 0) {
    detail.availability = "assigned";
    score = 0.15;
    concerns.push(
      `The issue is assigned to ${issue.assignees.map((login) => `@${login}`).join(", ")}`,
    );
  } else if (claim && daysSince(claim.createdAt, now) <= 30) {
    detail.availability = "likely-claimed";
    score = 0.3;
    concerns.push(
      `@${claim.author ?? "someone"} said they were picking this up ${daysSince(claim.createdAt, now)} days ago, though nobody was formally assigned`,
    );
  } else if (claim) {
    // An old, unfulfilled claim is worth knowing about but not disqualifying.
    score = 0.6;
    concerns.push(
      `@${claim.author ?? "someone"} offered to take this ${daysSince(claim.createdAt, now)} days ago and nothing appears to have landed — worth asking before starting`,
    );
  }

  if (hasClaimedLabel(labels) && detail.availability === "available") {
    detail.availability = "likely-claimed";
    score = Math.min(score, 0.3);
    concerns.push("A label suggests the issue is already being worked on");
  }

  if (hasBlockedLabel(labels)) {
    score = Math.min(score, 0.35);
    concerns.push(
      "A label suggests the issue is still being discussed or is waiting on more information",
    );
  }

  // Staleness. An issue nobody has touched in a year may no longer be wanted.
  if (daysSinceUpdate > 365) {
    if (detail.availability === "available") detail.availability = "stale";
    score = Math.min(score, 0.3);
    concerns.push(`The issue has been inactive for about ${Math.round(daysSinceUpdate / 30)} months`);
  } else if (daysSinceUpdate > 180) {
    if (detail.availability === "available") detail.availability = "stale";
    score = Math.min(score, 0.5);
    concerns.push(`The issue has been inactive for about ${Math.round(daysSinceUpdate / 30)} months`);
  } else if (daysSinceUpdate <= 30 && detail.availability === "available") {
    score += 0.1;
    reasons.push("The issue has been active in the last month");
  }

  if (detail.availability === "available") {
    reasons.push("Nobody is assigned and no pull request references the issue");
  }

  if (hasHelpWantedLabel(labels)) {
    score += 0.1;
    reasons.push("Maintainers have labelled the issue as wanting outside help");
  }

  if (detail.hasMaintainerGuidance) {
    score += 0.1;
    reasons.push("A maintainer has given guidance on the issue about how to approach it");
  }

  return {
    detail,
    signal: {
      score: clamp(score),
      confidence: issue.comments.length < issue.commentCount ? "medium" : "high",
      reasons,
      concerns,
    },
  };
}

/**
 * Competition. Distinct from availability: an issue can be unassigned and still
 * have five people circling it, and a popular issue is harder to land.
 */
export function analyzeCompetition(issue: CollectedIssue, now = new Date()): Signal {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const claimants = new Set(
    issue.comments
      .filter((comment) => CLAIM_PATTERNS.some((pattern) => pattern.test(comment.body)))
      .filter((comment) => daysSince(comment.createdAt, now) <= 90)
      .map((comment) => comment.author)
      .filter((author): author is string => Boolean(author)),
  );

  const participants = new Set(
    issue.comments.map((comment) => comment.author).filter(Boolean),
  ).size;

  let score = 1;

  if (claimants.size >= 2) {
    score = 0.15;
    concerns.push(
      `${claimants.size} people have offered to work on this in the last 90 days`,
    );
  } else if (claimants.size === 1) {
    score = 0.4;
    concerns.push("Someone else has already offered to work on this");
  }

  if (issue.commentCount >= 25) {
    score = Math.min(score, 0.4);
    concerns.push(
      `The issue has ${issue.commentCount} comments, so there is a lot of context to read before starting`,
    );
  } else if (issue.commentCount >= 12) {
    score = Math.min(score, 0.65);
  }

  if (issue.reactionCount >= 20) {
    score = Math.min(score, 0.7);
    concerns.push(
      `${issue.reactionCount} reactions suggests this is a popular issue that others may also be attempting`,
    );
  }

  if (claimants.size === 0 && issue.commentCount <= 3) {
    reasons.push("No one else appears to be working on this");
  }

  if (participants <= 2 && issue.commentCount > 0) {
    reasons.push("The discussion is small enough to read in a few minutes");
  }

  return {
    score: clamp(score),
    confidence: issue.comments.length < issue.commentCount ? "medium" : "high",
    reasons,
    concerns,
  };
}

function findClaim(issue: CollectedIssue): { author: string | null; createdAt: string } | null {
  // Read newest first: the most recent claim is the one that matters.
  for (let index = issue.comments.length - 1; index >= 0; index -= 1) {
    const comment = issue.comments[index];
    if (MAINTAINER_ASSOCIATIONS.has(comment.authorAssociation ?? "")) continue;
    if (comment.author === issue.author) continue;
    if (CLAIM_PATTERNS.some((pattern) => pattern.test(comment.body))) {
      return { author: comment.author, createdAt: comment.createdAt };
    }
  }
  return null;
}

function hasMaintainerGuidance(issue: CollectedIssue): boolean {
  return issue.comments.some(
    (comment) =>
      MAINTAINER_ASSOCIATIONS.has(comment.authorAssociation ?? "") &&
      GUIDANCE_PATTERNS.some((pattern) => pattern.test(comment.body)),
  );
}
