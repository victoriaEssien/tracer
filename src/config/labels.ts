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
  "difficulty: easy",
  "level: starter",
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

/** Labels that say somebody already has this. */
export const CLAIMED_LABELS = ["assigned", "in progress", "in-progress", "wip", "claimed"];

/** Maps a label to the kind of contribution it implies. */
export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string[]> = {
  features: ["feature", "enhancement", "feature request", "new feature", "improvement"],
  "bug-fixes": ["bug", "defect", "fix", "regression", "crash", "error"],
  "ui-ux": ["ui", "ux", "design", "css", "styling", "frontend", "a11y", "accessibility"],
  documentation: ["documentation", "docs", "doc", "readme", "typo", "wording"],
  tests: ["test", "tests", "testing", "coverage", "flaky"],
  tooling: ["build", "ci", "tooling", "infrastructure", "chore", "dx", "developer experience"],
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
  return has(labels, CLAIMED_LABELS);
}

/** Which contribution types a set of labels points at. May be empty. */
export function contributionTypesFromLabels(labels: string[]): ContributionType[] {
  const normalized = labels.map((label) => label.trim().toLowerCase());
  const types: ContributionType[] = [];
  for (const [type, vocabulary] of Object.entries(CONTRIBUTION_TYPE_LABELS)) {
    const matched = normalized.some((label) =>
      vocabulary.some((word) => label === word || label.includes(word)),
    );
    if (matched) types.push(type as ContributionType);
  }
  return types;
}
