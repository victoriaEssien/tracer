import Link from "next/link";
import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { OpportunityCard } from "@/components/feed/opportunity-card";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import { getSaved } from "@/server/opportunities";

export const metadata = { title: "Saved · Tracer" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const saved = await getSaved(userId);
  const changed = saved.filter((item) => item.statusNote !== null);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Re-checked periodically for issues that were closed, assigned, or picked up by somebody
          else.
        </p>
      </div>

      {changed.length > 0 ? (
        <Card className="mb-5 border-warn/40 bg-warn-soft p-4">
          <h2 className="text-sm font-medium text-warn">Status changed</h2>
          <ul className="mt-2 space-y-1.5">
            {changed.map((item) => (
              <li key={item.id} className="text-sm text-ink-soft">
                <Link href={`/opportunities/${item.id}`} className="font-medium hover:underline">
                  {item.title}
                </Link>{" "}
                — {item.statusNote}
                <span className="text-ink-faint"> ({relativeTime(item.statusChangedAt)})</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          action={<LinkButton href="/feed">Go to the feed</LinkButton>}
        >
          Save an opportunity and Tracer will keep an eye on it — you will be told here if it gets
          closed, assigned, or picked up by someone else.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {saved.map((item) => (
            <div key={item.id}>
              <OpportunityCard opportunity={item} />
              <p className="mt-1 px-4 text-xs text-ink-faint">
                Saved {relativeTime(item.savedAt)} at {Math.round(item.scoreAtSave)}%
                {Math.round(item.scoreAtSave) !== item.score
                  ? ` · now ${item.score}%`
                  : null}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
