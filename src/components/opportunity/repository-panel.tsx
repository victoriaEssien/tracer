import { Badge, Card, SectionHeading } from "@/components/ui";
import { formatCompactNumber, relativeTime } from "@/lib/utils";
import type { RepositoryRow } from "@/server/db/schema";
import type { StartingPoint } from "@/types";

/** Repository overview and observed activity (spec section 11). */
export function RepositoryPanel({ repository }: { repository: RepositoryRow }) {
  const activity = repository.activity;

  return (
    <Card className="p-5">
      <SectionHeading>Repository</SectionHeading>

      <a
        href={repository.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-sm font-medium hover:underline"
      >
        {repository.fullName} ↗
      </a>

      {repository.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{repository.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {repository.primaryLanguage ? <Badge>{repository.primaryLanguage}</Badge> : null}
        {repository.topics.slice(0, 5).map((topic) => (
          <Badge key={topic}>{topic}</Badge>
        ))}
        {repository.license ? <Badge>{repository.license}</Badge> : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-3">
        <Stat label="Stars" value={formatCompactNumber(repository.stars)} />
        <Stat label="Open issues" value={formatCompactNumber(repository.openIssues)} />
        <Stat
          label="Contributors"
          value={
            repository.activity
              ? `${formatCompactNumber(repository.activity.contributorCount)}${
                  repository.activity.contributorCount >= 100 ? "+" : ""
                }`
              : "unknown"
          }
        />
        <Stat label="Last commit" value={relativeTime(activity?.lastCommitAt ?? repository.pushedAt)} />
        <Stat
          label="Merged PRs (90d)"
          value={activity ? String(activity.pullRequestsMergedLast90Days) : "unknown"}
        />
        <Stat
          label="First response"
          value={
            activity?.medianFirstResponseHours != null
              ? `~${formatDuration(activity.medianFirstResponseHours)} (median)`
              : "not enough data"
          }
        />
      </dl>
    </Card>
  );
}

/**
 * Files worth opening first. Only paths somebody actually named in the issue or
 * its comments appear here — see `src/server/analysis/starting-points.ts`.
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
    <Card className="p-5">
      <SectionHeading hint="from the issue discussion">Where to start</SectionHeading>

      <ol className="space-y-2">
        {startingPoints.map((point, index) => (
          <li key={point.path} className="flex gap-3">
            <span className="mt-0.5 font-mono text-xs text-ink-faint tabular-nums">
              {index + 1}.
            </span>
            <div className="min-w-0">
              <a
                href={`${repositoryUrl}/blob/HEAD/${point.path}`}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-mono text-sm hover:underline"
              >
                {point.path}
              </a>
              <span className="text-xs text-ink-faint">{point.reason}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs text-ink-faint">
        These paths were named in the issue. They are a starting point, not a complete map of the
        change.
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
