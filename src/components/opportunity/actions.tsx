"use client";

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
        className="inline-flex items-center rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-canvas transition hover:opacity-90"
      >
        Open on GitHub ↗
      </a>
      <Button onClick={toggleSave} disabled={busy}>
        {saved ? "Saved" : "Save"}
      </Button>
      <Button variant="ghost" onClick={dismiss} disabled={busy}>
        Not for me
      </Button>
    </div>
  );
}
