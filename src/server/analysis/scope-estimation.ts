/**
 * Scope estimation.
 *
 * How much work does this look like? An estimate, never a promise — the output
 * is a bucket plus an hours *range*, and "unclear" is a first-class answer
 * (spec section 7.3).
 */

import { contributionTypesFromLabels, hasBeginnerLabel, hasHardLabel } from "@/config/labels";
import type { CollectedIssue, CollectedRepository, HoursEstimate, Scope, Signal } from "@/types";

/** Words that describe work that touches a lot of the codebase. */
const LARGE_PATTERNS = [
  /\brefactor(?:ing)?\b/i,
  /\brewrite\b/i,
  /\bredesign\b/i,
  /\bmigrat(?:e|ion)\b/i,
  /\barchitect(?:ure|ural)\b/i,
  /\bacross the (?:codebase|project|app)\b/i,
  /\ball (?:of the )?(?:components|pages|endpoints|modules)\b/i,
  /\bbreaking change\b/i,
  /\bnew subsystem\b/i,
  /\bend[- ]to[- ]end\b/i,
];

/** Words that describe contained work. */
const SMALL_PATTERNS = [
  /\btypo\b/i,
  /\bwording\b/i,
  /\brename\b/i,
  /\badd a (?:test|link|note|flag|log)\b/i,
  /\bone[- ]lin(?:e|er)\b/i,
  /\bsmall (?:fix|change|tweak)\b/i,
  /\bupdate the (?:docs|readme|documentation)\b/i,
  /\bmissing (?:import|semicolon|type|doc)\b/i,
];

/** Rough hour ranges per scope. Wide on purpose. */
const SCOPE_HOURS: Record<Exclude<Scope, "unclear">, HoursEstimate> = {
  small: { min: 1, max: 3 },
  medium: { min: 3, max: 10 },
  large: { min: 10, max: 40 },
};

export function estimateScope(
  issue: CollectedIssue,
  repo: CollectedRepository,
): { scope: Scope; estimatedHours: HoursEstimate | null; signal: Signal } {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const body = issue.body ?? "";
  const text = `${issue.title}\n${body}`;
  const labels = issue.labels.map((label) => label.name);
  const contributionTypes = contributionTypesFromLabels(labels);

  // Start neutral and let the signals move it. 0 is small, 1 is large.
  let size = 0.45;

  const largeHits = LARGE_PATTERNS.filter((pattern) => pattern.test(text)).length;
  if (largeHits > 0) {
    size += 0.15 * Math.min(largeHits, 3);
    concerns.push(
      largeHits > 1
        ? "This spans several parts of the codebase"
        : "This is restructuring, not a contained change",
    );
  }

  const smallHits = SMALL_PATTERNS.filter((pattern) => pattern.test(text)).length;
  if (smallHits > 0) {
    size -= 0.2 * Math.min(smallHits, 2);
    reasons.push("The change is contained");
  }

  // A long checklist is usually several changes wearing one issue as a coat.
  const checklistItems = (body.match(/^\s*-\s*\[[ x]\]/gm) ?? []).length;
  if (checklistItems >= 6) {
    size += 0.2;
    concerns.push(`There is a checklist of ${checklistItems} items`);
  } else if (checklistItems >= 2 && checklistItems <= 5) {
    reasons.push(`Broken into ${checklistItems} steps`);
  }

  // Distinct file paths named in the issue is the strongest observable signal.
  const mentionedFiles = extractFilePaths(text);
  if (mentionedFiles.length === 1) {
    size -= 0.15;
    reasons.push("It points at a single file");
  } else if (mentionedFiles.length >= 2 && mentionedFiles.length <= 4) {
    size -= 0.05;
    reasons.push(`The code looks contained to ${mentionedFiles.length} files`);
  } else if (mentionedFiles.length > 6) {
    size += 0.1;
    concerns.push(`It touches ${mentionedFiles.length} different files`);
  }

  if (contributionTypes.includes("documentation")) {
    size -= 0.2;
    reasons.push("Documentation changes stay contained");
  }
  if (contributionTypes.includes("tests")) {
    size -= 0.1;
  }
  if (hasBeginnerLabel(labels)) {
    // A prior, not proof (scoring.md rule 1).
    size -= 0.1;
  }
  if (hasHardLabel(labels)) {
    size += 0.15;
    concerns.push("Maintainers labelled it complex or architectural");
  }

  // Big codebases make any change take longer to find your way around.
  const repoBytes = Object.values(repo.languages).reduce((sum, bytes) => sum + bytes, 0);
  if (repoBytes > 20_000_000) {
    size += 0.08;
    concerns.push("The repository is big, so finding your way takes time");
  }

  const discussionIsDesign = /\b(?:proposal|rfc|design doc|we should decide|two approaches)\b/i.test(
    `${body}\n${issue.comments.map((comment) => comment.body).join("\n")}`,
  );
  if (discussionIsDesign) {
    size += 0.12;
    concerns.push("The approach is still under discussion");
  }

  // Not enough to say anything honest.
  const thinDescription = body.trim().length < 120 && mentionedFiles.length === 0;
  if (thinDescription && checklistItems === 0 && largeHits === 0 && smallHits === 0) {
    return {
      scope: "unclear",
      estimatedHours: null,
      signal: {
        score: 0.4,
        confidence: "low",
        reasons: [],
        concerns: ["Not enough detail to guess how big this is"],
      },
    };
  }

  const scope: Scope = size <= 0.32 ? "small" : size <= 0.62 ? "medium" : "large";

  return {
    scope,
    estimatedHours: SCOPE_HOURS[scope],
    signal: {
      // Scope feeds difficulty fit rather than scoring on its own; the score
      // here expresses "is this a tractable size at all".
      score: scope === "small" ? 0.9 : scope === "medium" ? 0.65 : 0.3,
      confidence: thinDescription ? "low" : mentionedFiles.length > 0 ? "high" : "medium",
      reasons,
      concerns,
    },
  };
}

/**
 * Pulls plausible file paths out of issue text. Extensions are restricted to
 * source-like ones so that `example.com` and `v1.2.3` do not become "files".
 */
export function extractFilePaths(text: string): string[] {
  const pattern =
    /(?:^|[\s`("'])((?:[\w.-]+\/)+[\w.-]+\.(?:tsx?|jsx?|mjs|cjs|py|go|rs|java|kt|rb|php|ex|swift|c|h|cpp|cs|scala|dart|sh|sql|css|scss|html|md|ya?ml|toml|json))/g;
  const found = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const path = match[1];
    // URLs are references, not files to edit.
    if (path.includes("://") || path.startsWith("http")) continue;
    found.add(path);
  }
  return [...found];
}
