/**
 * Fixture builders for the analysis tests.
 *
 * The collected types are wide, and a test that hand-rolls one buries the two
 * fields it actually cares about under twenty it does not. Each builder fills
 * in a plausible, healthy default and takes an override for the rest.
 */

import type {
  CollectedIssue,
  CollectedIssueComment,
  CollectedRepository,
  RepositoryActivity,
  UserProfile,
} from "@/types";

const DAY = 86_400_000;

/** Relative to now, so an "opened 400 days ago" fixture stays 400 days old. */
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

export function buildActivity(overrides: Partial<RepositoryActivity> = {}): RepositoryActivity {
  return {
    commitsLast30Days: 60,
    commitsLast90Days: 180,
    lastCommitAt: daysAgo(2),
    lastReleaseAt: daysAgo(20),
    releasesLast12Months: 10,
    contributorCount: 80,
    recentContributorCount: 15,
    openPullRequests: 9,
    pullRequestsMergedLast90Days: 40,
    pullRequestsOpenedLast90Days: 48,
    medianMergeHours: 40,
    medianFirstResponseHours: 10,
    stalePullRequests: 2,
    externalPullRequestsMergedLast90Days: 18,
    ...overrides,
  };
}

export function buildRepository(
  overrides: Partial<CollectedRepository> = {},
): CollectedRepository {
  const owner = overrides.owner ?? "acme";
  const name = overrides.name ?? "widget";

  return {
    githubId: 1,
    owner,
    name,
    fullName: `${owner}/${name}`,
    description: "A thing that does a thing.",
    htmlUrl: `https://github.com/${owner}/${name}`,
    primaryLanguage: "TypeScript",
    languages: { TypeScript: 500_000 },
    topics: ["typescript"],
    stars: 4000,
    forks: 300,
    openIssues: 40,
    license: "mit",
    isArchived: false,
    isFork: false,
    hasContributingGuide: true,
    createdAt: daysAgo(1200),
    pushedAt: daysAgo(1),
    activity: buildActivity(),
    ...overrides,
  };
}

export function buildComment(
  overrides: Partial<CollectedIssueComment> = {},
): CollectedIssueComment {
  return {
    author: "someone",
    authorAssociation: "NONE",
    body: "A comment.",
    createdAt: daysAgo(3),
    ...overrides,
  };
}

export function buildIssue(overrides: Partial<CollectedIssue> = {}): CollectedIssue {
  return {
    githubId: 2,
    number: 100,
    repositoryFullName: "acme/widget",
    title: "Something is wrong",
    body: "Something is wrong and here is a paragraph explaining roughly what.",
    htmlUrl: "https://github.com/acme/widget/issues/100",
    state: "open",
    author: "reporter",
    authorAssociation: "NONE",
    labels: [],
    assignees: [],
    commentCount: 0,
    reactionCount: 0,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
    closedAt: null,
    comments: [],
    linkedPullRequests: [],
    ...overrides,
  };
}

export function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: "user-1",
    experienced: ["TypeScript"],
    learning: [],
    interests: [],
    contributionTypes: ["bug-fixes"],
    timeCommitment: "2-5h",
    experienceLevel: "intermediate",
    onboardedAt: new Date(),
    ...overrides,
  };
}

/** Shorthand for the label shape, which is three fields and usually one matters. */
export function label(name: string) {
  return { name, description: null, color: null };
}
