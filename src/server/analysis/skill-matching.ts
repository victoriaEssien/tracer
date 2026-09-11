/**
 * Skill matching.
 *
 * Overlap between what the repository is built with and what the user knows.
 * A partial match that lines up with a learning goal is treated gently, not as
 * a mismatch (scoring.md rule 4) — the learning dimension then rewards it
 * separately.
 */

import {
  interestsFromRepository,
  normalizeTechnology,
  technologiesFromRepository,
} from "@/config/skills";
import { clamp, difference, intersect } from "@/lib/utils";
import type { CollectedIssue, CollectedRepository, Signal, SkillMatchDetail, UserProfile } from "@/types";

export function analyzeSkillMatch(
  repo: CollectedRepository,
  issue: CollectedIssue,
  profile: UserProfile,
): { detail: SkillMatchDetail; technologies: string[]; signal: Signal } {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const technologies = technologiesFromRepository({
    primaryLanguage: repo.primaryLanguage,
    languages: repo.languages,
    topics: repo.topics,
  });

  const experienced = profile.experienced.map(normalizeTechnology);
  const learning = profile.learning.map(normalizeTechnology);

  const matched = intersect(technologies, experienced);
  const learningMatches = intersect(difference(technologies, experienced), learning);
  const unfamiliar = difference(difference(technologies, experienced), learning);

  const repoInterests = interestsFromRepository({
    topics: repo.topics,
    description: repo.description,
  });
  const matchedInterests = intersect(repoInterests, profile.interests);

  const detail: SkillMatchDetail = {
    matched,
    learning: learningMatches,
    unfamiliar,
    matchedInterests,
  };

  // The primary language carries most of the weight: you can pick up a
  // framework mid-contribution far more easily than a language.
  const primary = repo.primaryLanguage ? normalizeTechnology(repo.primaryLanguage) : null;
  const knowsPrimary = primary
    ? experienced.some((skill) => skill.toLowerCase() === primary.toLowerCase())
    : false;
  const learningPrimary = primary
    ? learning.some((skill) => skill.toLowerCase() === primary.toLowerCase())
    : false;

  const primaryScore = knowsPrimary ? 1 : learningPrimary ? 0.6 : primary ? 0.15 : 0.5;

  if (knowsPrimary && primary) {
    reasons.push(`Written in ${primary}, which you know`);
  } else if (learningPrimary && primary) {
    reasons.push(`Written in ${primary}, which you want to get better at`);
  } else if (primary) {
    concerns.push(`Mainly ${primary}, which is not on your list`);
  }

  // Coverage across the rest of the stack.
  const secondary = technologies.filter(
    (tech) => !primary || tech.toLowerCase() !== primary.toLowerCase(),
  );
  const secondaryScore =
    secondary.length === 0
      ? 0.6
      : clamp(
          (intersect(secondary, experienced).length + intersect(secondary, learning).length * 0.6) /
            secondary.length,
        );

  const otherMatches = matched.filter(
    (tech) => !primary || tech.toLowerCase() !== primary.toLowerCase(),
  );
  if (otherMatches.length > 0) {
    reasons.push(`Also uses ${formatList(otherMatches)}`);
  }
  if (unfamiliar.length > 2) {
    concerns.push(`The stack also has ${formatList(unfamiliar.slice(0, 3))}, which you have not listed`);
  }

  const interestScore = matchedInterests.length > 0 ? clamp(0.6 + matchedInterests.length * 0.2) : 0.4;
  if (matchedInterests.length > 0) {
    reasons.push(`It is ${formatList(matchedInterests)}, which you care about`);
  }

  // Does the issue itself sit in territory the user knows?
  const issueTechnologies = technologiesMentionedIn(`${issue.title}\n${issue.body ?? ""}`);
  const issueMatches = intersect(issueTechnologies, experienced);
  if (issueMatches.length > 0) {
    reasons.push(`The issue itself is about ${formatList(issueMatches)}`);
  }
  const issueScore =
    issueTechnologies.length === 0 ? 0.5 : clamp(issueMatches.length / issueTechnologies.length);

  const score = clamp(
    primaryScore * 0.5 + secondaryScore * 0.25 + interestScore * 0.15 + issueScore * 0.1,
  );

  return {
    detail,
    technologies,
    signal: {
      score,
      confidence: technologies.length === 0 ? "low" : "high",
      reasons,
      concerns,
    },
  };
}

/** Technologies named in free text, using the same alias table as the catalog. */
function technologiesMentionedIn(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z0-9+#.-]{1,20}/g) ?? [];
  const found = new Set<string>();
  for (const word of words) {
    const canonical = normalizeTechnology(word);
    // `normalizeTechnology` returns the input unchanged when it is unknown, so
    // an actual alias hit is the only thing that counts.
    if (canonical.toLowerCase() !== word.toLowerCase()) found.add(canonical);
  }
  return [...found];
}

function formatList(values: string[]): string {
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}
