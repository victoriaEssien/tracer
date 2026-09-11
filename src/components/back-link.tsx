"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Goes back where you came from. The dossier is reached from the queue, the
 * saved list and the hidden list, so a hardcoded destination is wrong two
 * times in three.
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
      className="inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors duration-100 hover:text-ink"
    >
      <ArrowLeft size={12} strokeWidth={2} aria-hidden />
      Back
    </button>
  );
}
