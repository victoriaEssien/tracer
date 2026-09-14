import { describe, expect, it } from "vitest";

import { buildIssue, buildRepository, label } from "./fixtures";
import { estimateScope, extractFilePaths } from "./scope-estimation";

const repo = buildRepository();

/**
 * Long enough to clear the thin-description guard, and deliberately bland: no
 * phrase in here is itself a signal. An earlier version of this ended "rather
 * than a one-liner", and `one-liner` is a SMALL_PATTERN, so every case using it
 * passed for the wrong reason.
 */
const padded = (sentence: string) =>
  `${sentence}. There is a little more context here so that the description
   has some substance to it, and the guard does not fire.`;

describe("estimateScope", () => {
  it("refuses to guess when there is nothing to go on", () => {
    const { scope, estimatedHours, signal } = estimateScope(
      buildIssue({ title: "Broken", body: "This is broken." }),
      repo,
    );

    expect(scope).toBe("unclear");
    // An estimate nobody can stand behind is not reported as one.
    expect(estimatedHours).toBeNull();
    expect(signal.confidence).toBe("low");
    expect(signal.concerns).toContain("Not enough detail to guess how big this is");
  });

  it("reads a contained fix in one named file as small", () => {
    const { scope, estimatedHours, signal } = estimateScope(
      buildIssue({
        title: "Fix the typo in the onboarding copy",
        body:
          "A small fix: the word 'recieve' is misspelled in `src/components/onboarding/form.tsx`, " +
          "and it shows on the first screen everyone sees.",
      }),
      repo,
    );

    expect(scope).toBe("small");
    expect(estimatedHours).toEqual({ min: 1, max: 3 });
    expect(signal.reasons).toContain("It points at a single file");
    expect(signal.confidence).toBe("high");
  });

  it("reads a rewrite spanning the codebase as large", () => {
    const { scope, estimatedHours, signal } = estimateScope(
      buildIssue({
        title: "Refactor the storage layer",
        body:
          "We should refactor the storage layer and migrate every call site across the codebase. " +
          "This is a breaking change and touches all of the modules that read from disk.",
      }),
      repo,
    );

    expect(scope).toBe("large");
    expect(estimatedHours).toEqual({ min: 10, max: 40 });
    expect(signal.concerns).toContain("This spans several parts of the codebase");
  });

  it("counts a short checklist as structure and a long one as several changes", () => {
    const body = (items: number) =>
      [
        "Here is what needs doing, described at some length so the thin-description",
        "guard does not fire and the checklist is what actually moves the estimate.",
        "",
        ...Array.from({ length: items }, (_, index) => `- [ ] Step number ${index + 1}`),
      ].join("\n");

    const short = estimateScope(buildIssue({ body: body(3) }), repo);
    const long = estimateScope(buildIssue({ body: body(8) }), repo);

    expect(short.signal.reasons).toContain("Broken into 3 steps");
    expect(long.signal.concerns).toContain("There is a checklist of 8 items");
  });

  it("treats a hard label as a prior, not as proof", () => {
    const body =
      "The parser mishandles escaped quotes inside a quoted field, described here at " +
      "enough length that the thin-description guard does not fire on its own.";

    const plain = estimateScope(buildIssue({ body }), repo);
    const flagged = estimateScope(buildIssue({ body, labels: [label("architecture")] }), repo);

    expect(flagged.signal.concerns).toContain("Maintainers labelled it complex or architectural");
    // It moves the estimate; it does not decide it.
    expect(flagged.scope === plain.scope || flagged.scope === "large").toBe(true);
  });

  it.each([
    "bump the version of the bundled parser before the next release",
    "this flaky test fails about one run in ten on CI and blocks merges",
    "improve the error message when the config key cannot be resolved",
    "add a changeset so the release notes pick this up",
  ])("reads %j as small", (sentence) => {
    expect(estimateScope(buildIssue({ body: padded(sentence) }), repo).scope).toBe("small");
  });

  it("takes a package split as a reason to stop calling the work small", () => {
    const { scope, signal } = estimateScope(
      buildIssue({ body: padded("we should split the package into a core and a plugins half") }),
      repo,
    );

    // One signal moves the estimate; reaching "large" takes more than one,
    // which is why this asserts the direction rather than the bucket.
    expect(scope).not.toBe("small");
    expect(signal.concerns).toContain("This is restructuring, not a contained change");
  });

  it("does not treat the word update on its own as a small change", () => {
    const { scope } = estimateScope(
      buildIssue({
        body:
          "We need to update how the scheduler decides which worker picks up a job, " +
          "which means revisiting the fairness rules and the backlog ordering.",
      }),
      repo,
    );

    expect(scope).not.toBe("small");
  });

  it("always reports hours as a range, never a single number", () => {
    const { estimatedHours } = estimateScope(
      buildIssue({
        body: "A small fix in `src/lib/format.ts`, where the rounding is off by one.",
      }),
      repo,
    );

    expect(estimatedHours).not.toBeNull();
    expect(estimatedHours!.max).toBeGreaterThan(estimatedHours!.min);
  });
});

describe("extractFilePaths", () => {
  it("finds source paths and ignores version numbers and hosts", () => {
    const found = extractFilePaths(
      "Broken since v1.2.3 — see `src/server/github/client.ts` and docs/scoring.md. " +
        "More at https://example.com/a/b.md",
    );

    expect(found).toContain("src/server/github/client.ts");
    expect(found).toContain("docs/scoring.md");
    expect(found).not.toContain("example.com/a/b.md");
    expect(found.some((path) => path.includes("1.2.3"))).toBe(false);
  });

  it("does not count the same path twice", () => {
    const found = extractFilePaths("`src/a.ts` then src/a.ts again");
    expect(found).toEqual(["src/a.ts"]);
  });
});
