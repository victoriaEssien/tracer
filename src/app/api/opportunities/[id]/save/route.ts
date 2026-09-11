/**
 * POST   /api/opportunities/:id/save — bookmark an opportunity
 * DELETE /api/opportunities/:id/save — remove the bookmark
 *
 * Both record an event for the personal learning loop.
 */

import { error, json, withUser } from "@/lib/api";
import { save, unsave } from "@/server/opportunities";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (userId) => {
    const { id } = await params;
    try {
      await save(userId, id);
    } catch {
      return error("That opportunity has not been analysed yet", 409);
    }
    return json({ saved: true });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (userId) => {
    const { id } = await params;
    await unsave(userId, id);
    return json({ saved: false });
  });
}
