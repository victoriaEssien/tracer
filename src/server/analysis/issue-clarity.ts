/**
 * Issue clarity.
 *
 * Does the issue say enough for someone who has never seen the codebase to
 * know what "done" looks like? The reasons matter as much as the rating: "low
 * clarity" on its own is not useful to a contributor (spec section 7.2).
 */

import { clamp } from "@/lib/utils";
import type { Clarity, CollectedIssue, Signal } from "@/types";

const MAINTAINER_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

const REPRODUCTION_PATTERNS = [
  /\bsteps? to reproduce\b/i,
  /\breproduction steps\b/i,
  /\bto reproduce\b/i,
  /\breprod(?:uction)? (?:repo|case|link)\b/i,
  /^\s*\d+\.\s+.+\n\s*\d+\.\s+/m,
];

const EXPECTED_BEHAVIOUR_PATTERNS = [
  /\bexpected (?:behaviou?r|result|output)\b/i,
  /\bactual (?:behaviou?r|result|output)\b/i,
  /\bshould (?:be|show|return|display|happen)\b/i,
  /\binstead,? it\b/i,
];

const ACCEPTANCE_PATTERNS = [
  /\bacceptance criteria\b/i,
  /\bdefinition of done\b/i,
  /\brequirements?\b:/i,
  /\btasks?\b:/i,
  /^\s*-\s*\[[ x]\]\s+/m,
];

const ENVIRONMENT_PATTERNS = [
  /\bversion\b\s*:/i,
  /\benvironment\b\s*:/i,
  /\bos\b\s*:/i,
  /\bbrowser\b\s*:/i,
  /\bnode(?:\.js)? version\b/i,
];

const VAGUE_PATTERNS = [
  /^\s*(?:it |this )?(?:does(?:n't| not) work|is broken|fails)\.?\s*$/i,
  /\bplease (?:fix|add|implement)\b/i,
];

export function analyzeIssueClarity(issue: CollectedIssue): {
  clarity: Clarity;
  signal: Signal;
} {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const body = (issue.body ?? "").trim();
  const text = [body, ...issue.comments.map((comment) => comment.body)].join("\n\n");

  if (body.length === 0) {
    return {
      clarity: "low",
      signal: {
        score: 0.08,
        confidence: "high",
        reasons: [],
        concerns: ["A title and nothing else"],
      },
    };
  }

  let score = 0;

  // Length is a weak proxy, so it is capped early and never dominates.
  const lengthScore = body.length < 80 ? 0.1 : body.length < 250 ? 0.4 : body.length < 3000 ? 1 : 0.8;
  score += lengthScore * 0.2;

  if (body.length < 120) {
    concerns.push("The description is two sentences");
  }

  const hasReproduction = REPRODUCTION_PATTERNS.some((pattern) => pattern.test(body));
  if (hasReproduction) {
    score += 0.18;
    reasons.push("It gives steps to reproduce");
  }

  const hasExpected = EXPECTED_BEHAVIOUR_PATTERNS.some((pattern) => pattern.test(body));
  if (hasExpected) {
    score += 0.16;
    reasons.push("It says what should happen instead");
  }

  const hasAcceptance = ACCEPTANCE_PATTERNS.some((pattern) => pattern.test(body));
  if (hasAcceptance) {
    score += 0.16;
    reasons.push("It lists what counts as done");
  }

  const hasCode = /```/.test(body) || /`[^`\n]{3,}`/.test(body);
  if (hasCode) {
    score += 0.1;
    reasons.push("It includes code or output, not just prose");
  }

  const hasFileReference = /`?[\w./-]+\/[\w.-]+\.[a-z]{1,5}`?/.test(body);
  if (hasFileReference) {
    score += 0.08;
    reasons.push("It points at specific files");
  }

  if (ENVIRONMENT_PATTERNS.some((pattern) => pattern.test(body))) {
    score += 0.04;
  }

  const hasImage = /!\[[^\]]*\]\(/.test(body) || /<img\b/i.test(body);
  if (hasImage) {
    score += 0.04;
    reasons.push("There is a screenshot or recording");
  }

  // Maintainer follow-up can rescue a thin description.
  const maintainerDetail = issue.comments.filter(
    (comment) =>
      MAINTAINER_ASSOCIATIONS.has(comment.authorAssociation ?? "") && comment.body.length > 120,
  );
  if (maintainerDetail.length > 0) {
    score += 0.12;
    reasons.push("A maintainer filled in the gaps in the comments");
  }

  // Unresolved questions cut the other way.
  const openQuestions = /\b(?:what do you think|thoughts\?|not sure (?:how|whether|if)|we need to decide|open question)\b/i;
  if (openQuestions.test(text)) {
    score -= 0.12;
    concerns.push("The approach is still being argued about");
  }

  if (VAGUE_PATTERNS.some((pattern) => pattern.test(body))) {
    score -= 0.1;
    concerns.push("It describes the problem but not the fix");
  }

  if (!hasAcceptance && !hasExpected) {
    concerns.push("Nobody has said what finished looks like");
  }

  const finalScore = clamp(score);
  const clarity: Clarity = finalScore >= 0.7 ? "high" : finalScore >= 0.4 ? "medium" : "low";

  return {
    clarity,
    signal: {
      score: finalScore,
      confidence: body.length > 200 ? "high" : "medium",
      reasons,
      concerns,
    },
  };
}
