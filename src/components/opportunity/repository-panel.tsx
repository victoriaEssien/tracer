import { ExternalLink, Panel } from "@/components/ui";
import { formatCompactNumber, relativeTime } from "@/lib/utils";
import type { RepositoryRow } from "@/server/db/schema";
import type { StartingPoint } from "@/types";

/** What kind of project this is, and whether work lands in it. */
export function RepositoryPanel({ repository }: { repository: RepositoryRow }) {
  const activity = repository.activity;

  return (
    <Panel title="The project">
      <ExternalLink href={repository.htmlUrl} className="font-mono text-sm hover:text-accent">
        {repository.fullName}
      </ExternalLink>

      {repository.description ? (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          {repository.description}
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Stat label="Stars" value={formatCompactNumber(repository.stars)} />
        <Stat label="Open issues" value={formatCompactNumber(repository.openIssues)} />
        <Stat
          label="Contributors"
          value={
            activity
              ? `${formatCompactNumber(activity.contributorCount)}${activity.contributorCount >= 100 ? "+" : ""}`
              : "unknown"
          }
        />
        <Stat
          label="Last commit"
          value={relativeTime(activity?.lastCommitAt ?? repository.pushedAt)}
        />
        <Stat
          label="PRs merged, 90 days"
          value={activity ? String(activity.pullRequestsMergedLast90Days) : "unknown"}
        />
        <Stat
          label="First reply to a PR"
          value={
            activity?.medianFirstResponseHours != null
              ? `${formatDuration(activity.medianFirstResponseHours)} typically`
              : "too little history"
          }
        />
      </dl>
    </Panel>
  );
}

/**
 * Files worth opening first. Only paths somebody actually wrote in the issue or
 * its comments appear here, which is why the panel can claim they are real.
 */
export function StartingPointsPanel({
  startingPoints,
  repositoryUrl,
}: {
  startingPoints: StartingPoint[];
  repositoryUrl: string;
}) {
  if (startingPoints.length === 0) return null;

  return (
    <Panel title="Where to start" hint="named in the issue discussion">
      <ol className="space-y-2.5">
        {startingPoints.map((point, index) => (
          <li key={point.path} className="flex gap-3">
            <span className="mt-0.5 font-mono text-xs text-ink-faint tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0">
              <ExternalLink
                href={`${repositoryUrl}/blob/HEAD/${point.path}`}
                className="block truncate font-mono text-sm hover:text-accent hover:underline"
              >
                {point.path}
              </ExternalLink>
              <span className="text-xs text-ink-faint">{point.reason}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-ink-faint">
        A place to start reading, not a map of the whole change.
      </p>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 48) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}
