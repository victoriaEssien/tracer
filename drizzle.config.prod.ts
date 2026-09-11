import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import { config } from "dotenv";

config({ path: ".env.local", override: true });

/**
 * Production migrations, and nothing else.
 *
 * A separate file rather than an environment variable on the command line,
 * because `drizzle.config.ts` loads `.env.local` with `override: true` and
 * would quietly replace a DATABASE_URL set by the caller. A run against the
 * wrong branch that reports success is worse than one that fails.
 *
 * Only ever run `migrate` against this. `push` reshapes the database to match
 * the schema, which includes dropping columns it does not recognise.
 */
const url = process.env.PROD_DATABASE_URL;

if (!url) {
  throw new Error("PROD_DATABASE_URL is not set. Add the production branch URL to .env.local.");
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
