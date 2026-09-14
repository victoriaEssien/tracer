import { describe, expect, it } from "vitest";

import {
  contributionTypesFromLabels,
  hasBeginnerLabel,
  hasHelpWantedLabel,
  labelForms,
} from "./labels";

describe("contributionTypesFromLabels", () => {
  it("does not classify build work as UI work", () => {
    // `build` contains `ui`, which is why this has to match exactly.
    expect(contributionTypesFromLabels(["build"])).toEqual(["tooling"]);
  });

  it("does not classify docker as documentation", () => {
    // `docker` contains `doc`.
    expect(contributionTypesFromLabels(["docker"])).toEqual(["tooling"]);
  });

  it.each([
    "Builders",
    "Quick Review",
    "Nuisance Columns",
    "Name/Position Ambiguity",
    "bracket-pair-guides",
    "A-rustc-dev-guide",
    "A-compiler-builtins",
  ])("does not read %j as UI work", (name) => {
    expect(contributionTypesFromLabels([name])).not.toContain("ui-ux");
  });

  it("still reads a genuine UI label as UI work", () => {
    expect(contributionTypesFromLabels(["ui"])).toEqual(["ui-ux"]);
    expect(contributionTypesFromLabels(["area:UI"])).toEqual(["ui-ux"]);
    expect(contributionTypesFromLabels(["accessibility"])).toEqual(["ui-ux"]);
  });

  it("sees through the scope prefixes maintainers actually use", () => {
    expect(contributionTypesFromLabels(["area/build"])).toEqual(["tooling"]);
    expect(contributionTypesFromLabels(["type: bug"])).toEqual(["bug-fixes"]);
    expect(contributionTypesFromLabels(["A-docs"])).toEqual(["documentation"]);
    expect(contributionTypesFromLabels(["kind/feature"])).toEqual(["features"]);
    expect(contributionTypesFromLabels(["area/build-packaging"])).toEqual(["tooling"]);
  });

  it("returns every type a set of labels points at", () => {
    expect(contributionTypesFromLabels(["bug", "docs"]).sort()).toEqual(["bug-fixes", "documentation"]);
  });

  it("returns nothing for a label that means nothing to us", () => {
    expect(contributionTypesFromLabels(["needs triage", "P2", "stale"])).toEqual([]);
  });

  it("does not read the beginner labels as a contribution type", () => {
    expect(contributionTypesFromLabels(["good first issue", "help wanted"])).toEqual([]);
  });
});

describe("labelForms", () => {
  it("keeps the whole label, the scoped tail, and the separate words", () => {
    expect(labelForms("area/build-packaging").sort()).toEqual(
      ["area", "area/build-packaging", "build", "build-packaging", "packaging"].sort(),
    );
  });

  it("lowercases and trims", () => {
    expect(labelForms("  Good First Issue ")).toContain("good first issue");
  });

  it("keeps the characters that make a technology name", () => {
    expect(labelForms("lang/c++")).toContain("c++");
    expect(labelForms("lang/c#")).toContain("c#");
  });

  it("has no empty forms", () => {
    expect(labelForms("type: / -")).not.toContain("");
  });
});

describe("the beginner and help-wanted vocabularies", () => {
  it.each([
    "good first issue",
    "Good First Issue",
    "good-first-issue",
    "first-timers-only",
    "beginner friendly",
    "E-easy",
  ])("recognises %j as a beginner label", (name) => {
    expect(hasBeginnerLabel([name])).toBe(true);
  });

  it.each(["help wanted", "Help Wanted", "up for grabs", "contributions welcome"])(
    "recognises %j as help wanted",
    (name) => {
      expect(hasHelpWantedLabel([name])).toBe(true);
    },
  );

  it("does not treat an ordinary label as an invitation", () => {
    expect(hasBeginnerLabel(["bug"])).toBe(false);
    expect(hasHelpWantedLabel(["enhancement"])).toBe(false);
  });

  it("does not read a beginner label that says it is taken as available", () => {
    expect(hasBeginnerLabel(["good first issue (taken)"])).toBe(false);
  });
});
