/**
 * The analysis engine.
 *
 * Takes data that has already been collected and produces every signal the
 * recommendation engine needs. Architecture rule 2: nothing here calls GitHub.
 * Import a module directly if you only need one signal.
 */

import type {
  CollectedIssue,
  CollectedRepository,
  OpportunityAnalysis,
  UserProfile,
} from "@/types";

import { analyzeDifficultyFit, estimateDifficulty } from "./difficulty";
import { analyzeIssueClarity } from "./issue-clarity";
import { analyzeCompetition, analyzeIssueStatus } from "./issue-status";
import { analyzeLearningValue } from "./learning-value";
import { analyzeMaintainerActivity } from "./maintainer-activity";
import { analyzeRepositoryHealth } from "./repo-health";
import { estimateScope } from "./scope-estimation";
import { analyzeSkillMatch } from "./skill-matching";
import { findStartingPoints } from "./starting-points";

export { analyzeDifficultyFit, estimateDifficulty } from "./difficulty";
export { analyzeIssueClarity } from "./issue-clarity";
export { analyzeCompetition, analyzeIssueStatus } from "./issue-status";
export { analyzeLearningValue } from "./learning-value";
export { analyzeMaintainerActivity } from "./maintainer-activity";
export { analyzeRepositoryHealth } from "./repo-health";
export { estimateScope, extractFilePaths } from "./scope-estimation";
export { analyzeSkillMatch } from "./skill-matching";
export { findStartingPoints } from "./starting-points";

export interface AnalysisInput {
  repository: CollectedRepository;
  issue: CollectedIssue;
  profile: UserProfile;
  /** Top-level directories, when the collector was able to list them. */
  topLevelPaths?: string[];
  now?: Date;
}

export interface AnalysisOutput {
  analysis: OpportunityAnalysis;
  /** Technologies the repository uses, reused by the feed and the AI layer. */
  technologies: string[];
}

export function analyzeOpportunity(input: AnalysisInput): AnalysisOutput {
  const { repository, issue, profile, topLevelPaths = [], now = new Date() } = input;

  const skill = analyzeSkillMatch(repository, issue, profile);
  const status = analyzeIssueStatus(issue, now);
  const clarity = analyzeIssueClarity(issue);
  const scope = estimateScope(issue, repository);

  const difficulty = estimateDifficulty({
    issue,
    repo: repository,
    scope: scope.scope,
    clarity: clarity.clarity,
    skills: skill.detail,
  });

  const difficultyFit = analyzeDifficultyFit({
    difficulty: difficulty.difficulty,
    estimatedHours: scope.estimatedHours,
    profile,
  });

  // Scope reasoning belongs with difficulty fit: it is the same question asked
  // from the other side, and the user reads them together.
  difficultyFit.reasons = [...scope.signal.reasons, ...difficulty.reasons, ...difficultyFit.reasons];
  difficultyFit.concerns = [
    ...scope.signal.concerns,
    ...difficulty.concerns,
    ...difficultyFit.concerns,
  ];

  const analysis: OpportunityAnalysis = {
    dimensions: {
      skillMatch: skill.signal,
      issueSuitability: status.signal,
      repositoryHealth: analyzeRepositoryHealth(repository),
      issueClarity: clarity.signal,
      difficultyFit,
      learningOpportunity: analyzeLearningValue({
        repo: repository,
        issue,
        profile,
        skills: skill.detail,
      }),
      maintainerActivity: analyzeMaintainerActivity(repository, issue),
      competition: analyzeCompetition(issue, now),
    },
    difficulty: difficulty.difficulty,
    scope: scope.scope,
    clarity: clarity.clarity,
    estimatedHours: scope.estimatedHours,
    status: status.detail,
    skills: skill.detail,
    startingPoints: findStartingPoints({ issue, topLevelPaths }),
  };

  return { analysis, technologies: skill.technologies };
}
