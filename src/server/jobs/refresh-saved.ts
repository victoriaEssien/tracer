/**
 * Saved-opportunity refresh.
 *
 * Bookmarks go stale quietly: an issue gets closed, assigned, or someone opens
 * a pull request, and the user finds out when they sit down to work on it. This
 * job re-checks saved issues and records what changed so the saved list can say
 * so (spec section 15).
 */

import { githubForBackground, RateLimitError, refreshIssueStatus } from "@/server/github";
import * as queries from "@/server/db/queries";
import { db } from "@/server/db/client";
import { issues } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { IssueRow } from "@/server/db/schema";

export interface RefreshResult {
  checked: number;
  changed: number;
  rateLimited: boolean;
}

export async function refreshSavedOpportunities(
  options: { maxIssues?: number; olderThanHours?: number } = {},
): Promise<RefreshResult> {
  const olderThan = new Date(Date.now() - (options.olderThanHours ?? 12) * 3_600_000);
  const due = await queries.findSavedNeedingRefresh(olderThan, options.maxIssues ?? 50);

  const client = githubForBackground();
  const result: RefreshResult = { checked: 0, changed: 0, rateLimited: false };

  for (const row of due) {
    try {
      const latest = await refreshIssueStatus(
        client,
        row.repository.owner,
        row.repository.name,
        row.issue.number,
      );
      result.checked += 1;
      if (!latest) continue;

      const note = describeChange(row.issue, latest);

      await db
        .update(issues)
        .set({
          state: latest.state,
          assignees: latest.assignees,
          linkedPullRequests: latest.linkedPullRequests,
          commentCount: latest.commentCount,
          updatedAt: new Date(latest.updatedAt),
          closedAt: latest.closedAt ? new Date(latest.closedAt) : null,
          collectedAt: new Date(),
        })
        .where(eq(issues.id, row.issue.id));

      await queries.recordSavedStatus({
        userId: row.userId,
        issueId: row.issue.id,
        statusNote: note,
        changed: note !== null,
      });

      if (note) result.changed += 1;
    } catch (error) {
      if (error instanceof RateLimitError) {
        result.rateLimited = true;
        break;
      }
      throw error;
    }
  }

  return result;
}

/**
 * What changed, in the words the user needs. Returns null when nothing
 * meaningful moved — an unchanged issue should not generate a notice.
 */
function describeChange(
  stored: IssueRow,
  latest: {
    state: "open" | "closed";
    assignees: string[];
    linkedPullRequests: { number: number; state: string; merged: boolean }[];
    commentCount: number;
  },
): string | null {
  if (stored.state === "open" && latest.state === "closed") {
    const merged = latest.linkedPullRequests.find((pr) => pr.merged);
    return merged
      ? `Closed — pull request #${merged.number} was merged`
      : "The issue has been closed";
  }

  const storedPullRequests = new Set(stored.linkedPullRequests.map((pr) => pr.number));
  const newPullRequest = latest.linkedPullRequests.find(
    (pr) => !storedPullRequests.has(pr.number) && pr.state === "open",
  );
  if (newPullRequest) {
    return `Pull request #${newPullRequest.number} now addresses this issue`;
  }

  const newAssignees = latest.assignees.filter((login) => !stored.assignees.includes(login));
  if (newAssignees.length > 0) {
    return `Now assigned to ${newAssignees.map((login) => `@${login}`).join(", ")}`;
  }

  // A burst of discussion usually means the shape of the work changed.
  if (latest.commentCount - stored.commentCount >= 5) {
    return `${latest.commentCount - stored.commentCount} new comments — the issue may have changed`;
  }

  return null;
}
