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

/**
 * Headings a GitHub issue *form* produces, and what each one tells us.
 *
 * A form (`.github/ISSUE_TEMPLATE/*.yml`) renders a fixed set of headings, so a
 * heading is a stronger signal than a phrase in prose: it means the field was
 * actually asked for. It is only evidence that the question was *answered* if
 * there is something underneath it.
 */
const SECTION_HEADINGS: { field: FormField; pattern: RegExp }[] = [
  { field: "reproduction", pattern: /\b(?:steps?|how) to reproduce\b|\breproduction\b/i },
  { field: "expected", pattern: /\bexpected\b|\bactual\b|\bcurrent behaviou?r\b/i },
  {
    field: "acceptance",
    pattern: /\bacceptance criteria\b|\bdefinition of done\b|\btasks?\b|\brequirements?\b/i,
  },
  { field: "environment", pattern: /\benvironment\b|\bversions?\b|\bsystem info\b/i },
];

type FormField = "reproduction" | "expected" | "acceptance" | "environment";

/** What GitHub writes under a form field somebody skipped. */
const NO_ANSWER = /^(?:_no response_|n\/?a|none|-{1,3}|todo)$/i;

const HEADING_LINE = /^\s{0,3}#{1,6}\s+(.+?)\s*$/;

/**
 * The form fields that were both asked for and answered, and the ones left
 * blank. A heading with nothing under it reads as present to a prose match,
 * which is exactly backwards: the maintainer asked, and nobody replied.
 */
export function formSections(body: string): { answered: Set<FormField>; blank: FormField[] } {
  const answered = new Set<FormField>();
  const blank: FormField[] = [];

  let field: FormField | null = null;
  let content: string[] = [];

  const close = () => {
    if (!field) return;
    const text = content.join("\n").trim();
    if (text.length > 0 && !NO_ANSWER.test(text)) answered.add(field);
    else if (!blank.includes(field)) blank.push(field);
  };

  for (const line of body.split("\n")) {
    const heading = HEADING_LINE.exec(line);
    if (!heading) {
      if (field) content.push(line);
      continue;
    }

    close();
    const title = heading[1];
    field = SECTION_HEADINGS.find((entry) => entry.pattern.test(title))?.field ?? null;
    content = [];
  }
  close();

  return { answered, blank: blank.filter((item) => !answered.has(item)) };
}

/** The body with its heading lines removed, so prose matching cannot read one. */
function withoutHeadings(body: string): string {
  return body
    .split("\n")
    .filter((line) => !HEADING_LINE.test(line))
    .join("\n");
}

const FIELD_NAMES: Record<FormField, string> = {
  reproduction: "steps to reproduce",
  expected: "the expected behaviour",
  acceptance: "what counts as done",
  environment: "the environment",
};

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

  const { answered, blank } = formSections(body);
  // Prose is the fallback for an issue filed without a template. It reads the
  // body with headings stripped, so `### Steps to reproduce` with nothing under
  // it cannot be mistaken for an answer.
  const prose = withoutHeadings(body);

  let score = 0;

  // Length is a weak proxy, so it is capped early and never dominates.
  const lengthScore = body.length < 80 ? 0.1 : body.length < 250 ? 0.4 : body.length < 3000 ? 1 : 0.8;
  score += lengthScore * 0.2;

  if (body.length < 120) {
    concerns.push("The description is two sentences");
  }

  const hasReproduction =
    answered.has("reproduction") || REPRODUCTION_PATTERNS.some((pattern) => pattern.test(prose));
  if (hasReproduction) {
    score += 0.18;
    reasons.push("It gives steps to reproduce");
  }

  const hasExpected =
    answered.has("expected") || EXPECTED_BEHAVIOUR_PATTERNS.some((pattern) => pattern.test(prose));
  if (hasExpected) {
    score += 0.16;
    reasons.push("It says what should happen instead");
  }

  const hasAcceptance =
    answered.has("acceptance") || ACCEPTANCE_PATTERNS.some((pattern) => pattern.test(prose));
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

  if (answered.has("environment") || ENVIRONMENT_PATTERNS.some((pattern) => pattern.test(prose))) {
    score += 0.04;
  }

  // Saying which field went unanswered is more use than a lower number.
  if (blank.length > 0) {
    score -= 0.06;
    concerns.push(
      blank.length === 1
        ? `The template asked for ${FIELD_NAMES[blank[0]]} and got no answer`
        : `${blank.length} sections of the template were left blank`,
    );
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
