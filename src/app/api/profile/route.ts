/**
 * GET  /api/profile  — the signed-in user's skills and preferences
 * PUT  /api/profile  — replace them, then re-score the feed
 *
 * Re-scoring on save is not an optimisation detail: skill match, learning value
 * and difficulty fit are all relative to the profile, so an unchanged feed after
 * a profile change would simply be wrong.
 */

import { z } from "zod";

import { json, parseBody, withUser } from "@/lib/api";
import { normalizeInterest, normalizeTechnology } from "@/config/skills";
import { getUserProfile, saveUserProfile } from "@/server/db/queries";
import { reanalyzeAll } from "@/server/opportunities";
import type { UserSkillEntry } from "@/types";

const profileSchema = z.object({
  languages: z.array(z.string().min(1)).max(40).default([]),
  frameworks: z.array(z.string().min(1)).max(40).default([]),
  tools: z.array(z.string().min(1)).max(40).default([]),
  interests: z.array(z.string().min(1)).max(30).default([]),
  learning: z.array(z.string().min(1)).max(30).default([]),
  contributionTypes: z
    .array(z.enum(["features", "bug-fixes", "ui-ux", "documentation", "tests", "tooling"]))
    .default([]),
  timeCommitment: z.enum(["under-2h", "2-5h", "5-10h", "10h-plus"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

export async function GET() {
  return withUser(async (userId) => {
    const profile = await getUserProfile(userId);
    return json({ profile });
  });
}

export async function PUT(request: Request) {
  return withUser(async (userId) => {
    const parsed = await parseBody(request, profileSchema);
    if ("response" in parsed) return parsed.response;

    const input = parsed.data;

    // One flat skill list: the split between languages, frameworks and tools is
    // an onboarding affordance, not something the scorer cares about.
    const experienced: UserSkillEntry[] = [
      ...input.languages,
      ...input.frameworks,
      ...input.tools,
    ].map((skill) => ({ skill: normalizeTechnology(skill), type: "experienced" as const }));

    const learning: UserSkillEntry[] = input.learning.map((skill) => ({
      skill: normalizeTechnology(skill),
      type: "learning" as const,
    }));

    const interests: UserSkillEntry[] = input.interests.map((interest) => ({
      skill: normalizeInterest(interest) ?? interest,
      type: "interested" as const,
    }));

    await saveUserProfile(userId, {
      skills: [...experienced, ...learning, ...interests],
      contributionTypes: input.contributionTypes,
      timeCommitment: input.timeCommitment,
      experienceLevel: input.experienceLevel,
      markOnboarded: true,
    });

    const rescored = await reanalyzeAll(userId);

    return json({ profile: await getUserProfile(userId), rescored });
  });
}
