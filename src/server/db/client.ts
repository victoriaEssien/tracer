/**
 * Database client.
 *
 * Neon over HTTP, which keeps route handlers cheap: no pool to warm up, no
 * connection to leak in a serverless environment.
 *
 * The client is built eagerly, because the Auth.js Drizzle adapter inspects it
 * to work out which dialect it is talking to — a lazy wrapper is not something
 * it can identify. A build with no `DATABASE_URL` still succeeds: the client is
 * constructed against a placeholder whose only behaviour is to explain itself
 * the first time anything tries to run a query.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

const PLACEHOLDER_URL =
  "postgresql://unset:unset@database-url-is-not-set.neon.tech/unset";

declare global {
  var __tracerDb: Database | undefined;
}

function create(): Database {
  const url = process.env.DATABASE_URL;

  if (!url) {
    // Nothing legitimate can query in this state, so failing loudly on the
    // first attempt beats a DNS error from a placeholder hostname.
    neonConfig.fetchFunction = () => {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Neon database.",
      );
    };
  }

  return drizzle(neon(url ?? PLACEHOLDER_URL), { schema });
}

// Reused across hot reloads in development, which would otherwise build a new
// client on every edit.
export const db: Database = globalThis.__tracerDb ?? create();

if (process.env.NODE_ENV !== "production") {
  globalThis.__tracerDb = db;
}

export { schema };
