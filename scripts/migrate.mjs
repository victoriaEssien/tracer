/**
 * Applies committed migrations to the production database.
 *
 * Runs in exactly two places: the Vercel production build, and a maintainer's
 * terminal via `pnpm db:migrate:prod`. Every other build exits without
 * touching anything, because a build is not permission to reshape a database,
 * and a preview deployment must never migrate production.
 *
 * The two callers read different variables. On Vercel, `DATABASE_URL` is the
 * production branch. On a laptop it is the dev branch, and production lives in
 * `PROD_DATABASE_URL`. Naming the variable per caller means neither can reach
 * the wrong database by default.
 */

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// Present locally, absent on Vercel, where the real environment is already set.
config({ path: ".env.local" });

const manual = process.argv.includes("--manual");
const deployment = process.env.VERCEL_ENV;

if (!manual && deployment !== "production") {
  console.log(
    deployment
      ? `Skipping migrations: this is a ${deployment} deployment.`
      : "Skipping migrations: not a deployment. Use `pnpm db:migrate:prod` to run them by hand.",
  );
  process.exit(0);
}

const variable = manual ? "PROD_DATABASE_URL" : "DATABASE_URL";
const url = process.env[variable];

if (!url) {
  console.error(`${variable} is not set, so there is nothing to migrate against.`);
  process.exit(1);
}

// The host, never the string itself: build logs are not a place for credentials.
console.log(`Applying migrations to ${new URL(url).hostname}`);

await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });

console.log("Migrations are up to date.");
