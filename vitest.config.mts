import { defineConfig } from "vitest/config";

/**
 * The analysis and recommendation layers are pure functions over collected
 * data — no network, no database — so they need no environment beyond node.
 * Anything that does need a browser or a database is not covered here yet.
 */
export default defineConfig({
  // Resolves the `@/*` alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
