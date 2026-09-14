import { describe, expect, it } from "vitest";

import { describeProgress } from "./discovery-progress";

describe("describeProgress", () => {
  it("does not invent a total before the server has sent one", () => {
    const seeded = describeProgress({ phase: "searching", queriesRun: 0, candidates: 0 });

    expect(seeded.detail).toBe("0 candidates so far");
    expect(seeded.detail).not.toMatch(/\bof\b/);
  });

  it("reports the total once the server has sent it", () => {
    const reported = describeProgress({
      phase: "searching",
      queriesRun: 2,
      queriesTotal: 5,
      candidates: 14,
    });

    expect(reported.detail).toBe("14 candidates from 2 of 5 searches");
  });

  it("never moves the bar backwards when the real total arrives", () => {
    const seeded = describeProgress({ phase: "searching", queriesRun: 0, candidates: 0 });
    // The narrowest case: a profile that produces a single search.
    const first = describeProgress({
      phase: "searching",
      queriesRun: 0,
      queriesTotal: 1,
      candidates: 0,
    });

    expect(first.percent).toBeGreaterThanOrEqual(seeded.percent);
  });

  it("survives a total of zero without dividing by it", () => {
    const none = describeProgress({
      phase: "searching",
      queriesRun: 0,
      queriesTotal: 0,
      candidates: 0,
    });

    expect(Number.isFinite(none.percent)).toBe(true);
  });

  it("keeps the bar moving forward across the phases", () => {
    const searching = describeProgress({
      phase: "searching",
      queriesRun: 5,
      queriesTotal: 5,
      candidates: 30,
    });
    const collecting = describeProgress({
      phase: "collecting",
      repositories: 4,
      issues: 10,
      issuesTarget: 30,
    });
    const scoring = describeProgress({ phase: "scoring", analyzed: 1, total: 30 });
    const done = describeProgress({ phase: "done", scored: 12, rateLimited: false });

    expect(searching.percent).toBeLessThanOrEqual(collecting.percent);
    expect(collecting.percent).toBeLessThanOrEqual(scoring.percent);
    expect(scoring.percent).toBeLessThan(done.percent);
    expect(done.percent).toBe(100);
  });

  it("says nothing was found rather than reporting zero", () => {
    const empty = describeProgress({ phase: "done", scored: 0, rateLimited: false });

    expect(empty.label).toBe("Nothing new found");
  });

  it("flags a run that stopped early on the rate limit as partial", () => {
    expect(describeProgress({ phase: "done", scored: 3, rateLimited: true }).partial).toBe(true);
  });
});
