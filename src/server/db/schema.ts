/**
 * Database schema (PostgreSQL, hosted on Neon).
 *
 * Two groups of tables live here:
 *
 * 1. The Auth.js tables (`user`, `account`, `session`, `verificationToken`),
 *    whose column names are dictated by the Drizzle adapter.
 * 2. Tracer's own entities from spec section 19, plus the tables the personal
 *    learning loop and the saved-opportunity refresh job need.
 *
 * Collected GitHub data and computed analyses are both cached here so a
 * recommendation can be explained later without recomputing it.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

import type {
  AiInsights,
  CollectedIssueComment,
  CollectedIssueLabel,
  ContributionType,
  Difficulty,
  ExperienceLevel,
  IssueAvailability,
  LinkedPullRequest,
  RepositoryActivity,
  Scope,
  ScoreBreakdownEntry,
  ScoreDimension,
  SkillType,
  StartingPoint,
  TimeCommitment,
  Verdict,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Auth.js                                                                    */
/* -------------------------------------------------------------------------- */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** GitHub identity, copied out of the OAuth profile on sign-in. */
  githubId: text("github_id"),
  githubLogin: text("github_login"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export const profiles = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  contributionTypes: jsonb("contribution_types").$type<ContributionType[]>().notNull().default([]),
  timeCommitment: text("time_commitment").$type<TimeCommitment>().notNull().default("2-5h"),
  experienceLevel: text("experience_level")
    .$type<ExperienceLevel>()
    .notNull()
    .default("intermediate"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per (skill, relationship). A user can be experienced with TypeScript
 * and still be learning it — those are two rows and they score differently.
 */
export const userSkills = pgTable(
  "user_skill",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    type: text("type").$type<SkillType>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_skill_unique").on(table.userId, table.skill, table.type),
    index("user_skill_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Collected GitHub data                                                      */
/* -------------------------------------------------------------------------- */

export const repositories = pgTable(
  "repository",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    githubId: integer("github_id").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    htmlUrl: text("html_url").notNull(),
    primaryLanguage: text("primary_language"),
    languages: jsonb("languages").$type<Record<string, number>>().notNull().default({}),
    topics: jsonb("topics").$type<string[]>().notNull().default([]),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    openIssues: integer("open_issues").notNull().default(0),
    license: text("license"),
    isArchived: boolean("is_archived").notNull().default(false),
    isFork: boolean("is_fork").notNull().default(false),
    hasContributingGuide: boolean("has_contributing_guide").notNull().default(false),
    /** Commit, release, PR and contributor counts. See `RepositoryActivity`. */
    activity: jsonb("activity").$type<RepositoryActivity | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    pushedAt: timestamp("pushed_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("repository_github_id_unique").on(table.githubId),
    uniqueIndex("repository_full_name_unique").on(table.fullName),
    index("repository_language_idx").on(table.primaryLanguage),
  ],
);

export const issues = pgTable(
  "issue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    githubId: integer("github_id").notNull(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    htmlUrl: text("html_url").notNull(),
    labels: jsonb("labels").$type<CollectedIssueLabel[]>().notNull().default([]),
    state: text("state").$type<"open" | "closed">().notNull().default("open"),
    author: text("author"),
    authorAssociation: text("author_association"),
    assignees: jsonb("assignees").$type<string[]>().notNull().default([]),
    commentCount: integer("comment_count").notNull().default(0),
    reactionCount: integer("reaction_count").notNull().default(0),
    comments: jsonb("comments").$type<CollectedIssueComment[]>().notNull().default([]),
    linkedPullRequests: jsonb("linked_pull_requests")
      .$type<LinkedPullRequest[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("issue_github_id_unique").on(table.githubId),
    index("issue_repository_idx").on(table.repositoryId),
    index("issue_state_idx").on(table.state),
  ],
);

/* -------------------------------------------------------------------------- */
/* Analysis and recommendations                                               */
/* -------------------------------------------------------------------------- */

/**
 * A stored analysis. Scoped to a user because half the dimensions (skill match,
 * learning value, difficulty fit) only mean something relative to a profile.
 *
 * `breakdown` keeps the reasoning that produced the score, so the explanation
 * survives a weight change and never has to be reconstructed.
 */
export const analyses = pgTable(
  "analysis",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    overallScore: real("overall_score").notNull(),
    verdict: text("verdict").$type<Verdict>().notNull(),
    summary: text("summary").notNull(),
    difficulty: text("difficulty").$type<Difficulty>().notNull(),
    scope: text("scope").$type<Scope>().notNull(),
    availability: text("availability").$type<IssueAvailability>().notNull(),
    estimatedHoursMin: real("estimated_hours_min"),
    estimatedHoursMax: real("estimated_hours_max"),
    /** Per-dimension scores, weights and reasoning. */
    breakdown: jsonb("breakdown").$type<ScoreBreakdownEntry[]>().notNull().default([]),
    positives: jsonb("positives").$type<string[]>().notNull().default([]),
    concerns: jsonb("concerns").$type<string[]>().notNull().default([]),
    technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
    startingPoints: jsonb("starting_points").$type<StartingPoint[]>().notNull().default([]),
    /** Null whenever the AI layer is disabled or failed. Never merged in. */
    ai: jsonb("ai").$type<AiInsights | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("analysis_issue_user_unique").on(table.issueId, table.userId),
    index("analysis_user_score_idx").on(table.userId, table.overallScore),
  ],
);

/* -------------------------------------------------------------------------- */
/* User actions                                                               */
/* -------------------------------------------------------------------------- */

export const savedOpportunities = pgTable(
  "saved_opportunity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    /** The score at the moment of saving, so drift is visible later. */
    scoreAtSave: real("score_at_save").notNull(),
    /** Set by the refresh job: "now has an open PR", "was assigned", ... */
    statusNote: text("status_note"),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.issueId] }),
    index("saved_opportunity_user_idx").on(table.userId),
  ],
);

export const dismissedOpportunities = pgTable(
  "dismissed_opportunity",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.issueId] })],
);

/**
 * The raw material for the personal learning loop (spec section 14). Every save,
 * dismissal and view is recorded with the characteristics of the issue, so the
 * loop can adjust weights without re-reading every analysis.
 */
export const userEvents = pgTable(
  "user_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id, { onDelete: "set null" }),
    type: text("type").$type<"saved" | "unsaved" | "dismissed" | "viewed" | "opened">().notNull(),
    technologies: jsonb("technologies").$type<string[]>().notNull().default([]),
    contributionTypes: jsonb("contribution_types").$type<ContributionType[]>().notNull().default([]),
    difficulty: text("difficulty").$type<Difficulty>(),
    /** Dimension scores at the time of the action, for weight nudging. */
    dimensionScores: jsonb("dimension_scores").$type<Partial<Record<ScoreDimension, number>>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_event_user_idx").on(table.userId, table.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Row types                                                                  */
/* -------------------------------------------------------------------------- */

export type UserRow = typeof users.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type UserSkillRow = typeof userSkills.$inferSelect;
export type RepositoryRow = typeof repositories.$inferSelect;
export type IssueRow = typeof issues.$inferSelect;
export type AnalysisRow = typeof analyses.$inferSelect;
export type SavedOpportunityRow = typeof savedOpportunities.$inferSelect;
export type UserEventRow = typeof userEvents.$inferSelect;
