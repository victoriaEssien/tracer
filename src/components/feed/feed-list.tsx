"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OpportunityCard } from "@/components/feed/opportunity-card";
import { Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { OpportunitySummary, Verdict } from "@/types";

type Filter = "all" | Verdict;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "recommended", label: "Recommended" },
  { value: "possible", label: "Possible" },
];

export function FeedList({ opportunities }: { opportunities: OpportunitySummary[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [finding, setFinding] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = opportunities
    .filter((item) => !dismissed.includes(item.id))
    .filter((item) => filter === "all" || item.verdict === filter);

  const findMore = async () => {
    setFinding(true);
    await fetch("/api/jobs/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxIssues: 30 }),
    }).catch(() => null);
    setFinding(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                filter === option.value
                  ? "bg-raised text-ink"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button onClick={findMore} disabled={finding} className="text-xs">
          {finding ? "Searching GitHub…" : "Find more"}
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={
            opportunities.length === 0
              ? "Nothing scored yet"
              : "Nothing matches that filter"
          }
          action={
            opportunities.length === 0 ? (
              <Button onClick={findMore} disabled={finding}>
                {finding ? "Searching GitHub…" : "Find opportunities"}
              </Button>
            ) : null
          }
        >
          {opportunities.length === 0
            ? "Tracer searches GitHub for issues that match your profile, then scores each one. A first run takes a few moments."
            : "Try widening the filter — a “possible” with a clear issue is often a better use of an afternoon than a “recommended” you have to wait on."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onDismissed={(id) => setDismissed((current) => [...current, id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
