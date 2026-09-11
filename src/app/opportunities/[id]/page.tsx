import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { isAiEnabled } from "@/config/env";
import { OpportunityActions } from "@/components/opportunity/actions";
import { AiPanel } from "@/components/opportunity/ai-panel";
import {
  RepositoryPanel,
  StartingPointsPanel,
} from "@/components/opportunity/repository-panel";
import { ScoreBreakdown } from "@/components/opportunity/score-breakdown";
import { VerdictPanel } from "@/components/opportunity/verdict-panel";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { relativeTime, truncate } from "@/lib/utils";
import { getOpportunity } from "@/server/opportunities";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const { id } = await params;
  const detail = await getOpportunity(userId, id);
  if (!detail) notFound();

  const { issue, repository, recommendation } = detail;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/feed" className="text-xs text-ink-faint transition hover:text-ink">
        ← Back to feed
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl leading-snug font-semibold tracking-tight text-balance">
          {issue.title}
        </h1>
        <p className="mt-1.5 font-mono text-xs text-ink-faint">
          {repository.fullName} #{issue.number} · opened {relativeTime(issue.createdAt)} · updated{" "}
          {relativeTime(issue.updatedAt)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 8).map((label) => (
            <Badge key={label.name}>{label.name}</Badge>
          ))}
        </div>

        <div className="mt-4">
          <OpportunityActions
            issueId={issue.id}
            issueUrl={issue.htmlUrl}
            initiallySaved={detail.saved}
          />
        </div>

        {detail.stale ? (
          <p className="mt-3 text-xs text-ink-faint">
            This copy of the issue was collected {relativeTime(issue.collectedAt)}. Check GitHub for
            anything that has changed since.
          </p>
        ) : null}
      </header>

      <div className="space-y-4">
        <VerdictPanel recommendation={recommendation} />

        <ScoreBreakdown breakdown={recommendation.breakdown} />

        <StartingPointsPanel
          startingPoints={recommendation.analysis.startingPoints}
          repositoryUrl={repository.htmlUrl}
        />

        <AiPanel issueId={issue.id} initial={recommendation.ai} enabled={isAiEnabled()} />

        <RepositoryPanel repository={repository} />

        <Card className="p-5">
          <SectionHeading hint={`${issue.commentCount} comments on GitHub`}>
            The issue
          </SectionHeading>
          {issue.body ? (
            <div className="issue-body">{truncate(issue.body, 4000)}</div>
          ) : (
            <p className="text-sm text-ink-faint">
              This issue has a title and no description, which is itself the most useful thing to
              know about it.
            </p>
          )}
          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-xs text-ink-faint transition hover:text-ink"
          >
            Read the full issue and its discussion on GitHub ↗
          </a>
        </Card>
      </div>
    </main>
  );
}
