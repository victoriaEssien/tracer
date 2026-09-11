"use client";

import { useEffect } from "react";

import { Button, Card } from "@/components/ui";

/**
 * The error boundary for every page.
 *
 * Without it, a thrown error drops the user on Next's default stack trace,
 * which is neither reassuring nor actionable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page failed to render", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <Card className="p-6">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          This page did not load. Nothing you have saved or dismissed is affected — the feed and
          your profile are stored server-side.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <a
            href="/feed"
            className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-raised"
          >
            Back to the feed
          </a>
        </div>
      </Card>
    </main>
  );
}
