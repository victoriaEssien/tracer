/**
 * The personal learning loop.
 *
 * Simple rules, not machine learning (spec section 14). Saves pull a weight up,
 * dismissals push it down, and every adjustment is clamped and renormalised so
 * one afternoon of browsing cannot rewrite someone's scoring model.
 *
 * The loop returns *why* it adjusted, so the profile page can show the user
 * what the system thinks it has learned about them — an opaque personalisation
 * layer would undercut the whole point of publishing the methodology.
 */

import { DIMENSION_LABELS, DIMENSION_WEIGHTS, LEARNING_LOOP } from "@/config/scoring";
import { clamp, daysSince } from "@/lib/utils";
import type { ContributionType, Difficulty, ScoreDimension } from "@/types";

import { normalizeWeights, type Weights } from "./score";

export interface LearningEvent {
  type: "saved" | "unsaved" | "dismissed" | "undismissed" | "viewed" | "opened";
  technologies: string[];
  contributionTypes: ContributionType[];
  difficulty: Difficulty | null;
  dimensionScores: Partial<Record<ScoreDimension, number>> | null;
  createdAt: Date;
}

export interface LearnedPreferences {
  weights: Weights;
  /** Human-readable summary of what the loop has picked up. May be empty. */
  observations: string[];
  /** Technologies that keep showing up in saves. */
  favouredTechnologies: string[];
  /** Difficulty level the user actually saves, which is often not the stated one. */
  favouredDifficulty: Difficulty | null;
  eventsConsidered: number;
}

export function learnPreferences(events: LearningEvent[]): LearnedPreferences {
  const recent = events.filter(
    (event) => daysSince(event.createdAt) <= LEARNING_LOOP.windowDays,
  );

  const decisive = recent.filter(
    (event) => event.type === "saved" || event.type === "dismissed",
  );

  if (decisive.length < LEARNING_LOOP.minEvents) {
    return {
      weights: { ...DIMENSION_WEIGHTS },
      observations: [],
      favouredTechnologies: [],
      favouredDifficulty: null,
      eventsConsidered: decisive.length,
    };
  }

  const adjustments = {} as Record<ScoreDimension, number>;
  for (const dimension of Object.keys(DIMENSION_WEIGHTS) as ScoreDimension[]) {
    adjustments[dimension] = 0;
  }

  /**
   * A dimension that scored high on things the user saved is a dimension the
   * user cares about; one that scored high on things they dismissed is not.
   */
  for (const event of decisive) {
    if (!event.dimensionScores) continue;
    const step =
      event.type === "saved" ? LEARNING_LOOP.savedWeightStep : -LEARNING_LOOP.dismissedWeightStep;

    for (const [dimension, score] of Object.entries(event.dimensionScores) as [
      ScoreDimension,
      number,
    ][]) {
      if (!(dimension in adjustments)) continue;
      // Centred on 0.5: only unusually strong or weak dimensions move a weight.
      adjustments[dimension] += step * (score - 0.5) * 2;
    }
  }

  const weights = {} as Weights;
  const observations: string[] = [];

  for (const dimension of Object.keys(DIMENSION_WEIGHTS) as ScoreDimension[]) {
    const adjustment = clamp(
      adjustments[dimension],
      -LEARNING_LOOP.maxAdjustment,
      LEARNING_LOOP.maxAdjustment,
    );
    weights[dimension] = Math.max(0.01, DIMENSION_WEIGHTS[dimension] + adjustment);

    if (Math.abs(adjustment) >= LEARNING_LOOP.maxAdjustment * 0.6) {
      observations.push(
        adjustment > 0
          ? `${DIMENSION_LABELS[dimension]} counts for a little more than default, because it is high on the issues you save`
          : `${DIMENSION_LABELS[dimension]} counts for a little less than default, based on what you have dismissed`,
      );
    }
  }

  const favouredTechnologies = countFavoured(decisive);
  if (favouredTechnologies.length > 0) {
    observations.push(`You keep saving ${favouredTechnologies.slice(0, 3).join(", ")} issues`);
  }

  const favouredDifficulty = mostSavedDifficulty(decisive);
  if (favouredDifficulty) {
    observations.push(`Most of what you save is estimated as ${favouredDifficulty}`);
  }

  return {
    weights: normalizeWeights(weights),
    observations,
    favouredTechnologies,
    favouredDifficulty,
    eventsConsidered: decisive.length,
  };
}

function countFavoured(events: LearningEvent[]): string[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "saved") continue;
    for (const technology of event.technologies) {
      counts.set(technology, (counts.get(technology) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= LEARNING_LOOP.minSavesPerTechnology)
    .sort((a, b) => b[1] - a[1])
    .map(([technology]) => technology);
}

function mostSavedDifficulty(events: LearningEvent[]): Difficulty | null {
  const counts = new Map<Difficulty, number>();
  for (const event of events) {
    if (event.type !== "saved" || !event.difficulty) continue;
    counts.set(event.difficulty, (counts.get(event.difficulty) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [top] = ranked;
  if (!top || top[1] < LEARNING_LOOP.minSavesPerTechnology) return null;
  return top[0];
}
