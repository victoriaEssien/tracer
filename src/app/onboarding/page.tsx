import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getUserProfile } from "@/server/db/queries";

export const metadata: Metadata = {
  title: "Set up",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const profile = await getUserProfile(userId);
  if (profile?.onboardedAt) redirect("/profile");

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Tell Tracer what you know</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        Every recommendation is scored against this. It takes a minute, and you can change it
        whenever you like.
      </p>

      <div className="mt-10">
        <OnboardingForm profile={profile} />
      </div>
    </main>
  );
}
