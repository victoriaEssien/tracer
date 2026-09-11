import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Next loads .env.local automatically; drizzle-kit runs outside Next, so it has
// to be told.
import { config } from "dotenv";
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
