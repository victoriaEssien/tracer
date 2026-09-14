import { describe, expect, it } from "vitest";

import {
  FRAMEWORKS,
  LANGUAGES,
  TOOLS,
  normalizeTechnology,
  technologiesFromRepository,
} from "./skills";

describe("normalizeTechnology", () => {
  it.each([
    ["js", "JavaScript"],
    ["JavaScript", "JavaScript"],
    ["golang", "Go"],
    ["nodejs", "Node.js"],
    ["node-js", "Node.js"],
    ["Ruby on Rails", "Rails"],
  ])("folds %j onto %j", (input, expected) => {
    expect(normalizeTechnology(input)).toBe(expected);
  });

  it.each([
    ["zig", "Zig"],
    ["clj", "Clojure"],
    ["clojurescript", "Clojure"],
    ["hs", "Haskell"],
    ["solid-js", "SolidJS"],
    ["solidjs", "SolidJS"],
    ["remix-run", "Remix"],
    ["gin-gonic", "Gin"],
    ["turbo", "Turborepo"],
    ["astro", "Astro"],
    ["bun", "Bun"],
  ])("folds %j onto %j", (input, expected) => {
    expect(normalizeTechnology(input)).toBe(expected);
  });

  it("keeps a technology it has never heard of rather than dropping it", () => {
    // Someone contributing to a Zig compiler should not be blocked by a list.
    expect(normalizeTechnology("Ada")).toBe("Ada");
    expect(normalizeTechnology("  Wolfram  ")).toBe("Wolfram");
  });

  it("treats sveltekit as svelte, so the catalog does not offer both", () => {
    expect(normalizeTechnology("sveltekit")).toBe("Svelte");
    expect([...FRAMEWORKS]).not.toContain("SvelteKit");
  });
});

describe("the catalog", () => {
  it("offers every entry under a name that normalises to itself", () => {
    // A chip that renames itself the moment it is picked would match nothing.
    for (const entry of [...LANGUAGES, ...FRAMEWORKS, ...TOOLS]) {
      expect(normalizeTechnology(entry)).toBe(entry);
    }
  });

  it("lists nothing twice", () => {
    const all = [...LANGUAGES, ...FRAMEWORKS, ...TOOLS].map((entry) => entry.toLowerCase());
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("technologiesFromRepository", () => {
  it("reads the primary language, the language stats and the topics", () => {
    const found = technologiesFromRepository({
      primaryLanguage: "TypeScript",
      languages: { TypeScript: 900_000, CSS: 20_000 },
      topics: ["react", "nodejs"],
    });

    expect(found).toContain("TypeScript");
    expect(found).toContain("React");
    expect(found).toContain("Node.js");
  });

  it("ignores topics that are not technologies", () => {
    const found = technologiesFromRepository({
      primaryLanguage: "Go",
      languages: { Go: 400_000 },
      topics: ["hacktoberfest", "awesome-list", "gin-gonic"],
    });

    expect(found).toContain("Go");
    expect(found).toContain("Gin");
    expect(found).not.toContain("hacktoberfest");
    expect(found).not.toContain("awesome-list");
  });
});
