"use client";

import { Inbox, Loader2, RefreshCw, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { OpportunityRow } from "@/components/feed/opportunity-row";
import { Button, EmptyState, StatusMessage } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { OpportunitySummary, Verdict } from "@/types";

type Filter = "all" | Verdict | "dismissed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recommended", label: "Take it" },
  { value: "possible", label: "Worth a look" },
  { value: "not-recommended", label: "Skip" },
  { value: "dismissed", label: "Not for me" },
];

/** A discovery run collects and scores repositories; it is not a quick call. */
const DISCOVERY_TIMEOUT_MS = 240_000;
const POLL_INTERVAL_MS = 4_000;

export function FeedConsole({
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
  const [undoable, setUndoable] = useState<OpportunitySummary | null>(null);
  const [dismissedList, setDismissedList] = useState<OpportunitySummary[] | null>(null);
  const [restoredCount, setRestoredCount] = useState(0);

  const [running, setRunning] = useState(discovering);
  const [found, setFound] = useState<number | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const startedAt = useRef<number>(discovering ? Date.now() : 0);

  const [cursor, setCursor] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const visible = opportunities
    .filter((item) => !dismissed.includes(item.id))
    .filter((item) => filter === "all" || item.verdict === filter);

  /**
   * Keyboard triage. The audience lives on keyboards and the job is getting
   * through a queue, so the queue is operable without the mouse.
   */
  useEffect(() => {
    if (filter === "dismissed") return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const move = (delta: number) => {
        event.preventDefault();
        setCursor((current) => {
          const next = Math.min(Math.max(current + delta, 0), Math.max(visible.length - 1, 0));
          rowRefs.current[next]?.scrollIntoView({ block: "nearest" });
          rowRefs.current[next]?.focus({ preventScroll: true });
          return next;
        });
      };

      if (event.key === "j" || event.key === "ArrowDown") move(1);
      else if (event.key === "k" || event.key === "ArrowUp") move(-1);
      else if (event.key === "Enter" && visible[cursor]) {
        router.push(`/opportunities/${visible[cursor].id}`);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, cursor, filter, router]);

  /**
   * While a run is going, poll rather than block. The request itself can take
   * over a minute, and a disabled button is not feedback.
   */
  useEffect(() => {
    if (!running) return;

    const timer = setInterval(async () => {
      if (Date.now() - startedAt.current > DISCOVERY_TIMEOUT_MS) {
        setRunning(false);
        setFailed("That run took longer than expected. Anything it found has been saved.");
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
            ? "GitHub has run out of requests for now. Try again in a few minutes."
            : "That search failed. Nothing was lost, so try again.",
        );
      } else {
        const result = (await response.json()) as { issuesAnalyzed: number; rateLimited: boolean };
        setFound(result.issuesAnalyzed);
        if (result.rateLimited) {
          setFailed("GitHub cut the search short on rate limits, so this is a partial result.");
        }
      }
    } catch {
      setFailed("That search did not finish. Try again in a moment.");
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
  }, [filter, loadDismissed, restoredCount]);

  const undo = async () => {
    if (!undoable) return;
    await fetch(`/api/opportunities/${undoable.id}/dismiss`, { method: "DELETE" });
    setDismissed((current) => current.filter((id) => id !== undoable.id));
    setUndoable(null);
    router.refresh();
  };

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-3 mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-canvas/92 px-3 py-2.5 backdrop-blur-sm sm:-mx-4 sm:px-4">
        <div role="group" aria-label="Filter by verdict" className="flex flex-wrap gap-0.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors duration-100",
                filter === option.value
                  ? "bg-ink text-canvas"
                  : "text-ink-faint hover:bg-raised hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button onClick={findMore} disabled={running} size="sm">
          {running ? (
            <Loader2 size={12} strokeWidth={2} aria-hidden className="animate-spin" />
          ) : (
            <RefreshCw size={12} strokeWidth={2} aria-hidden />
          )}
          {running ? "Searching" : "Find more"}
        </Button>
      </div>

      {running ? (
        <div className="border-b border-line px-3 py-3 sm:px-4">
          <StatusMessage className="text-sm text-ink">
            Searching GitHub and scoring what it finds.
          </StatusMessage>
          <p className="mt-0.5 text-xs text-ink-faint">
            This takes a minute or two. Results appear as they land
            {found !== null ? `, ${found} so far` : ""}.
          </p>
        </div>
      ) : null}

      {failed ? (
        <div className="border-b border-line px-3 py-3 sm:px-4">
          <StatusMessage tone="bad">{failed}</StatusMessage>
        </div>
      ) : null}

      {undoable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised px-3 py-2.5 sm:px-4">
          <StatusMessage className="text-sm text-ink">
            Hidden: {undoable.title}
          </StatusMessage>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={undo}>
              Put it back
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setUndoable(null)}>
              Fine
            </Button>
          </div>
        </div>
      ) : null}

      {filter === "dismissed" ? (
        <DismissedQueue
          items={dismissedList}
          onRestored={(id) => {
            setDismissedList((current) => current?.filter((item) => item.id !== id) ?? null);
            setRestoredCount((count) => count + 1);
          }}
        />
      ) : visible.length === 0 ? (
        <div className="py-6">
          <EmptyState
            icon={opportunities.length === 0 ? Inbox : SearchX}
            title={
              running
                ? "Looking for work"
                : opportunities.length === 0
                  ? "Nothing scored yet"
                  : "Nothing under this filter"
            }
            action={
              !running && opportunities.length === 0 ? (
                <Button variant="primary" onClick={findMore}>
                  Find opportunities
                </Button>
              ) : null
            }
          >
            {running
              ? "The first run searches GitHub, collects each repository, and scores every issue against your profile."
              : opportunities.length === 0
                ? "Tracer searches GitHub for issues matching your profile, then scores each one against what you know and the time you have."
                : "Widen the filter. A “worth a look” with a clear issue often beats a “take it” you have to wait on."}
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className="-mx-3 sm:-mx-4">
            {visible.map((opportunity, index) => (
              <li key={opportunity.id}>
                <OpportunityRow
                  ref={(node) => {
                    rowRefs.current[index] = node;
                  }}
                  opportunity={opportunity}
                  index={index}
                  selected={index === cursor}
                  onFocus={() => setCursor(index)}
                  onDismissed={(id) => {
                    setDismissed((current) => [...current, id]);
                    setUndoable(opportunity);
                  }}
                />
              </li>
            ))}
          </ul>
          <p className="px-3 py-4 text-xs text-ink-faint sm:px-4">
            <kbd className="font-mono">j</kbd> and <kbd className="font-mono">k</kbd> move through
            the queue, <kbd className="font-mono">Enter</kbd> opens the reasoning.
          </p>
        </>
      )}
    </div>
  );
}

function DismissedQueue({
  items,
  onRestored,
}: {
  items: OpportunitySummary[] | null;
  onRestored: (id: string) => void;
}) {
  if (items === null) {
    return (
      <div className="px-3 py-5 sm:px-4">
        <StatusMessage>Loading what you hid.</StatusMessage>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-6">
        <EmptyState icon={Inbox} title="Nothing hidden">
          Anything you mark as not for you lands here, and can be put back.
        </EmptyState>
      </div>
    );
  }

  return (
    <ul className="-mx-3 sm:-mx-4">
      {items.map((opportunity, index) => (
        <li key={opportunity.id}>
          <OpportunityRow
            opportunity={opportunity}
            index={index}
            context="dismissed"
            onRemoved={onRestored}
          />
        </li>
      ))}
    </ul>
  );
}
