/**
 * The AI service.
 *
 * Enhances analysis; it is not the product (spec section 16). Everything it
 * produces is returned as `AiInsights`, which the UI renders as inference and
 * keeps visually separate from observed GitHub data. It never overwrites an
 * observed value — note that nothing in this file returns a score, a
 * difficulty, or a verdict.
 */

import { isAiEnabled } from "@/config/env";
import { truncate } from "@/lib/utils";
import type { AiInsights, CollectedIssue, CollectedRepository, OpportunityAnalysis } from "@/types";

import { createOpenAiProvider } from "./openai";
import { disabledProvider, type AiProvider } from "./provider";

export type { AiProvider, AiRequest } from "./provider";
export { disabledProvider } from "./provider";

let cachedProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;
  if (!isAiEnabled()) return disabledProvider;

  cachedProvider = createOpenAiProvider(
    process.env.OPENAI_API_KEY as string,
    process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  );
  return cachedProvider;
}

const SYSTEM_PROMPT = `You help a developer decide how to approach a GitHub issue.

Rules:
- Work only from the issue text and repository facts you are given. Do not invent files, APIs or history.
- Hedge. Say "appears to", "likely", "based on the issue". Never promise how long something will take.
- If the issue does not say enough for a section, return an empty value for it rather than guessing.
- Do not give the issue a score, a difficulty rating or a verdict. That is decided elsewhere.`;

const SCHEMA_HINT = `Respond with JSON only, in this shape:
{
  "summary": string | null,              // 2-3 sentences, plain language
  "difficultyReasoning": string | null,  // why it looks the way it does, hedged
  "likelyFiles": string[],               // paths, only if the issue supports them
  "contributionPlan": string[],          // 3-6 short steps
  "questionsToInvestigate": string[]     // things to verify before starting
}`;

interface AiResponse {
  summary?: string | null;
  difficultyReasoning?: string | null;
  likelyFiles?: unknown;
  contributionPlan?: unknown;
  questionsToInvestigate?: unknown;
}

/**
 * Generates insights for one opportunity. Returns null whenever the AI layer is
 * off or the call fails, and callers carry on without it.
 */
export async function generateInsights(input: {
  repository: CollectedRepository;
  issue: CollectedIssue;
  analysis: OpportunityAnalysis;
  technologies: string[];
}): Promise<AiInsights | null> {
  const provider = getAiProvider();
  if (provider.name === "disabled") return null;

  const response = await provider.complete<AiResponse>({
    system: SYSTEM_PROMPT,
    schemaHint: SCHEMA_HINT,
    prompt: buildPrompt(input),
  });

  if (!response) return null;

  return {
    provider: provider.name,
    model: provider.model,
    generatedAt: new Date().toISOString(),
    summary: asText(response.summary),
    difficultyReasoning: asText(response.difficultyReasoning),
    likelyFiles: asStringArray(response.likelyFiles).slice(0, 6),
    contributionPlan: asStringArray(response.contributionPlan).slice(0, 6),
    questionsToInvestigate: asStringArray(response.questionsToInvestigate).slice(0, 5),
  };
}

function buildPrompt(input: {
  repository: CollectedRepository;
  issue: CollectedIssue;
  analysis: OpportunityAnalysis;
  technologies: string[];
}): string {
  const { repository, issue, analysis, technologies } = input;

  // Maintainer comments carry the most signal per token, so they go in first.
  const comments = issue.comments
    .filter((comment) => comment.body.trim().length > 0)
    .slice(0, 8)
    .map(
      (comment) =>
        `- ${comment.author ?? "unknown"} (${comment.authorAssociation ?? "NONE"}): ${truncate(comment.body, 500)}`,
    )
    .join("\n");

  return [
    `Repository: ${repository.fullName}`,
    `Description: ${repository.description ?? "none"}`,
    `Technologies: ${technologies.join(", ") || "unknown"}`,
    `Observed scope: ${analysis.scope}. Observed clarity: ${analysis.clarity}.`,
    analysis.startingPoints.length
      ? `Files already named in the discussion: ${analysis.startingPoints.map((point) => point.path).join(", ")}`
      : "No files were named in the discussion.",
    "",
    `Issue #${issue.number}: ${issue.title}`,
    `Labels: ${issue.labels.map((label) => label.name).join(", ") || "none"}`,
    "",
    truncate(issue.body ?? "(no description)", 6000),
    "",
    comments ? `Comments:\n${comments}` : "No comments.",
  ].join("\n");
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
