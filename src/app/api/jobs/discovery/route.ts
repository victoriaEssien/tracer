/**
 * POST /api/jobs/discovery — collect and score new candidate issues.
 *
 * With `?stream=1` the response is newline-delimited JSON progress events as
 * the run proceeds, rather than one object at the end.
 *
 * Two callers: the signed-in user asking for more (the feed's "find more"
 * button), and a scheduler. A scheduler authenticates with `CRON_SECRET` and
 * must name the user to run for, since discovery is profile-driven.
 */

import { z } from "zod";

import { currentUserId } from "@/auth";
import { error, json, parseBody } from "@/lib/api";
import { runDiscovery } from "@/server/jobs/discovery";
import type { DiscoveryProgress } from "@/types";

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

  const options = { maxIssues: parsed.data.maxIssues, minStars: parsed.data.minStars };

  // A run takes a minute or two. Streaming lets the browser show what is
  // happening instead of holding a spinner over an opaque request.
  if (new URL(request.url).searchParams.get("stream") === "1") {
    return streamDiscovery(userId, options);
  }

  try {
    return json(await runDiscovery(userId, options));
  } catch (caught) {
    console.error("Discovery run failed", caught);
    return error("Discovery run failed", 500);
  }
}

function streamDiscovery(userId: string, options: { maxIssues?: number; minStars?: number }) {
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (progress: DiscoveryProgress) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(progress)}\n`));
      };

      try {
        const result = await runDiscovery(userId, options, send);
        send({ phase: "done", scored: result.issuesAnalyzed, rateLimited: result.rateLimited });
      } catch (caught) {
        console.error("Discovery run failed", caught);
        send({ phase: "error", message: "The search stopped early. Anything found was kept." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Proxies that buffer would defeat the point of streaming at all.
      "X-Accel-Buffering": "no",
    },
  });
}
