/**
 * Data access.
 *
 * Everything that reads or writes the database lives behind these functions, so
 * route handlers and jobs never assemble SQL themselves.
 */

import { and, desc, eq, gte, isNotNull, isNull, lt, or, sql } from "drizzle-orm";

import type {
  AiInsights,
  CollectedIssue,
  CollectedRepository,
  ContributionType,
  Difficulty,
  ExperienceLevel,
  Recommendation,
  ScoreDimension,
  SkillType,
  TimeCommitment,
  UserProfile,
  UserSkillEntry,
} from "@/types";

import { db } from "./client";
import {
  analyses,
  dismissedOpportunities,
  issues,
  profiles,
  repositories,
  savedOpportunities,
  userEvents,
  userSkills,
  type AnalysisRow,
  type IssueRow,
  type RepositoryRow,
} from "./schema";

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const skills = await db.select().from(userSkills).where(eq(userSkills.userId, userId));

  if (!profile && skills.length === 0) return null;

  return {
    userId,
    experienced: skills.filter((skill) => skill.type === "experienced").map((skill) => skill.skill),
    learning: skills.filter((skill) => skill.type === "learning").map((skill) => skill.skill),
    interests: skills.filter((skill) => skill.type === "interested").map((skill) => skill.skill),
    contributionTypes: profile?.contributionTypes ?? [],
    timeCommitment: profile?.timeCommitment ?? "2-5h",
    experienceLevel: profile?.experienceLevel ?? "intermediate",
    onboardedAt: profile?.onboardedAt ?? null,
  };
}

export interface SaveProfileInput {
  skills: UserSkillEntry[];
  contributionTypes: ContributionType[];
  timeCommitment: TimeCommitment;
  experienceLevel: ExperienceLevel;
  markOnboarded?: boolean;
}

export async function saveUserProfile(userId: string, input: SaveProfileInput): Promise<void> {
  const now = new Date();

  await db
    .insert(profiles)
    .values({
      userId,
      contributionTypes: input.contributionTypes,
      timeCommitment: input.timeCommitment,
      experienceLevel: input.experienceLevel,
      onboardedAt: input.markOnboarded ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        contributionTypes: input.contributionTypes,
        timeCommitment: input.timeCommitment,
        experienceLevel: input.experienceLevel,
        updatedAt: now,
        // Onboarding only ever completes once.
        ...(input.markOnboarded ? { onboardedAt: sql`coalesce(${profiles.onboardedAt}, now())` } : {}),
      },
    });

  // Skills are replaced wholesale: the onboarding form is the full picture, and
  // diffing rows would leave removed skills behind.
  await db.delete(userSkills).where(eq(userSkills.userId, userId));
  if (input.skills.length > 0) {
    await db
      .insert(userSkills)
      .values(
        input.skills.map((skill) => ({
          userId,
          skill: skill.skill,
          type: skill.type as SkillType,
        })),
      )
      .onConflictDoNothing();
  }
}

/* -------------------------------------------------------------------------- */
/* Collected data                                                             */
/* -------------------------------------------------------------------------- */

export async function upsertRepository(collected: CollectedRepository): Promise<string> {
  const values = {
    githubId: collected.githubId,
    owner: collected.owner,
    name: collected.name,
    fullName: collected.fullName,
    description: collected.description,
    htmlUrl: collected.htmlUrl,
    primaryLanguage: collected.primaryLanguage,
    languages: collected.languages,
    topics: collected.topics,
    stars: collected.stars,
    forks: collected.forks,
    openIssues: collected.openIssues,
    license: collected.license,
    isArchived: collected.isArchived,
    isFork: collected.isFork,
    hasContributingGuide: collected.hasContributingGuide,
    activity: collected.activity,
    createdAt: new Date(collected.createdAt),
    pushedAt: new Date(collected.pushedAt),
    lastActivityAt: collected.activity.lastCommitAt
      ? new Date(collected.activity.lastCommitAt)
      : new Date(collected.pushedAt),
    collectedAt: new Date(),
  };

  const [row] = await db
    .insert(repositories)
    .values(values)
    .onConflictDoUpdate({ target: repositories.githubId, set: values })
    .returning({ id: repositories.id });

  return row.id;
}

export async function upsertIssue(
  repositoryId: string,
  collected: CollectedIssue,
): Promise<string> {
  const values = {
    githubId: collected.githubId,
    repositoryId,
    number: collected.number,
    title: collected.title,
    body: collected.body,
    htmlUrl: collected.htmlUrl,
    labels: collected.labels,
    state: collected.state,
    author: collected.author,
    authorAssociation: collected.authorAssociation,
    assignees: collected.assignees,
    commentCount: collected.commentCount,
    reactionCount: collected.reactionCount,
    comments: collected.comments,
    linkedPullRequests: collected.linkedPullRequests,
    createdAt: new Date(collected.createdAt),
    updatedAt: new Date(collected.updatedAt),
    closedAt: collected.closedAt ? new Date(collected.closedAt) : null,
    collectedAt: new Date(),
  };

  const [row] = await db
    .insert(issues)
    .values(values)
    .onConflictDoUpdate({ target: issues.githubId, set: values })
    .returning({ id: issues.id });

  return row.id;
}

export interface StoredOpportunity {
  issue: IssueRow;
  repository: RepositoryRow;
}

export async function getStoredOpportunity(issueId: string): Promise<StoredOpportunity | null> {
  const [row] = await db
    .select({ issue: issues, repository: repositories })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(issues.id, issueId))
    .limit(1);
  return row ?? null;
}

export async function findIssueByNumber(
  fullName: string,
  number: number,
): Promise<StoredOpportunity | null> {
  const [row] = await db
    .select({ issue: issues, repository: repositories })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(repositories.fullName, fullName), eq(issues.number, number)))
    .limit(1);
  return row ?? null;
}

export async function findRepositoryByFullName(fullName: string): Promise<RepositoryRow | null> {
  const [row] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.fullName, fullName))
    .limit(1);
  return row ?? null;
}

/**
 * Open issues that have never been analysed for this user, oldest collection
 * first. The feed uses this to decide what to score next.
 */
export async function findUnanalyzedIssues(
  userId: string,
  limit: number,
): Promise<StoredOpportunity[]> {
  return db
    .select({ issue: issues, repository: repositories })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .leftJoin(
      analyses,
      and(eq(analyses.issueId, issues.id), eq(analyses.userId, userId)),
    )
    .leftJoin(
      dismissedOpportunities,
      and(
        eq(dismissedOpportunities.issueId, issues.id),
        eq(dismissedOpportunities.userId, userId),
      ),
    )
    .where(
      and(
        eq(issues.state, "open"),
        eq(repositories.isArchived, false),
        isNull(analyses.id),
        isNull(dismissedOpportunities.issueId),
      ),
    )
    .orderBy(desc(issues.updatedAt))
    .limit(limit);
}

/* -------------------------------------------------------------------------- */
/* Analyses                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveAnalysis(input: {
  issueId: string;
  userId: string;
  recommendation: Recommendation;
  technologies: string[];
}): Promise<void> {
  const { recommendation: rec } = input;

  const values = {
    issueId: input.issueId,
    userId: input.userId,
    overallScore: rec.score,
    verdict: rec.verdict,
    summary: rec.summary,
    difficulty: rec.analysis.difficulty,
    scope: rec.analysis.scope,
    availability: rec.analysis.status.availability,
    estimatedHoursMin: rec.analysis.estimatedHours?.min ?? null,
    estimatedHoursMax: rec.analysis.estimatedHours?.max ?? null,
    breakdown: rec.breakdown,
    positives: rec.explanation.positives,
    concerns: rec.explanation.concerns,
    technologies: input.technologies,
    startingPoints: rec.analysis.startingPoints,
    ai: rec.ai,
    createdAt: new Date(),
  };

  await db
    .insert(analyses)
    .values(values)
    .onConflictDoUpdate({
      target: [analyses.issueId, analyses.userId],
      set: values,
    });
}

export async function attachAiInsights(
  issueId: string,
  userId: string,
  ai: AiInsights,
): Promise<void> {
  await db
    .update(analyses)
    .set({ ai })
    .where(and(eq(analyses.issueId, issueId), eq(analyses.userId, userId)));
}

export interface FeedRow {
  analysis: AnalysisRow;
  issue: IssueRow;
  repository: RepositoryRow;
  savedAt: Date | null;
}

export interface FeedFilters {
  limit?: number;
  offset?: number;
  minScore?: number;
  /** Only issues whose analysis is newer than this. */
  freshSince?: Date;
  /** Restrict to a difficulty the user asked for. */
  difficulty?: string;
  /** Return what the user dismissed instead of what they have not. */
  onlyDismissed?: boolean;
}

export async function listFeed(userId: string, filters: FeedFilters = {}): Promise<FeedRow[]> {
  const conditions = [eq(analyses.userId, userId), eq(issues.state, "open")];
  if (filters.minScore !== undefined) {
    conditions.push(gte(analyses.overallScore, filters.minScore));
  }
  if (filters.freshSince) {
    conditions.push(gte(analyses.createdAt, filters.freshSince));
  }
  if (filters.difficulty) {
    conditions.push(eq(analyses.difficulty, filters.difficulty as AnalysisRow["difficulty"]));
  }

  return db
    .select({
      analysis: analyses,
      issue: issues,
      repository: repositories,
      savedAt: savedOpportunities.createdAt,
    })
    .from(analyses)
    .innerJoin(issues, eq(analyses.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .leftJoin(
      savedOpportunities,
      and(
        eq(savedOpportunities.issueId, issues.id),
        eq(savedOpportunities.userId, userId),
      ),
    )
    .leftJoin(
      dismissedOpportunities,
      and(
        eq(dismissedOpportunities.issueId, issues.id),
        eq(dismissedOpportunities.userId, userId),
      ),
    )
    .where(
      and(
        ...conditions,
        filters.onlyDismissed
          ? isNotNull(dismissedOpportunities.issueId)
          : isNull(dismissedOpportunities.issueId),
      ),
    )
    .orderBy(desc(analyses.overallScore))
    .limit(filters.limit ?? 25)
    .offset(filters.offset ?? 0);
}

/** How many issues this user already has scored. Drives discovery paging. */
export async function countAnalyses(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(analyses)
    .where(eq(analyses.userId, userId));
  return row?.total ?? 0;
}

export async function getAnalysisFor(
  issueId: string,
  userId: string,
): Promise<AnalysisRow | null> {
  const [row] = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.issueId, issueId), eq(analyses.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Analyses older than the freshness window, so the feed can refresh them. */
export async function findStaleAnalyses(
  userId: string,
  olderThan: Date,
  limit: number,
): Promise<StoredOpportunity[]> {
  return db
    .select({ issue: issues, repository: repositories })
    .from(analyses)
    .innerJoin(issues, eq(analyses.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(eq(analyses.userId, userId), lt(analyses.createdAt, olderThan)))
    .orderBy(analyses.createdAt)
    .limit(limit);
}

/* -------------------------------------------------------------------------- */
/* Saved and dismissed                                                        */
/* -------------------------------------------------------------------------- */

export async function saveOpportunity(
  userId: string,
  issueId: string,
  scoreAtSave: number,
): Promise<void> {
  await db
    .insert(savedOpportunities)
    .values({ userId, issueId, scoreAtSave })
    .onConflictDoNothing();
}

export async function unsaveOpportunity(userId: string, issueId: string): Promise<void> {
  await db
    .delete(savedOpportunities)
    .where(
      and(eq(savedOpportunities.userId, userId), eq(savedOpportunities.issueId, issueId)),
    );
}

export async function isSaved(userId: string, issueId: string): Promise<boolean> {
  const [row] = await db
    .select({ issueId: savedOpportunities.issueId })
    .from(savedOpportunities)
    .where(and(eq(savedOpportunities.userId, userId), eq(savedOpportunities.issueId, issueId)))
    .limit(1);
  return Boolean(row);
}

export interface SavedRow extends FeedRow {
  scoreAtSave: number;
  statusNote: string | null;
  statusChangedAt: Date | null;
}

export async function listSaved(userId: string): Promise<SavedRow[]> {
  const rows = await db
    .select({
      analysis: analyses,
      issue: issues,
      repository: repositories,
      savedAt: savedOpportunities.createdAt,
      scoreAtSave: savedOpportunities.scoreAtSave,
      statusNote: savedOpportunities.statusNote,
      statusChangedAt: savedOpportunities.statusChangedAt,
    })
    .from(savedOpportunities)
    .innerJoin(issues, eq(savedOpportunities.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .innerJoin(
      analyses,
      and(eq(analyses.issueId, issues.id), eq(analyses.userId, userId)),
    )
    .where(eq(savedOpportunities.userId, userId))
    .orderBy(desc(savedOpportunities.createdAt));

  return rows;
}

/** Saved issues the refresh job has not checked recently. */
export async function findSavedNeedingRefresh(
  olderThan: Date,
  limit: number,
): Promise<{ userId: string; issue: IssueRow; repository: RepositoryRow }[]> {
  return db
    .select({
      userId: savedOpportunities.userId,
      issue: issues,
      repository: repositories,
    })
    .from(savedOpportunities)
    .innerJoin(issues, eq(savedOpportunities.issueId, issues.id))
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(
      or(
        isNull(savedOpportunities.lastCheckedAt),
        lt(savedOpportunities.lastCheckedAt, olderThan),
      ),
    )
    .limit(limit);
}

export async function recordSavedStatus(input: {
  userId: string;
  issueId: string;
  statusNote: string | null;
  changed: boolean;
}): Promise<void> {
  await db
    .update(savedOpportunities)
    .set({
      statusNote: input.statusNote,
      lastCheckedAt: new Date(),
      ...(input.changed ? { statusChangedAt: new Date() } : {}),
    })
    .where(
      and(
        eq(savedOpportunities.userId, input.userId),
        eq(savedOpportunities.issueId, input.issueId),
      ),
    );
}

export async function dismissOpportunity(userId: string, issueId: string): Promise<void> {
  await db
    .insert(dismissedOpportunities)
    .values({ userId, issueId })
    .onConflictDoNothing();
}

export async function undismissOpportunity(userId: string, issueId: string): Promise<void> {
  await db
    .delete(dismissedOpportunities)
    .where(
      and(
        eq(dismissedOpportunities.userId, userId),
        eq(dismissedOpportunities.issueId, issueId),
      ),
    );
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function recordEvent(input: {
  userId: string;
  issueId: string | null;
  type: "saved" | "unsaved" | "dismissed" | "undismissed" | "viewed" | "opened";
  technologies?: string[];
  contributionTypes?: ContributionType[];
  difficulty?: Difficulty | null;
  dimensionScores?: Partial<Record<ScoreDimension, number>> | null;
}): Promise<void> {
  await db.insert(userEvents).values({
    userId: input.userId,
    issueId: input.issueId,
    type: input.type,
    technologies: input.technologies ?? [],
    contributionTypes: input.contributionTypes ?? [],
    difficulty: input.difficulty ?? null,
    dimensionScores: input.dimensionScores ?? null,
  });
}

export async function listEvents(userId: string, limit = 300) {
  return db
    .select()
    .from(userEvents)
    .where(eq(userEvents.userId, userId))
    .orderBy(desc(userEvents.createdAt))
    .limit(limit);
}
