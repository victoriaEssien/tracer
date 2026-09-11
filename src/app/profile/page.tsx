import { redirect } from "next/navigation";

import { auth, currentUserId } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { DIMENSION_LABELS } from "@/config/scoring";
import { getUserProfile } from "@/server/db/queries";
import { getLearnedPreferences } from "@/server/opportunities";
import type { ScoreDimension } from "@/types";

export const metadata = { title: "Profile · Tracer" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const [session, profile, learned] = await Promise.all([
    auth(),
    getUserProfile(userId),
    getLearnedPreferences(userId),
  ]);

  const weights = Object.entries(learned.weights) as [ScoreDimension, number][];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Signed in as {session?.user?.name ?? session?.user?.email ?? "your GitHub account"}.
          Changing anything here re-scores your feed.
        </p>
      </div>

      <Card className="mb-8 p-5">
        <SectionHeading hint={`${learned.eventsConsidered} saves and dismissals so far`}>
          What Tracer has learned about you
        </SectionHeading>

        {learned.observations.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Nothing yet. Once you have saved or dismissed a handful of opportunities, Tracer starts
            adjusting how much each dimension counts for — and says so here rather than doing it
            quietly.
          </p>
        ) : (
          <ul className="mb-4 space-y-1.5">
            {learned.observations.map((observation) => (
              <li key={observation} className="flex gap-2 text-sm text-ink-soft">
                <span className="text-ink-faint">–</span>
                <span>{observation}</span>
              </li>
            ))}
          </ul>
        )}

        {learned.favouredTechnologies.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {learned.favouredTechnologies.map((technology) => (
              <Badge key={technology} tone="accent">
                {technology}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs text-ink-faint">Your current weights</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
            {weights.map(([dimension, weight]) => (
              <div key={dimension} className="flex items-baseline justify-between gap-2">
                <dt className="truncate text-xs text-ink-soft">{DIMENSION_LABELS[dimension]}</dt>
                <dd className="text-xs font-medium tabular-nums">
                  {Math.round(weight * 100)}%
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <OnboardingForm profile={profile} />
    </main>
  );
}
