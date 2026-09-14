/**
 * Label vocabulary.
 *
 * Labels are evidence, not proof (scoring.md rule 1). Everything here raises or
 * lowers a prior; nothing here decides a difficulty or a verdict on its own.
 */

import type { ContributionType } from "@/types";

/** Labels maintainers use to mark work as approachable. */
export const BEGINNER_LABELS = [
  "good first issue",
  "good-first-issue",
  "first-timers-only",
  "beginner",
  "beginner friendly",
  "beginner-friendly",
  "easy",
  "starter",
  "low hanging fruit",
  "e-easy",
  "d-easy",
  "difficulty: easy",
  "difficulty: starter",
  "good first bug",
  "easyfix",
  "easy-fix",
  "newcomer",
  // Both spacings, because matching is exact and maintainers write `Level:Starter`.
  "level: starter",
  "level:starter",
];

/** Labels that mean the maintainers want outside help. */
export const HELP_WANTED_LABELS = [
  "help wanted",
  "help-wanted",
  "contributions welcome",
  "contributor friendly",
  "up for grabs",
  "pr welcome",
  "pr-welcome",
];

/** Labels that suggest the work is substantial. */
export const HARD_LABELS = [
  "hard",
  "complex",
  "difficulty: hard",
  "e-hard",
  "epic",
  "architecture",
  "breaking change",
  "breaking-change",
  "rfc",
  "design",
  "proposal",
  "needs design",
];

/** Labels that mean the issue is not actually ready to be picked up. */
export const BLOCKED_LABELS = [
  "blocked",
  "on hold",
  "needs discussion",
  "needs triage",
  "needs more info",
  "needs reproduction",
  "awaiting response",
  "question",
  "wontfix",
  "invalid",
  "duplicate",
  "stale",
  "discussion",
];

/**
 * Labels that say somebody already has this.
 *
 * Matched against a label's separate words as well as the whole string, because
 * this is the one vocabulary that turns up as a suffix on another label:
 * `good first issue (taken)` is an invitation that has already been accepted,
 * and reading it as an open invitation is the expensive mistake.
 */
export const CLAIMED_LABELS = [
  "assigned",
  "in progress",
  "in-progress",
  "wip",
  "claimed",
  "taken",
];

/**
 * Maps a label to the kind of contribution it implies.
 *
 * Matched exactly against the forms in `labelForms`, never by substring: `ui`
 * as a substring matches `build`, and `doc` matches `docker`. Every variant
 * worth catching is therefore spelled out here.
 */
export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string[]> = {
  features: ["feature", "features", "enhancement", "feature request", "new feature", "improvement"],
  "bug-fixes": ["bug", "bugfix", "defect", "fix", "regression", "crash", "error"],
  "ui-ux": ["ui", "ux", "design", "css", "styling", "frontend", "a11y", "accessibility"],
  documentation: [
    "documentation",
    "docs",
    "doc",
    "readme",
    "typo",
    "wording",
    "guide",
    "guides",
    "tutorial",
  ],
  tests: ["test", "tests", "testing", "coverage", "flaky"],
  tooling: [
    "build",
    "ci",
    "cd",
    "tooling",
    "infrastructure",
    "chore",
    "dx",
    "developer experience",
    "dependencies",
    "deps",
    "docker",
    "packaging",
  ],
};

/** Search filters used by the discovery job to find candidate issues. */
export const DISCOVERY_ISSUE_LABELS = [
  "good first issue",
  "help wanted",
  "documentation",
  "bug",
  "enhancement",
];

function has(labels: string[], vocabulary: string[]): boolean {
  return labels.some((label) => vocabulary.includes(label.trim().toLowerCase()));
}

export function hasBeginnerLabel(labels: string[]): boolean {
  return has(labels, BEGINNER_LABELS);
}

export function hasHelpWantedLabel(labels: string[]): boolean {
  return has(labels, HELP_WANTED_LABELS);
}

export function hasHardLabel(labels: string[]): boolean {
  return has(labels, HARD_LABELS);
}

export function hasBlockedLabel(labels: string[]): boolean {
  return has(labels, BLOCKED_LABELS);
}

export function hasClaimedLabel(labels: string[]): boolean {
  const forms = new Set(labels.flatMap(labelForms));
  return CLAIMED_LABELS.some((word) => forms.has(word));
}

/**
 * The forms one label can be matched against.
 *
 * Maintainers scope their labels, and the same meaning arrives as `docs`,
 * `area/docs`, `type: docs` or `A-docs`. Rather than matching a substring —
 * which classifies `build` as UI work, because it contains `ui` — each label is
 * expanded into the whole string plus its separated words, and those are
 * compared exactly.
 */
export function labelForms(label: string): string[] {
  const normalized = label.trim().toLowerCase();
  const forms = new Set<string>();

  if (normalized) forms.add(normalized);

  // `area/build`, `type: bug`, `kind/feature` — the part after the scope.
  for (const separator of ["/", ":"]) {
    const index = normalized.lastIndexOf(separator);
    if (index !== -1) {
      const tail = normalized.slice(index + 1).trim();
      if (tail) forms.add(tail);
    }
  }

  // Individual words, so `type-bug` and `area/build-packaging` still land.
  // `+` and `#` survive the split, because `c++` and `c#` are technologies.
  for (const word of normalized.split(/[^a-z0-9+#]+/)) {
    if (word) forms.add(word);
  }

  return [...forms];
}

/** Which contribution types a set of labels points at. May be empty. */
export function contributionTypesFromLabels(labels: string[]): ContributionType[] {
  const forms = new Set(labels.flatMap(labelForms));
  const types: ContributionType[] = [];
  for (const [type, vocabulary] of Object.entries(CONTRIBUTION_TYPE_LABELS)) {
    if (vocabulary.some((word) => forms.has(word))) types.push(type as ContributionType);
  }
  return types;
}
