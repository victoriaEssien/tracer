/**
 * POST /api/jobs/refresh-saved — re-check saved issues for status changes.
 *
 * Runs across every user's saved list, so it is scheduler-only: it needs
 * `CRON_SECRET`. Use `GITHUB_TOKEN` for its budget, since there is no signed-in
 * user to borrow a token from.
 */

import { error, json } from "@/lib/api";
import { refreshSavedOpportunities } from "@/server/jobs/refresh-saved";

export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return error("CRON_SECRET is not configured", 503);
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return error("Not authorised", 401);
  }

  try {
    return json(await refreshSavedOpportunities());
  } catch (caught) {
    console.error("Saved-opportunity refresh failed", caught);
    return error("Refresh failed", 500);
  }
}
