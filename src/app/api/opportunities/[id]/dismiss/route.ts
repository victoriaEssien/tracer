/**
 * POST /api/opportunities/:id/dismiss — hide an opportunity from the feed.
 *
 * Dismissals are kept rather than deleted: they are the negative half of the
 * personal learning loop (spec section 14).
 */

import { json, withUser } from "@/lib/api";
import { dismiss } from "@/server/opportunities";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (userId) => {
    const { id } = await params;
    await dismiss(userId, id);
    return json({ dismissed: true });
  });
}
