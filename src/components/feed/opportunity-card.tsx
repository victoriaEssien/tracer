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
import { cn, formatCompactNumber, formatHours, relativeTime } from "@/lib/utils";
import type { OpportunitySummary } from "@/types";

/**
 * One row of the feed.
 *
 * The card has to answer "why is this here?" without being opened — the score
 * is meaningless on its own, so the top reasons ship with it.
 */
export function OpportunityCard({
  opportunity,
  context = "feed",
  onDismissed,
  onRemoved,
}: {
  opportunity: OpportunitySummary;
  /**
   * Which list the card is in. Dismissing from the saved list would hide the
   * card while leaving the bookmark in place, so the saved list offers to
   * remove the bookmark instead.
   */
  context?: "feed" | "saved" | "dismissed";
  onDismissed?: (id: string) => void;
  onRemoved?: (id: string) => void;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(opportunity.saved);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    setBusy(true);
    const response = await fetch(`/api/opportunities/${opportunity.id}/save`, {
      method: next ? "POST" : "DELETE",
    });
    if (!response.ok) setSaved(!next);
    setBusy(false);
    if (context === "saved" && !next) onRemoved?.(opportunity.id);
    startTransition(() => router.refresh());
  };

  const dismiss = async () => {
    setBusy(true);
    await fetch(`/api/opportunities/${opportunity.id}/dismiss`, { method: "POST" });
    setBusy(false);
    onDismissed?.(opportunity.id);
    startTransition(() => router.refresh());
  };

  const restore = async () => {
    setBusy(true);
    await fetch(`/api/opportunities/${opportunity.id}/dismiss`, { method: "DELETE" });
    setBusy(false);
    onRemoved?.(opportunity.id);
    startTransition(() => router.refresh());
  };

  const ageDays = Math.floor(
    (Date.now() - new Date(opportunity.openedAt).getTime()) / 86_400_000,
  );

  return (
    <Card className="p-4 transition hover:border-ink-faint">
      <div className="flex items-start gap-4">
        <div className="w-14 shrink-0 pt-0.5">
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

          {/* Age is the difference between a live issue and an abandoned one,
              so it belongs on the card rather than one click away. */}
          <p className="mt-1 text-xs">
            <span className={cn(ageDays > 365 ? "text-warn" : "text-ink-faint")}>
              opened {relativeTime(opportunity.openedAt)}
            </span>
            <span className="text-ink-faint">
              {" · active "}
              {relativeTime(opportunity.issueUpdatedAt)}
            </span>
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
              View issue
              <span className="sr-only"> (opens on GitHub in a new tab)</span>
              <span aria-hidden> ↗</span>
            </a>

            {context === "dismissed" ? (
              <Button
                variant="secondary"
                onClick={restore}
                disabled={busy || pending}
                className="px-2.5 py-1 text-xs"
              >
                Restore
              </Button>
            ) : (
              <>
                <Button
                  variant={saved ? "active" : "ghost"}
                  onClick={toggleSave}
                  aria-pressed={saved}
                  disabled={busy || pending}
                  className="px-2.5 py-1 text-xs"
                >
                  {saved ? "✓ Saved" : "Save"}
                </Button>
                {context === "feed" ? (
                  <Button
                    variant="ghost"
                    onClick={dismiss}
                    disabled={busy || pending}
                    className="px-2.5 py-1 text-xs"
                  >
                    Dismiss
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
