/**
 * GET /api/issues/:owner/:repo/:issue — analyse one issue on demand.
 *
 * This is the "I found something myself, is it worth my time?" path: it
 * collects the issue from GitHub, scores it against the caller's profile,
 * stores it, and returns the same recommendation shape the feed uses.
 *
 * `?ai=1` also asks the optional AI layer for its read.
 */

import { error, json, notFound, withUser } from "@/lib/api";
import { getUserProfile } from "@/server/db/queries";
import { analyzeFromGitHub } from "@/server/opportunities";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string; issue: string }> },
) {
  return withUser(async (userId) => {
    const { owner, repo, issue } = await params;

    const issueNumber = Number.parseInt(issue, 10);
    if (!Number.isFinite(issueNumber) || issueNumber <= 0) {
      return error("Issue must be a number", 400);
    }

    const profile = await getUserProfile(userId);
    if (!profile?.onboardedAt) {
      return error("Complete onboarding first so there is something to score against", 409);
    }

    const result = await analyzeFromGitHub({
      userId,
      owner,
      repo,
      issueNumber,
      withAi: new URL(request.url).searchParams.get("ai") === "1",
    });

    if (!result) return notFound("That issue could not be found on GitHub");

    return json({ id: result.issueId, recommendation: result.recommendation });
  });
}
