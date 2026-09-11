/**
 * POST /api/jobs/discovery — collect and score new candidate issues.
 *
 * Two callers: the signed-in user asking for more (the feed's "find more"
 * button), and a scheduler. A scheduler authenticates with `CRON_SECRET` and
 * must name the user to run for, since discovery is profile-driven.
 */

import { z } from "zod";

import { currentUserId } from "@/auth";
import { error, json, parseBody } from "@/lib/api";
import { runDiscovery } from "@/server/jobs/discovery";

export const maxDuration = 300;

const bodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    maxIssues: z.number().int().min(1).max(100).optional(),
    minStars: z.number().int().min(0).max(100_000).optional(),
  })
  .default({});

export async function POST(request: Request) {
  const parsed = await parseBody(request, bodySchema);
  if ("response" in parsed) return parsed.response;

  const secret = process.env.CRON_SECRET;
  const authorized =
    secret !== undefined && request.headers.get("authorization") === `Bearer ${secret}`;

  const userId = authorized ? parsed.data.userId : await currentUserId();
  if (!userId) {
    return error(
      authorized ? "A scheduled run must name a userId" : "Sign in with GitHub to use this endpoint",
      authorized ? 400 : 401,
    );
  }

  try {
    const result = await runDiscovery(userId, {
      maxIssues: parsed.data.maxIssues,
      minStars: parsed.data.minStars,
    });
    return json(result);
  } catch (caught) {
    console.error("Discovery run failed", caught);
    return error("Discovery run failed", 500);
  }
}
