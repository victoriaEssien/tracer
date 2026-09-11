import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { FeedList } from "@/components/feed/feed-list";
import { getUserProfile } from "@/server/db/queries";
import { getFeed } from "@/server/opportunities";

export const metadata = { title: "Feed · Tracer" };
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

  const recommended = opportunities.filter((item) => item.verdict === "recommended").length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your open-source opportunities</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {opportunities.length === 0
            ? "Ranked by how well each issue fits what you know and the time you have."
            : `${opportunities.length} scored, ${recommended} worth taking. Ranked by fit, not by stars.`}
        </p>
      </div>

      <FeedList opportunities={opportunities} discovering={discovering === "1"} />
    </main>
  );
}
