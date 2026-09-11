/**
 * Route handler helpers.
 *
 * Route handlers stay thin (architecture rule 5): authenticate, validate,
 * delegate, serialise. These are the pieces that would otherwise be repeated in
 * every one of them.
 */

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { currentUserId } from "@/auth";

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => error("Sign in with GitHub to use this endpoint", 401);
export const notFound = (what = "Not found") => error(what, 404);

/**
 * Runs `handler` with the signed-in user's id, or returns 401. Rate-limit
 * errors from GitHub are translated into a 503 with a retry hint rather than a
 * 500, because they are expected and temporary.
 */
export async function withUser(
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  try {
    return await handler(userId);
  } catch (caught) {
    if (caught instanceof Error && caught.name === "RateLimitError") {
      return error("GitHub's rate limit is exhausted. Try again shortly.", 503);
    }
    console.error("Route handler failed", caught);
    return error("Something went wrong", 500);
  }
}

/** Parses and validates a JSON body. Returns null and a 400 on failure. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: error("Expected a JSON body", 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}

/** Reads a positive integer query parameter, with a default and a ceiling. */
export function intParam(
  url: URL,
  name: string,
  fallback: number,
  max: number,
): number {
  const raw = url.searchParams.get(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}
