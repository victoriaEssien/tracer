import { Bookmark } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { OpportunityRow } from "@/components/feed/opportunity-row";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import { getSaved } from "@/server/opportunities";

export const metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const saved = await getSaved(userId);
  const moved = saved.filter((item) => item.statusNote !== null);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Saved"
        lede="Issues you kept for later. Tracer re-checks each one and tells you if it gets closed, assigned, or taken while you were thinking."
      />

      {moved.length > 0 ? (
        <div className="mb-6 border-y border-warn/35 bg-warn-soft px-4 py-3.5">
          <h2 className="text-sm font-semibold text-warn">Something changed</h2>
          <ul className="mt-2 space-y-1.5">
            {moved.map((item) => (
              <li key={item.id} className="text-sm text-ink-soft">
                <Link href={`/opportunities/${item.id}`} className="font-medium hover:underline">
                  {item.title}
                </Link>{" "}
                {item.statusNote}
                <span className="text-ink-faint"> ({relativeTime(item.statusChangedAt)})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved"
          action={<LinkButton href="/feed">Go to your queue</LinkButton>}
        >
          Save an issue and Tracer keeps watching it, so you hear about it if somebody else gets
          there first.
        </EmptyState>
      ) : (
        <ul className="-mx-3 sm:-mx-4">
          {saved.map((item, index) => (
            <li key={item.id}>
              <OpportunityRow opportunity={item} index={index} context="saved" />
              <p className="px-3 pb-3 text-xs text-ink-faint sm:px-4">
                Saved {relativeTime(item.savedAt)} at{" "}
                <span className="font-mono tabular-nums">{Math.round(item.scoreAtSave)}%</span>
                {Math.round(item.scoreAtSave) !== item.score ? (
                  <>
                    , now <span className="font-mono tabular-nums">{item.score}%</span>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
