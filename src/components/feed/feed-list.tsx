"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { OpportunityCard } from "@/components/feed/opportunity-card";
import { Button, Card, EmptyState, StatusMessage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { OpportunitySummary, Verdict } from "@/types";

type Filter = "all" | Verdict | "dismissed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "recommended", label: "Recommended" },
  { value: "possible", label: "Possible" },
  { value: "not-recommended", label: "Not recommended" },
  { value: "dismissed", label: "Dismissed" },
];

/** A discovery run collects and scores repositories; it is not a quick call. */
const DISCOVERY_TIMEOUT_MS = 240_000;
const POLL_INTERVAL_MS = 4_000;

export function FeedList({
  opportunities,
  discovering = false,
}: {
  opportunities: OpportunitySummary[];
  /** Set when arriving straight from onboarding, where a run is already going. */
  discovering?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [restored, setRestored] = useState<string[]>([]);
  const [undoable, setUndoable] = useState<OpportunitySummary | null>(null);
  const [dismissedList, setDismissedList] = useState<OpportunitySummary[] | null>(null);

  const [running, setRunning] = useState(discovering);
  const [found, setFound] = useState<number | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const startedAt = useRef<number>(discovering ? Date.now() : 0);

  const visible = opportunities
    .filter((item) => !dismissed.includes(item.id))
    .filter((item) => filter === "all" || item.verdict === filter);

  /**
   * While a run is going, poll rather than block. The request itself can take
   * over a minute, and a disabled button is not feedback.
   */
  useEffect(() => {
    if (!running) return;

    const timer = setInterval(async () => {
      if (Date.now() - startedAt.current > DISCOVERY_TIMEOUT_MS) {
        setRunning(false);
        setFailed("That took longer than expected. Whatever was found has been saved.");
        router.refresh();
        return;
      }
      try {
        const response = await fetch("/api/opportunities?limit=100", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { count: number };
        if (body.count !== opportunities.length) {
          setFound(body.count);
          router.refresh();
        }
      } catch {
        // A failed poll is not a failed run; the next tick tries again.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [running, opportunities.length, router]);

  const findMore = useCallback(async () => {
    setFailed(null);
    setFound(null);
    setRunning(true);
    startedAt.current = Date.now();

    try {
      const response = await fetch("/api/jobs/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxIssues: 30 }),
        signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
      });

      if (!response.ok) {
        setFailed(
          response.status === 503
            ? "GitHub's rate limit is exhausted. Try again in a few minutes."
            : "The search failed. Nothing was lost — try again.",
        );
      } else {
        const result = (await response.json()) as {
          issuesAnalyzed: number;
          rateLimited: boolean;
        };
        setFound(result.issuesAnalyzed);
        if (result.rateLimited) {
          setFailed("GitHub's rate limit cut the search short, so this is a partial result.");
        }
      }
    } catch {
      setFailed("The search did not finish. Try again in a moment.");
    } finally {
      setRunning(false);
      router.refresh();
    }
  }, [router]);

  const loadDismissed = useCallback(async () => {
    const response = await fetch("/api/opportunities?dismissed=1", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { opportunities: OpportunitySummary[] };
    setDismissedList(body.opportunities);
  }, []);

  useEffect(() => {
    if (filter === "dismissed") void loadDismissed();
  }, [filter, loadDismissed, restored.length]);

  const undo = async () => {
    if (!undoable) return;
    await fetch(`/api/opportunities/${undoable.id}/dismiss`, { method: "DELETE" });
    setDismissed((current) => current.filter((id) => id !== undoable.id));
    setUndoable(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                filter === option.value ? "bg-raised text-ink" : "text-ink-faint hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button onClick={findMore} disabled={running} className="text-xs">
          {running ? "Searching…" : "Find more"}
        </Button>
      </div>

      {running ? (
        <Card className="flex items-center gap-3 p-4">
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-accent"
          />
          <div>
            <StatusMessage className="text-sm text-ink">
              Searching GitHub and scoring what it finds.
            </StatusMessage>
            <p className="mt-0.5 text-xs text-ink-faint">
              This takes a minute or two. You can keep reading — results appear as they land
              {found !== null ? `, ${found} so far` : ""}.
            </p>
          </div>
        </Card>
      ) : null}

      {failed ? <StatusMessage tone="bad">{failed}</StatusMessage> : null}

      {undoable ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
          <StatusMessage className="text-sm text-ink">
            Dismissed “{undoable.title}”.
          </StatusMessage>
          <div className="flex gap-2">
            <Button onClick={undo} className="text-xs">
              Undo
            </Button>
            <Button variant="ghost" onClick={() => setUndoable(null)} className="text-xs">
              Dismiss this notice
            </Button>
          </div>
        </Card>
      ) : null}

      {filter === "dismissed" ? (
        <DismissedList
          items={dismissedList}
          onRestored={(id) => {
            setDismissedList((current) => current?.filter((item) => item.id !== id) ?? null);
            setRestored((current) => [...current, id]);
          }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            running
              ? "Looking for opportunities"
              : opportunities.length === 0
                ? "Nothing scored yet"
                : "Nothing matches that filter"
          }
          action={
            !running && opportunities.length === 0 ? (
              <Button onClick={findMore}>Find opportunities</Button>
            ) : null
          }
        >
          {running
            ? "The first run searches GitHub, collects each repository, and scores every issue against your profile."
            : opportunities.length === 0
              ? "Tracer searches GitHub for issues that match your profile, then scores each one."
              : "Try widening the filter — a “possible” with a clear issue is often a better use of an afternoon than a “recommended” you have to wait on."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onDismissed={(id) => {
                setDismissed((current) => [...current, id]);
                setUndoable(opportunity);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DismissedList({
  items,
  onRestored,
}: {
  items: OpportunitySummary[] | null;
  onRestored: (id: string) => void;
}) {
  if (items === null) {
    return <StatusMessage>Loading what you dismissed…</StatusMessage>;
  }

  if (items.length === 0) {
    return (
      <EmptyState title="Nothing dismissed">
        Anything you dismiss from the feed shows up here, and can be put back.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          context="dismissed"
          onRemoved={onRestored}
        />
      ))}
    </div>
  );
}
