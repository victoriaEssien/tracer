/**
 * Applies committed migrations, as the last step of a production build.
 *
 * Runs only when Vercel says this is the production deployment. Every other
 * build exits without touching anything: a preview deployment must never
 * migrate production, and a build on a laptop is not permission to reshape a
 * database at all. There is no flag to force it, so the only way to migrate
 * production is to deploy to it.
 *
 * `DATABASE_URL` is the production branch in that environment, and nowhere
 * else, which is why nothing here reads a second variable.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const deployment = process.env.VERCEL_ENV;

if (deployment !== "production") {
  console.log(
    deployment
      ? `Skipping migrations: this is a ${deployment} deployment.`
      : "Skipping migrations: not a deployment.",
  );
  process.exit(0);
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set, so there is nothing to migrate against.");
  process.exit(1);
}

// The host, never the string itself: build logs are not a place for credentials.
console.log(`Applying migrations to ${new URL(url).hostname}`);

await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });

console.log("Migrations are up to date.");
