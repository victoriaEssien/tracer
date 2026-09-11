/**
 * Repository health.
 *
 * Is this project alive, and do contributions land? Deliberately not a verdict
 * on the project's quality: no single metric condemns a repository
 * (scoring.md rule 3), so weak signals become concerns rather than a zero.
 */

import { clamp, daysSince, ratio } from "@/lib/utils";
import type { CollectedRepository, Signal } from "@/types";

export function analyzeRepositoryHealth(repo: CollectedRepository): Signal {
  const reasons: string[] = [];
  const concerns: string[] = [];

  if (repo.isArchived) {
    return {
      score: 0,
      confidence: "high",
      reasons: [],
      concerns: ["Archived. It does not take contributions any more."],
    };
  }

  const activity = repo.activity;
  const daysSinceCommit = daysSince(activity.lastCommitAt ?? repo.pushedAt);

  // Recency: committed this week is as good as it gets; six months of silence
  // is as bad as it gets.
  const recency =
    daysSinceCommit <= 7
      ? 1
      : daysSinceCommit <= 30
        ? 0.85
        : daysSinceCommit <= 90
          ? 0.6
          : daysSinceCommit <= 180
            ? 0.3
            : 0.1;

  if (daysSinceCommit <= 14) {
    reasons.push("Someone committed in the last two weeks");
  } else if (daysSinceCommit <= 60) {
    reasons.push(`Last commit was ${daysSinceCommit} days ago`);
  } else if (daysSinceCommit <= 180) {
    concerns.push(`Nothing committed for ${daysSinceCommit} days`);
  } else {
    concerns.push("No commits for over six months");
  }

  // Volume: 40 commits a quarter is a healthy, steadily maintained project.
  const volume = ratio(activity.commitsLast90Days, 40);
  if (activity.commitsLast90Days >= 30) {
    reasons.push(`${activity.commitsLast90Days} commits in the last 90 days`);
  } else if (activity.commitsLast90Days <= 3 && daysSinceCommit > 30) {
    concerns.push("Barely any commits this quarter");
  }

  const releases = activity.releasesLast12Months;
  const releaseCadence = releases > 0 ? clamp(0.5 + ratio(releases, 6) * 0.5) : 0.35;
  if (releases >= 4) {
    reasons.push(`${releases} releases in the last year`);
  } else if (releases === 0 && activity.lastReleaseAt) {
    concerns.push("No release in the last year");
  }

  // Throughput: are outside contributions actually being merged?
  const throughput = ratio(activity.pullRequestsMergedLast90Days, 15);
  if (activity.externalPullRequestsMergedLast90Days >= 3) {
    reasons.push(
      `${activity.externalPullRequestsMergedLast90Days} outside pull requests merged in the last 90 days`,
    );
  } else if (
    activity.pullRequestsOpenedLast90Days >= 5 &&
    activity.externalPullRequestsMergedLast90Days === 0
  ) {
    concerns.push(
      "People open pull requests here, but none from outside have merged in 90 days",
    );
  }

  const staleRatio =
    activity.openPullRequests > 0 ? activity.stalePullRequests / activity.openPullRequests : 0;
  const backlog = 1 - clamp(staleRatio);
  if (activity.stalePullRequests >= 5 && staleRatio > 0.5) {
    concerns.push(
      `${activity.stalePullRequests} pull requests have been waiting over 90 days`,
    );
  }

  const contributors = ratio(activity.recentContributorCount, 8);
  if (activity.recentContributorCount >= 5) {
    reasons.push(
      `${activity.recentContributorCount} people committed in the last 90 days, so it is not one person`,
    );
  } else if (activity.recentContributorCount <= 1) {
    concerns.push("Every recent commit is from the same person");
  }

  if (repo.hasContributingGuide) {
    reasons.push("There is a contributing guide");
  }

  if (repo.isFork) {
    concerns.push("This is a fork, so the work may not belong here");
  }

  const score = clamp(
    recency * 0.3 +
      volume * 0.15 +
      releaseCadence * 0.1 +
      throughput * 0.2 +
      backlog * 0.1 +
      contributors * 0.15,
  );

  return {
    score,
    confidence: activity.commitsLast90Days === 0 && activity.contributorCount === 0 ? "low" : "high",
    reasons,
    concerns,
  };
}
