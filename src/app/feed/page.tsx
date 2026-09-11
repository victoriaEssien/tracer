import { redirect } from "next/navigation";

import { currentUserId } from "@/auth";
import { FeedConsole } from "@/components/feed/feed-console";
import { PageHeader } from "@/components/ui";
import { getUserProfile } from "@/server/db/queries";
import { getFeed } from "@/server/opportunities";

export const metadata = { title: "Feed" };
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
  const worthTaking = opportunities.filter((item) => item.verdict === "recommended").length;

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Your queue"
        lede={
          opportunities.length === 0
            ? "Issues scored against what you know and the time you have."
            : `${opportunities.length} issues scored. ${worthTaking} worth taking. Ranked by fit, not by stars.`
        }
      />
      <FeedConsole opportunities={opportunities} discovering={discovering === "1"} />
    </main>
  );
}
