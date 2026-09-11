import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getUserProfile } from "@/server/db/queries";

export const metadata = { title: "Set up · Tracer" };

export default async function OnboardingPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const profile = await getUserProfile(userId);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Tell Tracer what you know</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        This is what every recommendation is scored against. It takes a minute, and you can change
        it whenever you like — the feed re-scores itself when you do.
      </p>

      <div className="mt-8">
        <OnboardingForm profile={profile} />
      </div>
    </main>
  );
}
