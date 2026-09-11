/**
 * The opportunity service.
 *
 * Everything the routes and pages need, in one place: build a feed, analyse one
 * issue, open the deep dive, save and dismiss. Route handlers stay thin and
 * call these (architecture rule 5).
 */

import { ANALYSIS_TTL_HOURS, COLLECTION_TTL_HOURS } from "@/config/scoring";
import { daysSince } from "@/lib/utils";
import { generateInsights } from "@/server/ai";
import {
  collectIssue,
  collectRepository,
  collectTopLevelPaths,
  githubForUser,
  type GitHubClient,
} from "@/server/github";
import { toCollectedIssue, toCollectedRepository } from "@/server/db/mappers";
import * as queries from "@/server/db/queries";
import { learnPreferences, recommend, summarizeForFeed } from "@/server/recommendation";
import type {
  OpportunitySummary,
  Recommendation,
  SavedOpportunityView,
  ScoreBreakdownEntry,
  ScoreDimension,
  UserProfile,
} from "@/types";
import type { IssueRow, RepositoryRow } from "@/server/db/schema";

/* -------------------------------------------------------------------------- */
/* Feed                                                                       */
/* -------------------------------------------------------------------------- */

export interface FeedOptions {
  limit?: number;
  offset?: number;
  minScore?: number;
  difficulty?: string;
  /** Score anything not yet analysed before returning. Defaults to true. */
  analyzePending?: boolean;
}

export async function getFeed(
  userId: string,
  options: FeedOptions = {},
): Promise<OpportunitySummary[]> {
  const profile = await queries.getUserProfile(userId);
  if (!profile) return [];

  if (options.analyzePending !== false) {
    const limit = options.limit ?? 25;
    await analyzePending(userId, profile, limit);
    await refreshStaleAnalyses(userId, profile, limit);
  }

  const rows = await queries.listFeed(userId, {
    limit: options.limit,
    offset: options.offset,
    minScore: options.minScore,
    difficulty: options.difficulty,
  });

  return rows.map(toSummary);
}

export async function getSaved(userId: string): Promise<SavedOpportunityView[]> {
  const rows = await queries.listSaved(userId);
  return rows.map((row) => ({
    ...toSummary(row),
    saved: true,
    savedAt: (row.savedAt ?? new Date()).toISOString(),
    scoreAtSave: row.scoreAtSave,
    statusNote: row.statusNote,
    statusChangedAt: row.statusChangedAt?.toISOString() ?? null,
    currentAvailability: row.analysis.availability,
  }));
}

function toSummary(row: queries.FeedRow): OpportunitySummary {
  const { analysis, issue, repository } = row;
  const { reasons, concerns } = summarizeForFeed(analysis.breakdown);

  return {
    id: issue.id,
    score: Math.round(analysis.overallScore),
    verdict: analysis.verdict,
    title: issue.title,
    issueNumber: issue.number,
    issueUrl: issue.htmlUrl,
    repository: {
      fullName: repository.fullName,
      owner: repository.owner,
      name: repository.name,
      stars: repository.stars,
      primaryLanguage: repository.primaryLanguage,
    },
    technologies: analysis.technologies,
    difficulty: analysis.difficulty,
    estimatedHours:
      analysis.estimatedHoursMin !== null && analysis.estimatedHoursMax !== null
        ? { min: analysis.estimatedHoursMin, max: analysis.estimatedHoursMax }
        : null,
    topReasons: reasons.length > 0 ? reasons : analysis.positives.slice(0, 3),
    topConcerns: concerns.length > 0 ? concerns : analysis.concerns.slice(0, 2),
    saved: row.savedAt !== null,
    openedAt: (issue.createdAt ?? analysis.createdAt).toISOString(),
    issueUpdatedAt: (issue.updatedAt ?? analysis.createdAt).toISOString(),
    analyzedAt: analysis.createdAt.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Analysis                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Scores issues that have been collected but never analysed for this user.
 * Runs off stored data only, so it costs no GitHub requests.
 */
export async function analyzePending(
  userId: string,
  profile: UserProfile,
  limit: number,
): Promise<number> {
  const pending = await queries.findUnanalyzedIssues(userId, limit);
  if (pending.length === 0) return 0;

  const weights = await personalWeights(userId);

  for (const row of pending) {
    await analyzeStored(userId, profile, row, weights);
  }

  return pending.length;
}

/**
 * Re-scores analyses that have aged past the freshness window, so a
 * recommendation is never built on a month-old view of an issue.
 */
export async function refreshStaleAnalyses(
  userId: string,
  profile: UserProfile,
  limit: number,
): Promise<number> {
  const cutoff = new Date(Date.now() - ANALYSIS_TTL_HOURS * 3_600_000);
  const stale = await queries.findStaleAnalyses(userId, cutoff, limit);
  if (stale.length === 0) return 0;

  const weights = await personalWeights(userId);
  for (const row of stale) {
    await analyzeStored(userId, profile, row, weights);
  }

  return stale.length;
}

/**
 * Re-scores everything already analysed for this user, regardless of age.
 * Called after a profile change, because half the dimensions are relative to
 * the profile.
 */
export async function reanalyzeAll(userId: string, limit = 200): Promise<number> {
  const profile = await queries.getUserProfile(userId);
  if (!profile) return 0;

  const stale = await queries.findStaleAnalyses(userId, new Date(), limit);
  const weights = await personalWeights(userId);

  for (const row of stale) {
    await analyzeStored(userId, profile, row, weights);
  }

  return stale.length;
}

async function analyzeStored(
  userId: string,
  profile: UserProfile,
  row: { issue: IssueRow; repository: RepositoryRow },
  weights: Awaited<ReturnType<typeof personalWeights>>,
): Promise<Recommendation> {
  const repository = toCollectedRepository(row.repository);
  const issue = toCollectedIssue(row.issue, row.repository.fullName);

  const { recommendation, technologies } = recommend({
    issueId: row.issue.id,
    repository,
    issue,
    profile,
    weights,
  });

  await queries.saveAnalysis({
    issueId: row.issue.id,
    userId,
    recommendation,
    technologies,
  });

  return recommendation;
}

async function personalWeights(userId: string) {
  const events = await queries.listEvents(userId);
  return learnPreferences(
    events.map((event) => ({
      type: event.type,
      technologies: event.technologies,
      contributionTypes: event.contributionTypes,
      difficulty: event.difficulty,
      dimensionScores: event.dimensionScores ?? null,
      createdAt: event.createdAt,
    })),
  ).weights;
}

export async function getLearnedPreferences(userId: string) {
  const events = await queries.listEvents(userId);
  return learnPreferences(
    events.map((event) => ({
      type: event.type,
      technologies: event.technologies,
      contributionTypes: event.contributionTypes,
      difficulty: event.difficulty,
      dimensionScores: event.dimensionScores ?? null,
      createdAt: event.createdAt,
    })),
  );
}

/* -------------------------------------------------------------------------- */
/* Deep dive                                                                  */
/* -------------------------------------------------------------------------- */

export interface OpportunityDetail {
  issue: IssueRow;
  repository: RepositoryRow;
  recommendation: Recommendation;
  saved: boolean;
  /** True when the collected data is old enough to be worth refetching. */
  stale: boolean;
}

/**
 * The deep dive. Recomputes the analysis from stored collected data rather than
 * reading back a summary, so every dimension keeps its full reasoning.
 */
export async function getOpportunity(
  userId: string,
  issueId: string,
): Promise<OpportunityDetail | null> {
  const stored = await queries.getStoredOpportunity(issueId);
  if (!stored) return null;

  const profile = await queries.getUserProfile(userId);
  if (!profile) return null;

  const repository = toCollectedRepository(stored.repository);
  const issue = toCollectedIssue(stored.issue, stored.repository.fullName);
  const existing = await queries.getAnalysisFor(issueId, userId);

  const { recommendation, technologies } = recommend({
    issueId,
    repository,
    issue,
    profile,
    weights: await personalWeights(userId),
    ai: existing?.ai ?? null,
  });

  // Keep the stored copy in step with what the user is looking at.
  await queries.saveAnalysis({ issueId, userId, recommendation, technologies });

  await queries.recordEvent({
    userId,
    issueId,
    type: "viewed",
    technologies,
    difficulty: recommendation.analysis.difficulty,
    dimensionScores: dimensionScores(recommendation.breakdown),
  });

  return {
    issue: stored.issue,
    repository: stored.repository,
    recommendation,
    saved: await queries.isSaved(userId, issueId),
    stale:
      daysSince(stored.issue.collectedAt) * 24 > COLLECTION_TTL_HOURS.issue &&
      stored.issue.state === "open",
  };
}

/**
 * Collects one issue straight from GitHub, analyses it and stores it. This is
 * the path for "analyse this URL" and for the discovery job.
 */
export async function analyzeFromGitHub(input: {
  userId: string;
  owner: string;
  repo: string;
  issueNumber: number;
  client?: GitHubClient;
  /** Generate AI insights too. Off by default — the feed does not need them. */
  withAi?: boolean;
}): Promise<{ issueId: string; recommendation: Recommendation } | null> {
  const profile = await queries.getUserProfile(input.userId);
  if (!profile) return null;

  const client = input.client ?? (await githubForUser(input.userId));

  const repository = await collectRepository(client, input.owner, input.repo);
  if (!repository) return null;

  const issue = await collectIssue(client, input.owner, input.repo, input.issueNumber);
  if (!issue) return null;

  const repositoryId = await queries.upsertRepository(repository);
  const issueId = await queries.upsertIssue(repositoryId, issue);

  const topLevelPaths = await collectTopLevelPaths(client, input.owner, input.repo);

  const { recommendation, technologies } = recommend({
    issueId,
    repository,
    issue,
    profile,
    topLevelPaths,
    weights: await personalWeights(input.userId),
  });

  if (input.withAi) {
    const ai = await generateInsights({
      repository,
      issue,
      analysis: recommendation.analysis,
      technologies,
    });
    // Inference is attached alongside observed data, never merged into it.
    recommendation.ai = ai;
  }

  await queries.saveAnalysis({ issueId, userId: input.userId, recommendation, technologies });

  return { issueId, recommendation };
}

/**
 * Adds AI insights to an existing analysis, on demand. Kept separate from the
 * analysis path so a slow or missing AI provider never delays the feed.
 */
export async function addAiInsights(
  userId: string,
  issueId: string,
): Promise<Recommendation["ai"]> {
  const detail = await getOpportunity(userId, issueId);
  if (!detail) return null;

  const stored = await queries.getAnalysisFor(issueId, userId);

  const ai = await generateInsights({
    repository: toCollectedRepository(detail.repository),
    issue: toCollectedIssue(detail.issue, detail.repository.fullName),
    analysis: detail.recommendation.analysis,
    technologies: stored?.technologies ?? [],
  });

  if (ai) await queries.attachAiInsights(issueId, userId, ai);
  return ai;
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function save(userId: string, issueId: string): Promise<void> {
  const analysis = await queries.getAnalysisFor(issueId, userId);
  if (!analysis) throw new Error("Cannot save an opportunity that has not been analysed");

  await queries.saveOpportunity(userId, issueId, analysis.overallScore);
  await queries.recordEvent({
    userId,
    issueId,
    type: "saved",
    technologies: analysis.technologies,
    difficulty: analysis.difficulty,
    dimensionScores: dimensionScores(analysis.breakdown),
  });
}

export async function unsave(userId: string, issueId: string): Promise<void> {
  await queries.unsaveOpportunity(userId, issueId);
  await queries.recordEvent({ userId, issueId, type: "unsaved" });
}

export async function undismiss(userId: string, issueId: string): Promise<void> {
  await queries.undismissOpportunity(userId, issueId);
  await queries.recordEvent({ userId, issueId, type: "undismissed" });
}

export async function getDismissed(userId: string): Promise<OpportunitySummary[]> {
  const rows = await queries.listFeed(userId, { limit: 50, onlyDismissed: true });
  return rows.map(toSummary);
}

export async function dismiss(userId: string, issueId: string): Promise<void> {
  const analysis = await queries.getAnalysisFor(issueId, userId);

  await queries.dismissOpportunity(userId, issueId);
  await queries.recordEvent({
    userId,
    issueId,
    type: "dismissed",
    technologies: analysis?.technologies ?? [],
    difficulty: analysis?.difficulty ?? null,
    dimensionScores: analysis ? dimensionScores(analysis.breakdown) : null,
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function dimensionScores(
  breakdown: ScoreBreakdownEntry[],
): Partial<Record<ScoreDimension, number>> {
  return Object.fromEntries(breakdown.map((entry) => [entry.dimension, entry.raw]));
}
