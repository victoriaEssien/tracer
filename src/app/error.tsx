"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";

/**
 * The error boundary for every page. Without it a thrown error drops the user
 * on Next's default stack trace, which is neither reassuring nor actionable.
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
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl tracking-tight">That did not load</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
        Your queue, your saved issues and your profile are all stored server-side, so nothing is
        lost. Try again.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-ink-faint">Reference {error.digest}</p>
      ) : null}
      <div className="mt-6 flex gap-2">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <a
          href="/feed"
          className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors duration-100 hover:bg-raised"
        >
          Back to your queue
        </a>
      </div>
    </main>
  );
}
