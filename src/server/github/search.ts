/**
 * Discovery search.
 *
 * Finds candidate issues worth analysing. This is a filter, not a
 * recommendation: everything it returns still has to survive the analysis
 * engine. Labels are used here only to narrow the search space, which is the
 * one place they are allowed to be load-bearing.
 *
 * GitHub's search endpoint has its own, much smaller rate limit (30 requests
 * per minute), so results are cached for an hour and the number of queries per
 * discovery run is capped by the caller.
 */

import { DISCOVERY_ISSUE_LABELS } from "@/config/labels";

import type { GitHubClient } from "./client";
import type { RestSearchIssueItem, RestSearchResponse } from "./types";

export interface DiscoveredIssue {
  owner: string;
  repo: string;
  number: number;
  title: string;
  labels: string[];
  updatedAt: string;
  htmlUrl: string;
}

export interface DiscoveryQuery {
  /** A language as GitHub spells it ("TypeScript"). */
  language?: string;
  /** A single label, quoted automatically. */
  label?: string;
  /** Repositories below this many stars are skipped. */
  minStars?: number;
  /** Only issues updated within this many days. */
  updatedWithinDays?: number;
  /** Skip issues that already have a crowd on them. */
  maxComments?: number;
  perPage?: number;
}

/**
 * One search. Returns an empty list rather than throwing on a search-specific
 * failure, so one bad query cannot abort a discovery run.
 */
export async function searchIssues(
  client: GitHubClient,
  query: DiscoveryQuery,
): Promise<DiscoveredIssue[]> {
  const parts = [
    "is:issue",
    "is:open",
    "no:assignee",
    "archived:false",
    "is:public",
    `comments:<${query.maxComments ?? 15}`,
  ];

  if (query.language) parts.push(`language:${quote(query.language)}`);
  if (query.label) parts.push(`label:${quote(query.label)}`);
  if (query.minStars) parts.push(`stars:>=${query.minStars}`);
  if (query.updatedWithinDays) {
    const since = new Date(Date.now() - query.updatedWithinDays * 86_400_000);
    parts.push(`updated:>=${since.toISOString().slice(0, 10)}`);
  }

  const response = await client
    .rest<RestSearchResponse<RestSearchIssueItem>>("/search/issues", {
      searchParams: {
        q: parts.join(" "),
        sort: "updated",
        order: "desc",
        per_page: query.perPage ?? 30,
        advanced_search: "true",
      },
      cacheSeconds: 3600,
      allowNotFound: true,
    })
    .catch(() => null);

  if (!response) return [];

  return response.items
    // `is:issue` should exclude pull requests, but the field is authoritative.
    .filter((item) => !item.pull_request)
    .map(toDiscoveredIssue)
    .filter((item): item is DiscoveredIssue => item !== null);
}

/**
 * Builds the query set for one user: their languages crossed with the labels
 * maintainers use to signal that help is welcome.
 *
 * Capped at `maxQueries` because the search rate limit is the binding
 * constraint on how often discovery can run.
 */
export function buildDiscoveryQueries(input: {
  languages: string[];
  minStars?: number;
  updatedWithinDays?: number;
  maxQueries?: number;
}): DiscoveryQuery[] {
  const languages = input.languages.length > 0 ? input.languages : [undefined];
  const queries: DiscoveryQuery[] = [];

  for (const language of languages) {
    for (const label of DISCOVERY_ISSUE_LABELS) {
      queries.push({
        language,
        label,
        minStars: input.minStars ?? 50,
        updatedWithinDays: input.updatedWithinDays ?? 120,
      });
    }
  }

  return queries.slice(0, input.maxQueries ?? 12);
}

function toDiscoveredIssue(item: RestSearchIssueItem): DiscoveredIssue | null {
  const match = /repos\/([^/]+)\/([^/]+)$/.exec(item.repository_url);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    number: item.number,
    title: item.title,
    labels: item.labels.map((label) => label.name),
    updatedAt: item.updated_at,
    htmlUrl: item.html_url,
  };
}

function quote(value: string): string {
  return value.includes(" ") ? `"${value}"` : value;
}
