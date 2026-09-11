/**
 * Row-to-domain mappers.
 *
 * Stored rows are collected GitHub data, so an analysis can be recomputed
 * without spending a request — which is what makes re-scoring the whole feed
 * after a profile change affordable.
 */

import type { CollectedIssue, CollectedRepository, RepositoryActivity } from "@/types";

import type { IssueRow, RepositoryRow } from "./schema";

const EMPTY_ACTIVITY: RepositoryActivity = {
  commitsLast30Days: 0,
  commitsLast90Days: 0,
  lastCommitAt: null,
  lastReleaseAt: null,
  releasesLast12Months: 0,
  contributorCount: 0,
  recentContributorCount: 0,
  openPullRequests: 0,
  pullRequestsMergedLast90Days: 0,
  pullRequestsOpenedLast90Days: 0,
  medianMergeHours: null,
  medianFirstResponseHours: null,
  stalePullRequests: 0,
  externalPullRequestsMergedLast90Days: 0,
};

export function toCollectedRepository(row: RepositoryRow): CollectedRepository {
  return {
    githubId: row.githubId,
    owner: row.owner,
    name: row.name,
    fullName: row.fullName,
    description: row.description,
    htmlUrl: row.htmlUrl,
    primaryLanguage: row.primaryLanguage,
    languages: row.languages,
    topics: row.topics,
    stars: row.stars,
    forks: row.forks,
    openIssues: row.openIssues,
    license: row.license,
    isArchived: row.isArchived,
    isFork: row.isFork,
    hasContributingGuide: row.hasContributingGuide,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
    pushedAt: (row.pushedAt ?? new Date()).toISOString(),
    activity: row.activity ?? EMPTY_ACTIVITY,
  };
}

export function toCollectedIssue(row: IssueRow, repositoryFullName: string): CollectedIssue {
  return {
    githubId: row.githubId,
    number: row.number,
    repositoryFullName,
    title: row.title,
    body: row.body,
    htmlUrl: row.htmlUrl,
    state: row.state,
    author: row.author,
    authorAssociation: row.authorAssociation,
    labels: row.labels,
    assignees: row.assignees,
    commentCount: row.commentCount,
    reactionCount: row.reactionCount,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
    updatedAt: (row.updatedAt ?? new Date()).toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    comments: row.comments,
    linkedPullRequests: row.linkedPullRequests,
  };
}
