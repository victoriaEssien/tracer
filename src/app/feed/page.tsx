import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { FeedConsole } from "@/components/feed/feed-console";
import { PageHeader } from "@/components/ui";
import { getUserProfile } from "@/server/db/queries";
import { getFeed } from "@/server/opportunities";

// Nothing behind sign-in belongs in a search result: a crawler following a
// shared link only ever reaches the redirect.
export const metadata: Metadata = {
  title: "Your queue",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ discovering?: string }>;
}) {
  const userId = await currentUserId();
  if (!userId) redirect("/");

  const profile = await getUserProfile(userId);
  if (!profile?.onboardedAt) redirect("/onboarding");

  const { discovering } = await searchParams;
  const opportunities = await getFeed(userId, { limit: 40 });

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Your queue"
        lede="Open-source issues scored against your skills and the time you have, ranked by fit rather than by stars."
      />
      <FeedConsole opportunities={opportunities} discovering={discovering === "1"} />
    </main>
  );
}
