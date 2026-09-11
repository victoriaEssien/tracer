/**
 * Difficulty, and whether that difficulty fits the user.
 *
 * Difficulty is estimated independently of GitHub labels. A `good first issue`
 * raises the prior and nothing more (scoring.md rule 1) — plenty of them turn
 * out to need deep knowledge of a codebase.
 */

import { EXPERIENCE_DIFFICULTY_FIT, TIME_BUDGET_HOURS, UNCLEAR_DIFFICULTY_SCORE } from "@/config/scoring";
import { contributionTypesFromLabels, hasBeginnerLabel, hasHardLabel } from "@/config/labels";
import { clamp } from "@/lib/utils";
import type {
  Clarity,
  CollectedIssue,
  CollectedRepository,
  Difficulty,
  HoursEstimate,
  Scope,
  Signal,
  SkillMatchDetail,
  UserProfile,
} from "@/types";

export function estimateDifficulty(input: {
  issue: CollectedIssue;
  repo: CollectedRepository;
  scope: Scope;
  clarity: Clarity;
  skills: SkillMatchDetail;
}): { difficulty: Difficulty; reasons: string[]; concerns: string[] } {
  const { issue, repo, scope, clarity, skills } = input;
  const reasons: string[] = [];
  const concerns: string[] = [];
  const labels = issue.labels.map((label) => label.name);

  if (scope === "unclear" && clarity === "low") {
    return {
      difficulty: "unclear",
      reasons: [],
      concerns: ["Not enough detail to guess how hard this is"],
    };
  }

  // 0 is easy, 1 is hard.
  let hardness = scope === "small" ? 0.2 : scope === "medium" ? 0.5 : scope === "large" ? 0.8 : 0.5;

  if (clarity === "low") {
    hardness += 0.15;
    concerns.push("A thin description makes this harder than its size suggests");
  } else if (clarity === "high") {
    hardness -= 0.08;
  }

  // Unfamiliar technology is difficulty, not just a skill-match penalty.
  if (skills.unfamiliar.length >= 3) {
    hardness += 0.12;
    concerns.push("Several parts of the stack are new to you");
  } else if (skills.matched.length >= 2) {
    hardness -= 0.08;
  }

  const types = contributionTypesFromLabels(labels);
  if (types.includes("documentation")) hardness -= 0.15;
  if (types.includes("tests")) hardness -= 0.05;
  if (types.includes("features") && scope !== "small") hardness += 0.05;

  if (hasBeginnerLabel(labels)) {
    hardness -= 0.12;
    reasons.push("Maintainers marked it as approachable");
  }
  if (hasHardLabel(labels)) {
    hardness += 0.15;
  }

  // A big codebase raises the floor on any change.
  const bytes = Object.values(repo.languages).reduce((sum, value) => sum + value, 0);
  if (bytes > 50_000_000) {
    hardness += 0.1;
  } else if (bytes > 0 && bytes < 2_000_000) {
    hardness -= 0.05;
    reasons.push("The codebase is small enough to learn quickly");
  }

  if (!repo.hasContributingGuide) {
    hardness += 0.05;
    concerns.push("No contributing guide, so setup is on you to work out");
  }

  const difficulty: Difficulty = hardness <= 0.34 ? "easy" : hardness <= 0.62 ? "medium" : "hard";

  if (difficulty === "easy") {
    reasons.push("The work is self-contained");
  } else if (difficulty === "hard") {
    concerns.push("You need to know this codebase before starting");
  }

  return { difficulty, reasons, concerns };
}

/**
 * How well that difficulty matches this user's experience level and available
 * time. Hours are compared as ranges — an estimate is never a promise.
 */
export function analyzeDifficultyFit(input: {
  difficulty: Difficulty;
  estimatedHours: HoursEstimate | null;
  profile: UserProfile;
}): Signal {
  const { difficulty, estimatedHours, profile } = input;
  const reasons: string[] = [];
  const concerns: string[] = [];

  if (difficulty === "unclear") {
    return {
      score: UNCLEAR_DIFFICULTY_SCORE,
      confidence: "low",
      reasons: [],
      concerns: ["The issue says too little to judge difficulty"],
    };
  }

  const experienceFit = EXPERIENCE_DIFFICULTY_FIT[profile.experienceLevel][difficulty];

  if (experienceFit >= 0.9) {
    reasons.push(`${capitalise(difficulty)} work, which suits your experience`);
  } else if (experienceFit <= 0.3) {
    concerns.push(
      `${capitalise(difficulty)} for your experience level, so expect to read before you write`,
    );
  }

  const budget = TIME_BUDGET_HOURS[profile.timeCommitment];
  let timeFit = 0.6;

  if (estimatedHours) {
    if (estimatedHours.max <= budget.max) {
      timeFit = 1;
      reasons.push(
        `${estimatedHours.min} to ${estimatedHours.max} hours, which fits the time you have`,
      );
    } else if (estimatedHours.min <= budget.max) {
      timeFit = 0.65;
      reasons.push(
        `${estimatedHours.min} to ${estimatedHours.max} hours, so it may run past one sitting`,
      );
    } else {
      timeFit = 0.25;
      concerns.push(
        `${estimatedHours.min} to ${estimatedHours.max} hours, more than the time you said you have`,
      );
    }
  }

  return {
    score: clamp(experienceFit * 0.6 + timeFit * 0.4),
    confidence: estimatedHours ? "medium" : "low",
    reasons,
    concerns,
  };
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
