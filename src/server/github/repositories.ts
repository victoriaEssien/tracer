/**
 * Repository collection.
 *
 * Turns a `owner/name` into a `CollectedRepository`: metadata, language mix,
 * and the activity counts the health and maintainer-activity analysers need.
 *
 * Budget: six REST calls and one GraphQL call per repository, all cached. The
 * GraphQL call replaces what would otherwise be one request per pull request.
 */

import { hoursBetween, median } from "@/lib/utils";
import type { CollectedRepository, RepositoryActivity } from "@/types";

import type { GitHubClient } from "./client";
import type {
  GraphQlPullRequestNode,
  GraphQlPullRequestStatsResponse,
  RestCommit,
  RestContributor,
  RestRelease,
  RestRepository,
} from "./types";

const PULL_REQUEST_STATS_QUERY = /* GraphQL */ `
  query PullRequestStats($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: 50
        states: [OPEN, MERGED, CLOSED]
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          number
          createdAt
          mergedAt
          closedAt
          state
          authorAssociation
          author {
            login
          }
          comments(first: 5) {
            nodes {
              createdAt
              authorAssociation
              author {
                login
              }
            }
          }
          reviews(first: 3) {
            nodes {
              createdAt
              authorAssociation
              author {
                login
              }
            }
          }
        }
      }
    }
  }
`;

/** Associations GitHub gives to people who can merge. */
const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export async function collectRepository(
  client: GitHubClient,
  owner: string,
  name: string,
): Promise<CollectedRepository | null> {
  const repo = await client.rest<RestRepository>(`/repos/${owner}/${name}`, {
    cacheSeconds: 3600,
    allowNotFound: true,
  });
  if (!repo || repo.disabled) return null;

  const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const [languages, commits, releases, contributors, contributing, pullRequests] = await Promise.all(
    [
      client.rest<Record<string, number>>(`/repos/${owner}/${name}/languages`, {
        cacheSeconds: 86_400,
        allowNotFound: true,
      }),
      client.restPaginated<RestCommit>(`/repos/${owner}/${name}/commits`, {
        searchParams: { since: since90 },
        max: 300,
        cacheSeconds: 3600,
        allowNotFound: true,
      }),
      client.restPaginated<RestRelease>(`/repos/${owner}/${name}/releases`, {
        max: 30,
        cacheSeconds: 86_400,
        allowNotFound: true,
      }),
      client.restPaginated<RestContributor>(`/repos/${owner}/${name}/contributors`, {
        max: 100,
        cacheSeconds: 86_400,
        allowNotFound: true,
      }),
      hasContributingGuide(client, owner, name),
      collectPullRequestStats(client, owner, name),
    ],
  );

  const activity = buildActivity({
    commits,
    releases: releases ?? [],
    contributors: contributors ?? [],
    pullRequests,
    ownerLogin: repo.owner.login,
  });

  return {
    githubId: repo.id,
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    htmlUrl: repo.html_url,
    primaryLanguage: repo.language,
    languages: languages ?? {},
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    license: repo.license?.spdx_id ?? null,
    isArchived: repo.archived,
    isFork: repo.fork,
    hasContributingGuide: contributing,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    activity,
  };
}

/**
 * Top-level directory listing, used to suggest starting points. Returns an
 * empty list rather than failing — this is a nice-to-have, not a requirement.
 */
export async function collectTopLevelPaths(
  client: GitHubClient,
  owner: string,
  name: string,
): Promise<string[]> {
  const contents = await client
    .rest<{ path: string; type: string }[]>(`/repos/${owner}/${name}/contents`, {
      cacheSeconds: 86_400,
      allowNotFound: true,
    })
    .catch(() => null);
  if (!contents) return [];
  return contents.filter((item) => item.type === "dir").map((item) => item.path);
}

async function hasContributingGuide(
  client: GitHubClient,
  owner: string,
  name: string,
): Promise<boolean> {
  const found = await client
    .rest<unknown>(`/repos/${owner}/${name}/contents/CONTRIBUTING.md`, {
      cacheSeconds: 86_400,
      allowNotFound: true,
    })
    .catch(() => null);
  return found !== null;
}

async function collectPullRequestStats(
  client: GitHubClient,
  owner: string,
  name: string,
): Promise<GraphQlPullRequestNode[]> {
  const data = await client
    .graphql<GraphQlPullRequestStatsResponse>(PULL_REQUEST_STATS_QUERY, { owner, name })
    .catch(() => null);
  return data?.repository?.pullRequests.nodes ?? [];
}

function buildActivity(input: {
  commits: RestCommit[];
  releases: RestRelease[];
  contributors: RestContributor[];
  pullRequests: GraphQlPullRequestNode[];
  ownerLogin: string;
}): RepositoryActivity {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;
  const ninetyDaysAgo = now - 90 * 86_400_000;
  const oneYearAgo = now - 365 * 86_400_000;

  const commitDates = input.commits
    .map((commit) => commit.commit.author?.date)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime());

  const recentContributors = new Set(
    input.commits
      .filter((commit) => {
        const date = commit.commit.author?.date;
        return date ? new Date(date).getTime() >= ninetyDaysAgo : false;
      })
      .map((commit) => commit.author?.login)
      .filter((login): login is string => Boolean(login)),
  );

  const publishedReleases = input.releases.filter(
    (release) => !release.draft && release.published_at,
  );

  const merged = input.pullRequests.filter((pr) => pr.mergedAt);
  const mergedRecently = merged.filter(
    (pr) => new Date(pr.mergedAt as string).getTime() >= ninetyDaysAgo,
  );
  const open = input.pullRequests.filter((pr) => pr.state === "OPEN");

  const mergeHours = mergedRecently
    .map((pr) => hoursBetween(pr.createdAt, pr.mergedAt as string))
    .filter((hours) => hours >= 0);

  return {
    commitsLast30Days: commitDates.filter((date) => date >= thirtyDaysAgo).length,
    commitsLast90Days: commitDates.length,
    lastCommitAt: commitDates.length ? new Date(Math.max(...commitDates)).toISOString() : null,
    lastReleaseAt: publishedReleases[0]?.published_at ?? null,
    releasesLast12Months: publishedReleases.filter(
      (release) => new Date(release.published_at as string).getTime() >= oneYearAgo,
    ).length,
    contributorCount: input.contributors.length,
    recentContributorCount: recentContributors.size,
    openPullRequests: open.length,
    pullRequestsMergedLast90Days: mergedRecently.length,
    pullRequestsOpenedLast90Days: input.pullRequests.filter(
      (pr) => new Date(pr.createdAt).getTime() >= ninetyDaysAgo,
    ).length,
    medianMergeHours: median(mergeHours),
    medianFirstResponseHours: median(firstResponseHours(input.pullRequests)),
    stalePullRequests: open.filter((pr) => new Date(pr.createdAt).getTime() < ninetyDaysAgo).length,
    externalPullRequestsMergedLast90Days: mergedRecently.filter(
      (pr) => !MAINTAINER_ASSOCIATIONS.has(pr.authorAssociation),
    ).length,
  };
}

/**
 * Hours from a pull request being opened to the first response by someone other
 * than its author. This is the closest observable proxy for "will my PR get
 * looked at", so it is worth the extra fields on the GraphQL query.
 */
function firstResponseHours(pullRequests: GraphQlPullRequestNode[]): number[] {
  const results: number[] = [];

  for (const pr of pullRequests) {
    const authorLogin = pr.author?.login;
    const responses = [...pr.comments.nodes, ...pr.reviews.nodes]
      .filter((event) => event.author?.login && event.author.login !== authorLogin)
      .filter((event) => MAINTAINER_ASSOCIATIONS.has(event.authorAssociation))
      .map((event) => new Date(event.createdAt).getTime());

    if (responses.length === 0) continue;
    const hours = hoursBetween(pr.createdAt, new Date(Math.min(...responses)).toISOString());
    if (hours >= 0) results.push(hours);
  }

  return results;
}
