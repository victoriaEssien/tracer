/**
 * Discovery and analysis.
 *
 * Runs outside the request cycle so the feed is fast: candidate repositories
 * and issues are collected and scored ahead of time.
 *
 * The budget matters more than the breadth. A run is capped by candidate count,
 * and repositories are collected once and reused across every issue found in
 * them, because repository collection is the expensive half.
 */

import { languageCandidates } from "@/config/skills";
import {
  buildDiscoveryQueries,
  collectIssue,
  collectRepository,
  githubForUser,
  RateLimitError,
  searchIssues,
  type GitHubClient,
} from "@/server/github";
import * as queries from "@/server/db/queries";
import { analyzePending } from "@/server/opportunities";
import type { DiscoveryProgress } from "@/types";

export interface DiscoveryOptions {
  /** How many issues to collect and score in one run. */
  maxIssues?: number;
  /** How many distinct repositories to collect in one run. */
  maxRepositories?: number;
  /** Minimum stars for a candidate repository. */
  minStars?: number;
  /** Which page of search results to read. Defaults to how much is already scored. */
  page?: number;
}

export interface DiscoveryResult {
  queriesRun: number;
  candidatesFound: number;
  issuesCollected: number;
  issuesAnalyzed: number;
  repositoriesCollected: number;
  rateLimited: boolean;
}

export async function runDiscovery(
  userId: string,
  options: DiscoveryOptions = {},
  /** Called as each step finishes, so the browser can show real progress. */
  onProgress: (progress: DiscoveryProgress) => void = () => {},
  /** Aborts when the browser stops listening, so a cancelled run stops working. */
  signal?: AbortSignal,
): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    queriesRun: 0,
    candidatesFound: 0,
    issuesCollected: 0,
    issuesAnalyzed: 0,
    repositoriesCollected: 0,
    rateLimited: false,
  };

  const profile = await queries.getUserProfile(userId);
  if (!profile) return result;

  const client = await githubForUser(userId);

  // Languages the user knows or wants to learn are the search axis; interests
  // are too vague to search on and are scored later instead.
  const languages = languageCandidates([...profile.experienced, ...profile.learning]).slice(0, 4);

  // Later runs read deeper into the results, so asking again finds things the
  // first pass never saw rather than the same page of candidates.
  const page = options.page ?? (await queries.countAnalyses(userId)) / 30 + 1;

  const searches = buildDiscoveryQueries({ languages, page: Math.floor(page) });

  const maxIssues = options.maxIssues ?? 40;
  const maxRepositories = options.maxRepositories ?? 15;
  const minStars = options.minStars ?? 50;

  const candidates: { owner: string; repo: string; number: number }[] = [];

  try {
    for (const query of searches) {
      if (signal?.aborted) return result;
      // Every query runs. Stopping early because raw candidates looked
      // plentiful meant most language and label combinations were never tried,
      // and a repeat run kept re-reading the same two.
      if (candidates.length >= 400) break;
      const found = await searchIssues(client, query);
      result.queriesRun += 1;
      candidates.push(
        ...found.map((item) => ({ owner: item.owner, repo: item.repo, number: item.number })),
      );
      onProgress({
        phase: "searching",
        queriesRun: result.queriesRun,
        queriesTotal: searches.length,
        candidates: candidates.length,
      });
    }
  } catch (error) {
    if (!(error instanceof RateLimitError)) throw error;
    result.rateLimited = true;
  }

  result.candidatesFound = candidates.length;

  // Spread the run across repositories rather than taking 40 issues from one.
  const byRepository = groupByRepository(candidates);
  const repositoryIds = new Map<string, string>();

  try {
    for (const [fullName, issueNumbers] of byRepository) {
      if (signal?.aborted) return result;
      if (result.issuesCollected >= maxIssues) break;
      if (repositoryIds.size >= maxRepositories) break;

      const [owner, repo] = fullName.split("/");
      const repositoryId = await ensureRepository(client, owner, repo, minStars);
      if (!repositoryId) continue;

      repositoryIds.set(fullName, repositoryId);
      result.repositoriesCollected += 1;
      onProgress({
        phase: "collecting",
        repositories: result.repositoriesCollected,
        issues: result.issuesCollected,
        issuesTarget: maxIssues,
      });

      for (const number of issueNumbers.slice(0, 4)) {
        if (signal?.aborted) return result;
        if (result.issuesCollected >= maxIssues) break;

        const existing = await queries.findIssueByNumber(fullName, number);
        if (existing) continue;

        const issue = await collectIssue(client, owner, repo, number);
        if (!issue || issue.state !== "open") continue;

        await queries.upsertIssue(repositoryId, issue);
        result.issuesCollected += 1;
        onProgress({
          phase: "collecting",
          repositories: result.repositoriesCollected,
          issues: result.issuesCollected,
          issuesTarget: maxIssues,
        });
      }
    }
  } catch (error) {
    if (!(error instanceof RateLimitError)) throw error;
    // Whatever was collected before the limit is still worth scoring.
    result.rateLimited = true;
  }

  if (signal?.aborted) return result;

  result.issuesAnalyzed = await analyzePending(userId, profile, maxIssues, (analyzed, total) =>
    onProgress({ phase: "scoring", analyzed, total }),
  );

  return result;
}

/**
 * Collects a repository, or returns the stored copy. Null means the repository
 * is not worth spending the rest of the run on.
 *
 * The star floor is applied here rather than in the search, because issue
 * search has no working way to express it.
 */
async function ensureRepository(
  client: GitHubClient,
  owner: string,
  repo: string,
  minStars: number,
): Promise<string | null> {
  const fullName = `${owner}/${repo}`;
  const stored = await queries.findRepositoryByFullName(fullName);

  // Repository metadata moves slowly; a day-old copy is good enough.
  if (stored && Date.now() - stored.collectedAt.getTime() < 86_400_000) {
    return stored.stars >= minStars ? stored.id : null;
  }

  const collected = await collectRepository(client, owner, repo);
  if (!collected || collected.isArchived || collected.stars < minStars) return null;

  return queries.upsertRepository(collected);
}

function groupByRepository(
  candidates: { owner: string; repo: string; number: number }[],
): Map<string, number[]> {
  const grouped = new Map<string, number[]>();
  for (const candidate of candidates) {
    const key = `${candidate.owner}/${candidate.repo}`;
    const existing = grouped.get(key);
    if (existing) {
      if (!existing.includes(candidate.number)) existing.push(candidate.number);
    } else {
      grouped.set(key, [candidate.number]);
    }
  }
  return grouped;
}
