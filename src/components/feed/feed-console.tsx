"use client";

import { Inbox, Loader2, RefreshCw, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoveryDock } from "@/components/feed/discovery-dock";
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
  { value: "dismissed", label: "Hidden" },
];

export function FeedConsole({
  opportunities,
  discovering = false,
}: {
  opportunities: OpportunitySummary[];
  /** Set when arriving straight from onboarding, where a first run is due. */
  discovering?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [undoable, setUndoable] = useState<OpportunitySummary | null>(null);
  const [dismissedList, setDismissedList] = useState<OpportunitySummary[] | null>(null);
  const [restoredCount, setRestoredCount] = useState(0);
  const [running, setRunning] = useState(discovering);

  const [cursor, setCursor] = useState(0);
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  const live = opportunities.filter((item) => !dismissed.includes(item.id));
  const visible = live.filter((item) => filter === "all" || item.verdict === filter);

  // Counts belong on the filters, where the choice is actually made.
  const counts: Record<Filter, number | null> = {
    all: live.length,
    recommended: live.filter((item) => item.verdict === "recommended").length,
    possible: live.filter((item) => item.verdict === "possible").length,
    "not-recommended": live.filter((item) => item.verdict === "not-recommended").length,
    // Only known once the hidden list has been fetched.
    dismissed: dismissedList?.length ?? null,
  };

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
          rows.current[next]?.scrollIntoView({ block: "nearest" });
          rows.current[next]?.focus({ preventScroll: true });
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
      <div className="sticky top-13 z-10 -mx-3 mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-canvas/92 px-3 py-2.5 backdrop-blur-sm sm:-mx-4 sm:px-4">
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
              {counts[option.value] !== null ? (
                <span className="ml-1.5 font-mono text-[0.68rem] tabular-nums opacity-70">
                  {counts[option.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <Button onClick={() => setRunning(true)} disabled={running} size="sm">
          {running ? (
            <Loader2 size={12} strokeWidth={2} aria-hidden className="animate-spin" />
          ) : (
            <RefreshCw size={12} strokeWidth={2} aria-hidden />
          )}
          {running ? "Searching" : "Find more"}
        </Button>
      </div>

      <DiscoveryDock
        running={running}
        onFinished={() => {
          setRunning(false);
          router.refresh();
        }}
      />

      {undoable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised px-3 py-2.5 sm:px-4">
          <StatusMessage className="text-sm text-ink">Hidden: {undoable.title}</StatusMessage>
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
                <Button variant="primary" onClick={() => setRunning(true)}>
                  Find opportunities
                </Button>
              ) : null
            }
          >
            {running
              ? "Searching GitHub, reading each project, and scoring every issue against your profile."
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
                    rows.current[index] = node;
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
