/**
 * Environment access.
 *
 * Validated lazily rather than at import time: `next build` should not need a
 * database URL, and the AI layer is optional by design (spec section 16).
 */

import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  GITHUB_TOKEN: z.string().optional(),
  AI_PROVIDER: z.enum(["openai", "none"]).default("none"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Throws if anything required is missing. Call from server code only. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Invalid environment configuration: ${missing}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** True when the optional AI layer is configured. The product works without it. */
export function isAiEnabled(): boolean {
  return process.env.AI_PROVIDER === "openai" && Boolean(process.env.OPENAI_API_KEY);
}

/** A token for unauthenticated background collection, if one was provided. */
export function backgroundGithubToken(): string | null {
  return process.env.GITHUB_TOKEN?.trim() || null;
}
