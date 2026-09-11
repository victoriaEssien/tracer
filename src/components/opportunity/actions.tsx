"use client";

import { ArrowUpRight, Bookmark, BookmarkCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

export function OpportunityActions({
  issueId,
  issueUrl,
  initiallySaved,
}: {
  issueId: string;
  issueUrl: string;
  initiallySaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);

  const toggleSave = async () => {
    setBusy(true);
    const next = !saved;
    setSaved(next);
    const response = await fetch(`/api/opportunities/${issueId}/save`, {
      method: next ? "POST" : "DELETE",
    });
    if (!response.ok) setSaved(!next);
    setBusy(false);
    router.refresh();
  };

  const dismiss = async () => {
    setBusy(true);
    await fetch(`/api/opportunities/${issueId}/dismiss`, { method: "POST" });
    router.push("/feed");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={issueUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-canvas transition-colors duration-100 hover:bg-ink/88"
      >
        Take it on GitHub
        <span className="sr-only">(opens in a new tab)</span>
        <ArrowUpRight size={14} strokeWidth={2} aria-hidden />
      </a>

      <Button variant={saved ? "active" : "secondary"} onClick={toggleSave} aria-pressed={saved} disabled={busy}>
        {saved ? (
          <BookmarkCheck size={14} strokeWidth={2} aria-hidden />
        ) : (
          <Bookmark size={14} strokeWidth={2} aria-hidden />
        )}
        {saved ? "Saved" : "Save for later"}
      </Button>

      <Button variant="ghost" onClick={dismiss} disabled={busy}>
        <X size={14} strokeWidth={2} aria-hidden />
        Not for me
      </Button>
    </div>
  );
}
