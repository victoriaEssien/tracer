/**
 * Shared domain types.
 *
 * These describe the vocabulary the whole application speaks: what we collected
 * from GitHub, what the analysis engine concluded, and what the recommendation
 * engine decided. Nothing here imports from a layer.
 */

/* -------------------------------------------------------------------------- */
/* User profile                                                               */
/* -------------------------------------------------------------------------- */

/** How a user relates to a technology. Mirrors `UserSkill.type` in the spec. */
export type SkillType = "experienced" | "learning" | "interested";

export type ContributionType =
  | "features"
  | "bug-fixes"
  | "ui-ux"
  | "documentation"
  | "tests"
  | "tooling";

export type TimeCommitment = "under-2h" | "2-5h" | "5-10h" | "10h-plus";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface UserSkillEntry {
  skill: string;
  type: SkillType;
}

/** The profile the recommendation engine scores against. */
export interface UserProfile {
  userId: string;
  /** Technologies the user says they already know. */
  experienced: string[];
  /** Technologies the user wants to get better at. */
  learning: string[];
  /** Domains the user finds interesting ("developer tools", "AI", ...). */
  interests: string[];
  contributionTypes: ContributionType[];
  timeCommitment: TimeCommitment;
  experienceLevel: ExperienceLevel;
  onboardedAt: Date | null;
}

/* -------------------------------------------------------------------------- */
/* Collected GitHub data                                                      */
/* -------------------------------------------------------------------------- */

export interface CollectedRepository {
  githubId: number;
  owner: string;
  name: string;
  /** `owner/name`. */
  fullName: string;
  description: string | null;
  htmlUrl: string;
  primaryLanguage: string | null;
  /** Bytes of code per language, as GitHub reports it. */
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  isArchived: boolean;
  isFork: boolean;
  hasContributingGuide: boolean;
  createdAt: string;
  pushedAt: string;
  /** Activity counts gathered from commits, releases, PRs and issues. */
  activity: RepositoryActivity;
}

export interface RepositoryActivity {
  commitsLast30Days: number;
  commitsLast90Days: number;
  lastCommitAt: string | null;
  lastReleaseAt: string | null;
  releasesLast12Months: number;
  contributorCount: number;
  recentContributorCount: number;
  openPullRequests: number;
  pullRequestsMergedLast90Days: number;
  pullRequestsOpenedLast90Days: number;
  /** Median hours from PR opened to merged, over recently merged PRs. */
  medianMergeHours: number | null;
  /** Median hours from PR opened to first maintainer comment or review. */
  medianFirstResponseHours: number | null;
  /** Open PRs that have been sitting for more than 90 days. */
  stalePullRequests: number;
  /** Whether external (non-owner) contributions are landing at all. */
  externalPullRequestsMergedLast90Days: number;
}

export interface CollectedIssueLabel {
  name: string;
  description: string | null;
  color: string | null;
}

export interface CollectedIssue {
  githubId: number;
  number: number;
  repositoryFullName: string;
  title: string;
  body: string | null;
  htmlUrl: string;
  state: "open" | "closed";
  author: string | null;
  authorAssociation: string | null;
  labels: CollectedIssueLabel[];
  assignees: string[];
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  /** Trimmed comment history — enough to judge clarity and competition. */
  comments: CollectedIssueComment[];
  /** Pull requests that reference this issue, if any were found. */
  linkedPullRequests: LinkedPullRequest[];
}

export interface CollectedIssueComment {
  author: string | null;
  /** GitHub's association: OWNER, MEMBER, COLLABORATOR, CONTRIBUTOR, NONE. */
  authorAssociation: string | null;
  body: string;
  createdAt: string;
}

export interface LinkedPullRequest {
  number: number;
  state: "open" | "closed";
  merged: boolean;
  author: string | null;
  createdAt: string;
  htmlUrl: string;
}

/** Everything the analysis engine needs. It never calls GitHub itself. */
export interface CollectedOpportunity {
  repository: CollectedRepository;
  issue: CollectedIssue;
}

/* -------------------------------------------------------------------------- */
/* Analysis output                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Every analysis module returns one of these. The reasoning is produced with
 * the score rather than reconstructed afterwards — it is a product feature, not
 * a debugging aid.
 */
export interface Signal {
  /** Normalised 0-1. The scorer applies the weights. */
  score: number;
  /** How much the underlying data supports the score. */
  confidence: Confidence;
  /** Things working in the contributor's favour. */
  reasons: string[];
  /** Things the contributor should know before starting. */
  concerns: string[];
}

export type Confidence = "low" | "medium" | "high";

export type ScoreDimension =
  | "skillMatch"
  | "issueSuitability"
  | "repositoryHealth"
  | "issueClarity"
  | "difficultyFit"
  | "learningOpportunity"
  | "maintainerActivity"
  | "competition";

export type Difficulty = "easy" | "medium" | "hard" | "unclear";

export type Scope = "small" | "medium" | "large" | "unclear";

export type Clarity = "high" | "medium" | "low";

export type IssueAvailability =
  | "available"
  | "assigned"
  | "likely-claimed"
  | "has-pull-request"
  | "stale"
  | "closed";

/** An estimated range, always reported as a range. Never a promise. */
export interface HoursEstimate {
  min: number;
  max: number;
}

export interface IssueStatusDetail {
  availability: IssueAvailability;
  assignees: string[];
  /** Login of whoever appears to have claimed it in the comments. */
  claimedBy: string | null;
  daysSinceUpdate: number;
  daysSinceCreated: number;
  hasMaintainerGuidance: boolean;
  openPullRequestNumber: number | null;
}

export interface SkillMatchDetail {
  /** Technologies both the repo and the user have. */
  matched: string[];
  /** Repo technologies the user is trying to learn. */
  learning: string[];
  /** Repo technologies the user has never mentioned. */
  unfamiliar: string[];
  /** Interests that line up with the repository's topics. */
  matchedInterests: string[];
}

/** The complete, explainable analysis of one opportunity for one user. */
export interface OpportunityAnalysis {
  dimensions: Record<ScoreDimension, Signal>;
  difficulty: Difficulty;
  scope: Scope;
  clarity: Clarity;
  estimatedHours: HoursEstimate | null;
  status: IssueStatusDetail;
  skills: SkillMatchDetail;
  /** Files or directories that look related, when we can tell. */
  startingPoints: StartingPoint[];
}

export interface StartingPoint {
  path: string;
  /** Why this path was suggested. Observed, unless `source` says otherwise. */
  reason: string;
  source: "observed" | "inferred";
}

/* -------------------------------------------------------------------------- */
/* Recommendation output                                                      */
/* -------------------------------------------------------------------------- */

export type Verdict = "recommended" | "possible" | "not-recommended";

export interface ScoreBreakdownEntry {
  dimension: ScoreDimension;
  label: string;
  /** Weight actually applied, after any personal adjustment. */
  weight: number;
  /** The dimension's own 0-1 score. */
  raw: number;
  /** Points this dimension contributed to the final 0-100 score. */
  contribution: number;
  confidence: Confidence;
  reasons: string[];
  concerns: string[];
}

export interface Explanation {
  /** "Why you might like this". */
  positives: string[];
  /** "Things to know". Never framed as a reason to skip on its own. */
  concerns: string[];
}

export interface Recommendation {
  issueId: string;
  score: number;
  verdict: Verdict;
  /** One sentence. The thing the user actually reads. */
  summary: string;
  explanation: Explanation;
  breakdown: ScoreBreakdownEntry[];
  analysis: OpportunityAnalysis;
  /** Present only when the AI layer is enabled and succeeded. */
  ai: AiInsights | null;
}

/* -------------------------------------------------------------------------- */
/* AI layer                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * AI output is kept in its own shape so the UI can render it as inference
 * rather than as observed GitHub data. It never overwrites an observed value.
 */
export interface AiInsights {
  provider: string;
  model: string;
  generatedAt: string;
  summary: string | null;
  difficultyReasoning: string | null;
  likelyFiles: string[];
  contributionPlan: string[];
  questionsToInvestigate: string[];
}

/* -------------------------------------------------------------------------- */
/* Discovery progress                                                         */
/* -------------------------------------------------------------------------- */

/**
 * What a discovery run reports while it works.
 *
 * A run takes a minute or two across three distinct phases, and a spinner that
 * says nothing for ninety seconds reads as a hang. These events are streamed to
 * the browser as newline-delimited JSON as each step completes.
 */
export type DiscoveryProgress =
  | { phase: "searching"; queriesRun: number; queriesTotal: number; candidates: number }
  | { phase: "collecting"; repositories: number; issues: number; issuesTarget: number }
  | { phase: "scoring"; analyzed: number; total: number }
  | { phase: "done"; scored: number; rateLimited: boolean }
  | { phase: "error"; message: string };

/* -------------------------------------------------------------------------- */
/* Feed                                                                       */
/* -------------------------------------------------------------------------- */

export interface OpportunitySummary {
  id: string;
  score: number;
  verdict: Verdict;
  title: string;
  issueNumber: number;
  issueUrl: string;
  repository: {
    fullName: string;
    owner: string;
    name: string;
    stars: number;
    primaryLanguage: string | null;
  };
  technologies: string[];
  difficulty: Difficulty;
  estimatedHours: HoursEstimate | null;
  topReasons: string[];
  topConcerns: string[];
  saved: boolean;
  /** When the issue was opened, so a three-year-old issue looks like one. */
  openedAt: string;
  /** Last activity on the issue itself, not on our analysis of it. */
  issueUpdatedAt: string;
  analyzedAt: string;
}

export interface SavedOpportunityView extends OpportunitySummary {
  savedAt: string;
  scoreAtSave: number;
  statusNote: string | null;
  statusChangedAt: string | null;
  currentAvailability: IssueAvailability;
}
