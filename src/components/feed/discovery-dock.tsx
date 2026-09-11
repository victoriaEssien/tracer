"use client";

import { Check, Search, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import type { DiscoveryProgress } from "@/types";

/** A run takes a minute or two; past this something has gone wrong. */
const TIMEOUT_MS = 240_000;

/**
 * The discovery run, docked in the corner while it works.
 *
 * The run is long and moves through three distinct phases, so it reports each
 * step over a streamed response rather than leaving a spinner to imply progress
 * it cannot show. Docked rather than inline so the queue stays usable and
 * readable while it fills up underneath.
 */
export function DiscoveryDock({
  running,
  onFinished,
}: {
  running: boolean;
  onFinished: () => void;
}) {
  const [progress, setProgress] = useState<DiscoveryProgress | null>(null);
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const cancelled = useRef(false);

  /** Closing the widget stops the search, on this end and on the server's. */
  const cancel = useCallback(() => {
    cancelled.current = true;
    controller.current?.abort();
    setProgress(null);
  }, []);

  const run = useCallback(async () => {
    cancelled.current = false;
    setProgress({ phase: "searching", queriesRun: 0, queriesTotal: 12, candidates: 0 });

    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

    try {
      const response = await fetch("/api/jobs/discovery?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxIssues: 30 }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        setProgress({
          phase: "error",
          message:
            response.status === 503
              ? "GitHub is not answering any more requests right now. Try again in a few minutes."
              : "That search did not work. Nothing was lost, so try again.",
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // The tail may be half an event; it waits for the next chunk.
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim()) setProgress(JSON.parse(line) as DiscoveryProgress);
        }
      }
    } catch {
      // Cancelling is a choice, not a failure, so it reports nothing.
      if (!cancelled.current) {
        setProgress({
          phase: "error",
          message: "That search did not finish. Try again in a moment.",
        });
      }
    } finally {
      clearTimeout(timer);
      active.current = false;
      onFinished();
    }
  }, [onFinished]);

  useEffect(() => {
    if (!running || active.current) return;
    active.current = true;
    void run();
  }, [running, run]);

  if (!progress) return null;

  const { label, detail, percent, partial } = describe(progress);
  const finished = progress.phase === "done" || progress.phase === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 left-4 z-30 sm:left-auto sm:w-80"
    >
      <div className="rounded-xl border border-line bg-surface p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.28)]">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0">
            {progress.phase === "done" ? (
              <Check size={15} strokeWidth={2.5} aria-hidden className="text-good" />
            ) : progress.phase === "error" ? (
              <TriangleAlert size={15} strokeWidth={2} aria-hidden className="text-warn" />
            ) : (
              <Search size={15} strokeWidth={2} aria-hidden className="animate-pulse text-accent" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{detail}</p>
          </div>

          <button
            type="button"
            onClick={cancel}
            aria-label={finished ? "Dismiss" : "Stop the search"}
            className="-m-1 rounded p-1 text-ink-faint transition-colors duration-100 hover:text-ink"
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {!finished ? (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}

        {partial ? (
          <p className="mt-2.5 text-xs text-warn">
            GitHub stopped answering part way, so this is only part of what is out there.
          </p>
        ) : null}

        {progress.phase === "done" && progress.scored > 0 ? (
          <Button variant="secondary" size="sm" onClick={cancel} className="mt-3 w-full">
            Show me
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Phases carry unequal weight: searching is quick, collecting a repository is
 * seven API calls, and scoring is local. The bar tracks the real wait rather
 * than counting steps evenly.
 */
function describe(progress: DiscoveryProgress): {
  label: string;
  detail: string;
  percent: number;
  partial: boolean;
} {
  switch (progress.phase) {
    case "searching":
      return {
        label: "Searching GitHub",
        detail: `${progress.candidates} candidates from ${progress.queriesRun} of ${progress.queriesTotal} searches`,
        percent: 4 + (progress.queriesRun / Math.max(progress.queriesTotal, 1)) * 16,
        partial: false,
      };
    case "collecting":
      return {
        label: "Reading the projects",
        detail: `${progress.repositories} projects, ${progress.issues} issues collected`,
        percent: 20 + (progress.issues / Math.max(progress.issuesTarget, 1)) * 60,
        partial: false,
      };
    case "scoring":
      return {
        label: "Scoring against your profile",
        detail: `${progress.analyzed} of ${progress.total} issues`,
        percent: 80 + (progress.analyzed / Math.max(progress.total, 1)) * 20,
        partial: false,
      };
    case "done":
      return {
        label: progress.scored > 0 ? `${progress.scored} new issues scored` : "Nothing new found",
        detail:
          progress.scored > 0
            ? "They are in your queue, ranked by fit."
            : "Everything GitHub returned was already scored for you.",
        percent: 100,
        partial: progress.rateLimited,
      };
    case "error":
      return { label: "Search stopped", detail: progress.message, percent: 100, partial: false };
  }
}
