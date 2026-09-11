import { ArrowUpRight, MessageSquare } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { BackLink } from "@/components/back-link";
import { OpportunityActions } from "@/components/opportunity/actions";
import { AiPanel } from "@/components/opportunity/ai-panel";
import { IssueBody } from "@/components/opportunity/issue-body";
import { RepositoryPanel, StartingPointsPanel } from "@/components/opportunity/repository-panel";
import { ScoreBreakdown } from "@/components/opportunity/score-breakdown";
import { VerdictPanel } from "@/components/opportunity/verdict-panel";
import { Chip, ExternalLink, Panel } from "@/components/ui";
import { isAiEnabled } from "@/config/env";
import { relativeTime, truncate } from "@/lib/utils";
import { getOpportunity } from "@/server/opportunities";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return { title: "Opportunity" };
  const { id } = await params;
  const detail = await getOpportunity(userId, id);
  return { title: detail ? detail.issue.title : "Opportunity" };
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const { id } = await params;
  const detail = await getOpportunity(userId, id);
  if (!detail) notFound();

  const { issue, repository, recommendation } = detail;

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <BackLink />

      <header className="mt-5 mb-8">
        <h1 className="font-display text-3xl leading-[1.15] tracking-tight text-balance sm:text-4xl">
          {issue.title}
        </h1>

        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
          <ExternalLink href={repository.htmlUrl} className="font-mono hover:text-accent">
            {repository.fullName}
          </ExternalLink>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">#{issue.number}</span>
          <span aria-hidden>·</span>
          <span>opened {relativeTime(issue.createdAt)}</span>
          <span aria-hidden>·</span>
          <span>active {relativeTime(issue.updatedAt)}</span>
        </p>

        {issue.labels.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {issue.labels.slice(0, 8).map((label) => (
              <Chip key={label.name}>{label.name}</Chip>
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          <OpportunityActions
            issueId={issue.id}
            issueUrl={issue.htmlUrl}
            initiallySaved={detail.saved}
          />
        </div>

        {detail.stale ? (
          <p className="mt-4 text-xs text-ink-faint">
            This copy of the issue is from {relativeTime(issue.collectedAt)}. Check GitHub for
            anything that changed since.
          </p>
        ) : null}
      </header>

      <div className="space-y-10">
        <VerdictPanel recommendation={recommendation} />

        <ScoreBreakdown
          breakdown={recommendation.breakdown}
          alreadyShown={[
            ...recommendation.explanation.positives,
            ...recommendation.explanation.concerns,
          ]}
        />

        <StartingPointsPanel
          startingPoints={recommendation.analysis.startingPoints}
          repositoryUrl={repository.htmlUrl}
        />

        <AiPanel issueId={issue.id} initial={recommendation.ai} enabled={isAiEnabled()} />

        <RepositoryPanel repository={repository} />

        <Panel
          title="The issue itself"
          hint={
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={12} strokeWidth={2} aria-hidden />
              <span className="tabular-nums">{issue.commentCount}</span> comments on GitHub
            </span>
          }
        >
          {issue.body ? (
            <IssueBody markdown={truncate(issue.body, 6000)} />
          ) : (
            <p className="text-sm text-ink-faint">
              A title and no description, which tells you something in itself.
            </p>
          )}

          <ExternalLink
            href={issue.htmlUrl}
            className="mt-5 text-xs text-ink-faint hover:text-accent"
          >
            Read the full issue and its discussion
            <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
          </ExternalLink>
        </Panel>
      </div>
    </main>
  );
}
