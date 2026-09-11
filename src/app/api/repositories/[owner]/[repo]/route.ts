/**
 * GET /api/repositories/:owner/:repo — repository overview and health.
 *
 * Serves the stored copy when it is fresh, and collects from GitHub otherwise.
 */

import { COLLECTION_TTL_HOURS } from "@/config/scoring";
import { json, notFound, withUser } from "@/lib/api";
import { analyzeRepositoryHealth } from "@/server/analysis";
import { toCollectedRepository } from "@/server/db/mappers";
import { findRepositoryByFullName, upsertRepository } from "@/server/db/queries";
import { collectRepository, githubForUser } from "@/server/github";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> },
) {
  return withUser(async (userId) => {
    const { owner, repo } = await params;
    const fullName = `${owner}/${repo}`;

    const stored = await findRepositoryByFullName(fullName);
    const fresh =
      stored !== null &&
      Date.now() - stored.collectedAt.getTime() < COLLECTION_TTL_HOURS.repository * 3_600_000;

    const repository =
      stored && fresh
        ? toCollectedRepository(stored)
        : await collectRepository(await githubForUser(userId), owner, repo);

    if (!repository) return notFound("No such repository");
    if (!fresh) await upsertRepository(repository);

    return json({
      repository,
      // The same health signal the feed scores with, so the numbers agree.
      health: analyzeRepositoryHealth(repository),
    });
  });
}
