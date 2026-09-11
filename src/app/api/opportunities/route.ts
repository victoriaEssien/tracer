/**
 * GET /api/opportunities — the ranked feed.
 *
 * Query parameters: `limit`, `offset`, `minScore`, `difficulty`.
 */

import { intParam, json, withUser } from "@/lib/api";
import { getFeed } from "@/server/opportunities";

export async function GET(request: Request) {
  return withUser(async (userId) => {
    const url = new URL(request.url);

    const opportunities = await getFeed(userId, {
      limit: intParam(url, "limit", 25, 100),
      offset: intParam(url, "offset", 0, 1000),
      minScore: url.searchParams.has("minScore")
        ? intParam(url, "minScore", 0, 100)
        : undefined,
      difficulty: url.searchParams.get("difficulty") ?? undefined,
    });

    return json({ opportunities, count: opportunities.length });
  });
}
