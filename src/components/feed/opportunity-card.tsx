"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Badge,
  Button,
  Card,
  DifficultyBadge,
  ReasonList,
  Score,
  VerdictBadge,
} from "@/components/ui";
import { formatCompactNumber, formatHours, relativeTime } from "@/lib/utils";
import type { OpportunitySummary } from "@/types";

/**
 * One row of the feed.
 *
 * The card has to answer "why is this here?" without being opened — the score
 * is meaningless on its own, so the top reasons ship with it.
 */
export function OpportunityCard({
  opportunity,
  onDismissed,
}: {
  opportunity: OpportunitySummary;
  onDismissed?: (id: string) => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(opportunity.saved);
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    const response = await fetch(`/api/opportunities/${opportunity.id}/save`, {
      method: next ? "POST" : "DELETE",
    });
    if (!response.ok) setSaved(!next);
    startTransition(() => router.refresh());
  };

  const dismiss = async () => {
    setHidden(true);
    await fetch(`/api/opportunities/${opportunity.id}/dismiss`, { method: "POST" });
    onDismissed?.(opportunity.id);
    startTransition(() => router.refresh());
  };

  return (
    <Card className="p-4 transition hover:border-ink-faint">
      <div className="flex items-start gap-4">
        <div className="w-12 shrink-0 pt-0.5">
          <Score value={opportunity.score} verdict={opportunity.verdict} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="text-[0.95rem] leading-snug font-medium hover:underline"
            >
              {opportunity.title}
            </Link>
            <VerdictBadge verdict={opportunity.verdict} />
          </div>

          <p className="mt-1 font-mono text-xs text-ink-faint">
            {opportunity.repository.fullName} #{opportunity.issueNumber} ·{" "}
            {formatCompactNumber(opportunity.repository.stars)} stars
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {opportunity.technologies.slice(0, 4).map((technology) => (
              <Badge key={technology}>{technology}</Badge>
            ))}
            <DifficultyBadge difficulty={opportunity.difficulty} />
            <span className="text-xs text-ink-faint">
              {formatHours(opportunity.estimatedHours)} (estimated)
            </span>
          </div>

          {opportunity.topReasons.length > 0 ? (
            <ReasonList items={opportunity.topReasons} tone="positive" className="mt-3" />
          ) : null}
          {opportunity.topConcerns.length > 0 ? (
            <ReasonList items={opportunity.topConcerns} tone="concern" className="mt-2" />
          ) : null}

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium transition hover:bg-raised"
            >
              Why?
            </Link>
            <a
              href={opportunity.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-line px-2.5 py-1 text-xs font-medium transition hover:bg-raised"
            >
              View issue ↗
            </a>
            <Button
              variant="ghost"
              onClick={toggleSave}
              disabled={pending}
              className="px-2.5 py-1 text-xs"
            >
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="ghost"
              onClick={dismiss}
              disabled={pending}
              className="px-2.5 py-1 text-xs"
            >
              Dismiss
            </Button>
            <span className="ml-auto text-xs text-ink-faint">
              scored {relativeTime(opportunity.analyzedAt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
