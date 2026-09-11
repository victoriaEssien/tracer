"use client";

import { useRouter } from "next/navigation";

/**
 * Goes back to wherever you came from.
 *
 * A hardcoded "back to feed" is wrong half the time — the deep dive is reached
 * from the feed, the saved list and the dismissed list.
 */
export function BackLink({ fallback = "/feed" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="text-xs text-ink-faint transition hover:text-ink"
    >
      ← Back
    </button>
  );
}
