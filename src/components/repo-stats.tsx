import { GitFork, Star } from "lucide-react";

import { REPOSITORY_URL } from "@/config/site";
import { formatCompactNumber } from "@/lib/utils";
import { ownRepoStats } from "@/server/github";

/**
 * Stars and forks on Tracer's own repository, next to the wordmark.
 *
 * Hidden below `sm`. The header is one fixed row because the queue's filter bar
 * sticks beneath it, and on a 360px screen the room left over after the logo is
 * already spoken for by the menu button or the sign-in call to action.
 *
 * Nothing renders when the lookup fails: zeroes would state something about the
 * repository that we did not learn.
 */
export async function RepoStats() {
  const stats = await ownRepoStats();
  if (!stats) return null;

  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer"
      className="hidden shrink-0 items-center gap-2.5 rounded-md border border-line px-2 py-1 text-xs text-ink-soft transition-colors duration-100 hover:border-line-strong hover:text-ink sm:inline-flex"
    >
      <span aria-hidden className="inline-flex items-center gap-2.5 tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Star size={12} strokeWidth={2} />
          {formatCompactNumber(stats.stars)}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork size={12} strokeWidth={2} />
          {formatCompactNumber(stats.forks)}
        </span>
      </span>

      <span className="sr-only">
        {stats.stars} {stats.stars === 1 ? "star" : "stars"} and {stats.forks}{" "}
        {stats.forks === 1 ? "fork" : "forks"} on GitHub (opens in a new tab)
      </span>
    </a>
  );
}
