"use client";

import { ArrowUpRight, Bookmark, BookmarkCheck, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useState, useTransition } from "react";

import {
  Button,
  Chip,
  DifficultyChip,
  EvidenceList,
  ExternalLink,
  ScoreMeter,
  VerdictChip,
} from "@/components/ui";
import { cn, formatCompactNumber, formatHours, relativeTime } from "@/lib/utils";
import type { OpportunitySummary } from "@/types";

/**
 * One line of the queue.
 *
 * A row rather than a card: forty of these get read in a sitting, and cards put
 * a border and a gap between every comparison the user is trying to make. The
 * score sits left so the column itself is scannable, and the reasoning sits
 * under the title because a score without it is not a recommendation.
 */
export const OpportunityRow = forwardRef<
  HTMLDivElement,
  {
    opportunity: OpportunitySummary;
    index?: number;
    context?: "feed" | "saved" | "dismissed";
    selected?: boolean;
    onDismissed?: (id: string) => void;
    onRemoved?: (id: string) => void;
    onFocus?: () => void;
  }
>(function OpportunityRow(
  { opportunity, index = 0, context = "feed", selected = false, onDismissed, onRemoved, onFocus },
  ref,
) {
  const router = useRouter();
  const [saved, setSaved] = useState(opportunity.saved);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const act = async (run: () => Promise<unknown>) => {
    setBusy(true);
    await run();
    setBusy(false);
    startTransition(() => router.refresh());
  };

  const toggleSave = () =>
    act(async () => {
      const next = !saved;
      setSaved(next);
      const response = await fetch(`/api/opportunities/${opportunity.id}/save`, {
        method: next ? "POST" : "DELETE",
      });
      if (!response.ok) setSaved(!next);
      else if (context === "saved" && !next) onRemoved?.(opportunity.id);
    });

  const dismiss = () =>
    act(async () => {
      await fetch(`/api/opportunities/${opportunity.id}/dismiss`, { method: "POST" });
      onDismissed?.(opportunity.id);
    });

  const restore = () =>
    act(async () => {
      await fetch(`/api/opportunities/${opportunity.id}/dismiss`, { method: "DELETE" });
      onRemoved?.(opportunity.id);
    });

  const ageDays = Math.floor((Date.now() - new Date(opportunity.openedAt).getTime()) / 86_400_000);
  const disabled = busy || pending;

  return (
    <div
      ref={ref}
      data-row
      tabIndex={-1}
      onFocus={onFocus}
      className={cn(
        "group relative border-b border-line px-3 py-4 transition-colors duration-100 sm:px-4",
        selected ? "bg-raised" : "hover:bg-raised/60",
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="shrink-0 pt-0.5">
          <ScoreMeter
            value={opportunity.score}
            verdict={opportunity.verdict}
            animate
            delayMs={Math.min(index, 12) * 25}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="text-[0.9375rem] leading-snug font-medium hover:text-accent hover:underline"
            >
              {opportunity.title}
            </Link>
            <VerdictChip verdict={opportunity.verdict} />
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
            <span className="max-w-full font-mono break-all">
              {opportunity.repository.fullName}
            </span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {formatCompactNumber(opportunity.repository.stars)} stars
            </span>
            <span aria-hidden>·</span>
            {/* Age separates a live issue from an abandoned one, which is the
                whole question this product exists to answer. */}
            <span className={cn(ageDays > 365 && "text-warn")}>
              opened {relativeTime(opportunity.openedAt)}
            </span>
            <span aria-hidden>·</span>
            <span>active {relativeTime(opportunity.issueUpdatedAt)}</span>
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {opportunity.technologies.slice(0, 3).map((technology) => (
              <Chip key={technology}>{technology}</Chip>
            ))}
            <DifficultyChip difficulty={opportunity.difficulty} />
            <Chip>{formatHours(opportunity.estimatedHours)}</Chip>
          </div>

          <EvidenceList items={opportunity.topReasons} tone="positive" className="mt-3" />
          <EvidenceList items={opportunity.topConcerns} tone="caution" className="mt-2" />

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium transition-colors duration-100 hover:border-line-strong hover:bg-surface"
            >
              See the reasoning
            </Link>
            <ExternalLink
              href={opportunity.issueUrl}
              className="min-h-8 rounded-md border border-line px-2.5 py-1 text-xs font-medium transition-colors duration-100 hover:border-line-strong hover:bg-surface"
            >
              Open on GitHub
              <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
            </ExternalLink>

            {context === "dismissed" ? (
              <Button variant="secondary" size="sm" onClick={restore} disabled={disabled}>
                <RotateCcw size={12} strokeWidth={2} aria-hidden />
                Put back
              </Button>
            ) : (
              <>
                <Button
                  variant={saved ? "active" : "ghost"}
                  size="sm"
                  onClick={toggleSave}
                  aria-pressed={saved}
                  disabled={disabled}
                >
                  {saved ? (
                    <BookmarkCheck size={12} strokeWidth={2} aria-hidden />
                  ) : (
                    <Bookmark size={12} strokeWidth={2} aria-hidden />
                  )}
                  {saved ? "Saved" : "Save"}
                </Button>
                {context === "feed" ? (
                  <Button variant="ghost" size="sm" onClick={dismiss} disabled={disabled}>
                    <X size={12} strokeWidth={2} aria-hidden />
                    Not for me
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
