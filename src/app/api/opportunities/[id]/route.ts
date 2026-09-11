/**
 * GET /api/opportunities/:id — one opportunity, with the full reasoning.
 *
 * `?ai=1` additionally asks the optional AI layer for a summary, a plan and
 * things to verify. The response is identical without it, minus the `ai` block.
 */

import { json, notFound, withUser } from "@/lib/api";
import { addAiInsights, getOpportunity } from "@/server/opportunities";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (userId) => {
    const { id } = await params;
    const detail = await getOpportunity(userId, id);
    if (!detail) return notFound("No such opportunity");

    const wantsAi = new URL(request.url).searchParams.get("ai") === "1";
    if (wantsAi && !detail.recommendation.ai) {
      detail.recommendation.ai = await addAiInsights(userId, id);
    }

    return json({
      opportunity: {
        id: detail.issue.id,
        issue: {
          number: detail.issue.number,
          title: detail.issue.title,
          body: detail.issue.body,
          url: detail.issue.htmlUrl,
          state: detail.issue.state,
          labels: detail.issue.labels,
          assignees: detail.issue.assignees,
          commentCount: detail.issue.commentCount,
          createdAt: detail.issue.createdAt,
          updatedAt: detail.issue.updatedAt,
        },
        repository: {
          fullName: detail.repository.fullName,
          description: detail.repository.description,
          url: detail.repository.htmlUrl,
          stars: detail.repository.stars,
          forks: detail.repository.forks,
          openIssues: detail.repository.openIssues,
          license: detail.repository.license,
          primaryLanguage: detail.repository.primaryLanguage,
          topics: detail.repository.topics,
          activity: detail.repository.activity,
        },
        recommendation: detail.recommendation,
        saved: detail.saved,
        stale: detail.stale,
      },
    });
  });
}
