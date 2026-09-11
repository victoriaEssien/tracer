import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth, currentUserId } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Chip, PageHeader, Panel } from "@/components/ui";
import { DIMENSION_LABELS } from "@/config/scoring";
import { getUserProfile } from "@/server/db/queries";
import { getLearnedPreferences } from "@/server/opportunities";
import type { ScoreDimension } from "@/types";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};
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
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Profile"
        lede={`What your queue is scored against: your skills, your time, and what Tracer has learned from the issues you keep. Signed in as ${session?.user?.name ?? session?.user?.email ?? "your GitHub account"}.`}
      />

      <div className="space-y-10">
        <Panel
          title="What Tracer has worked out about you"
          hint={`${learned.eventsConsidered} decisions so far`}
        >
          {learned.observations.length === 0 ? (
            <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
              Nothing yet. Save or hide a handful of issues and Tracer starts shifting how much each
              part of the score counts for you. It says so here rather than doing it quietly.
            </p>
          ) : (
            <ul className="mb-5 space-y-2">
              {learned.observations.map((observation) => (
                <li key={observation} className="flex gap-2.5 text-sm text-ink-soft">
                  <span aria-hidden className="text-ink-faint">
                    &bull;
                  </span>
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          )}

          {learned.favouredTechnologies.length > 0 ? (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {learned.favouredTechnologies.map((technology) => (
                <Chip key={technology} tone="accent">
                  {technology}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs text-ink-faint">Your current weights</p>
            {/* Two columns at most. Four left every label too narrow to read,
                and a truncated dimension name explains nothing. */}
            <dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {weights.map(([dimension, weight]) => (
                <div
                  key={dimension}
                  className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-1.5"
                >
                  <dt className="text-xs text-ink-soft">{DIMENSION_LABELS[dimension]}</dt>
                  <dd className="font-mono text-xs font-medium tabular-nums">
                    {Math.round(weight * 100)}%
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>

        <OnboardingForm profile={profile} />
      </div>
    </main>
  );
}
