/**
 * Learning value.
 *
 * Overlap with what the user said they want to get better at. This is the
 * dimension that lets a partial skill match still be a good recommendation
 * (spec section 4.1): a repository does not have to match what you already know
 * if it is a reasonable place to learn.
 */

import { contributionTypesFromLabels } from "@/config/labels";
import { normalizeTechnology } from "@/config/skills";
import { clamp, intersect } from "@/lib/utils";
import type {
  CollectedIssue,
  CollectedRepository,
  Signal,
  SkillMatchDetail,
  UserProfile,
} from "@/types";

export function analyzeLearningValue(input: {
  repo: CollectedRepository;
  issue: CollectedIssue;
  profile: UserProfile;
  skills: SkillMatchDetail;
}): Signal {
  const { repo, issue, profile, skills } = input;
  const reasons: string[] = [];
  const concerns: string[] = [];

  const goals = profile.learning.map(normalizeTechnology);

  if (goals.length === 0) {
    // No stated goals is not a penalty; the dimension simply says nothing.
    return {
      score: 0.5,
      confidence: "low",
      reasons: [],
      concerns: [],
    };
  }

  let score = 0.2;

  const goalMatches = skills.learning;
  if (goalMatches.length > 0) {
    score += clamp(goalMatches.length / goals.length) * 0.5;
    reasons.push(`Uses ${goalMatches.join(", ")}, which you want to get better at`);
  }

  // Learning goals can also be practices rather than technologies: "testing",
  // "documentation". Those show up in the issue's labels.
  const contributionTypes = contributionTypesFromLabels(issue.labels.map((label) => label.name));
  const practiceGoals = intersect(
    goals,
    contributionTypes.map((type) => type.replace("-", " ")),
  );
  if (practiceGoals.length > 0) {
    score += 0.15;
    reasons.push(`The work is ${practiceGoals.join(" and ")}, which is on your list`);
  }

  // A project you can learn from needs to be readable and willing to teach.
  if (repo.hasContributingGuide) {
    score += 0.1;
    reasons.push("A contributing guide makes this an easier place to learn");
  }
  if (repo.activity.recentContributorCount >= 5) {
    score += 0.05;
  }

  // No concern is raised for the absence of a learning match. It is not a
  // reason to be careful about a contribution, and listing it under "things to
  // know" crowds out the warnings that are.

  // Learning in a project that never merges outside work is not learning much.
  if (repo.activity.externalPullRequestsMergedLast90Days === 0 && goalMatches.length > 0) {
    concerns.push("Good place to practise, but outside work is not landing here");
  }

  return {
    score: clamp(score),
    confidence: "medium",
    reasons,
    concerns,
  };
}
