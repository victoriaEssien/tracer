/**
 * The GitHub layer's public surface.
 *
 * Nothing outside `src/server/github/` constructs a client directly; call
 * `githubForUser()` or `githubForBackground()` instead, so token selection
 * stays in one place.
 */

import { eq } from "drizzle-orm";

import { REPOSITORY_NAME, REPOSITORY_OWNER } from "@/config/site";
import { db } from "@/server/db/client";
import { accounts } from "@/server/db/schema";

import { GitHubClient } from "./client";
import { collectRepoStats } from "./repositories";

export { GitHubClient, GitHubError, RateLimitError } from "./client";
export type { RateLimitState } from "./client";
export { collectRepoStats, collectRepository, collectTopLevelPaths } from "./repositories";
export { collectIssue, refreshIssueStatus } from "./issues";
export { buildDiscoveryQueries, searchIssues } from "./search";
export type { DiscoveredIssue, DiscoveryQuery } from "./search";

/**
 * A client authenticated as the user, which spends the user's own hourly
 * budget rather than a shared one. Falls back to the background token if the
 * stored OAuth token has gone (revoked app, deleted account).
 */
export async function githubForUser(userId: string): Promise<GitHubClient> {
  const [account] = await db
    .select({ accessToken: accounts.access_token })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  return new GitHubClient({ token: account?.accessToken ?? null });
}

/** A client for background work, using `GITHUB_TOKEN` if one was configured. */
export function githubForBackground(): GitHubClient {
  return new GitHubClient();
}

/**
 * Stars and forks on Tracer's own repository, or null if GitHub could not say.
 *
 * The throw is swallowed deliberately: every other caller of this layer wants
 * a rate limit or an outage to surface, but this one decorates the header on
 * every page, and those pages must render whatever GitHub is doing.
 */
export async function ownRepoStats(): Promise<{ stars: number; forks: number } | null> {
  try {
    return await collectRepoStats(githubForBackground(), REPOSITORY_OWNER, REPOSITORY_NAME);
  } catch {
    return null;
  }
}
