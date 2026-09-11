"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChipPicker } from "@/components/onboarding/chip-picker";
import { Button, Panel, StatusMessage } from "@/components/ui";
import { TIME_COMMITMENT_LABELS } from "@/config/scoring";
import {
  CONTRIBUTION_TYPES,
  EXPERIENCE_LEVELS,
  FRAMEWORKS,
  INTERESTS,
  LANGUAGES,
  TOOLS,
} from "@/config/skills";
import { cn } from "@/lib/utils";
import type { ContributionType, ExperienceLevel, TimeCommitment, UserProfile } from "@/types";

const TIME_OPTIONS = Object.entries(TIME_COMMITMENT_LABELS) as [TimeCommitment, string][];

export function OnboardingForm({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();

  // Stored skills come back as one flat list, so the catalogs decide which
  // bucket each one is shown in.
  const [languages, setLanguages] = useState<string[]>(() =>
    split(profile?.experienced ?? [], LANGUAGES),
  );
  const [frameworks, setFrameworks] = useState<string[]>(() =>
    split(profile?.experienced ?? [], FRAMEWORKS),
  );
  const [tools, setTools] = useState<string[]>(() => {
    const known = [...LANGUAGES, ...FRAMEWORKS] as readonly string[];
    return (profile?.experienced ?? []).filter(
      (skill) => !known.some((item) => item.toLowerCase() === skill.toLowerCase()),
    );
  });
  const [learning, setLearning] = useState<string[]>(profile?.learning ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>(
    profile?.contributionTypes ?? ["bug-fixes", "features"],
  );
  const [timeCommitment, setTimeCommitment] = useState<TimeCommitment>(
    profile?.timeCommitment ?? "2-5h",
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experienceLevel ?? "intermediate",
  );

  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editing an existing profile should not kick off another search.
  const firstRun = profile?.onboardedAt == null;
  const hasSkills = languages.length + frameworks.length + tools.length > 0;

  async function submit() {
    setErrorMessage(null);
    setStatus("saving");

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languages,
        frameworks,
        tools,
        interests,
        learning,
        contributionTypes,
        timeCommitment,
        experienceLevel,
      }),
    });

    if (!response.ok) {
      setStatus("idle");
      setErrorMessage("That did not save. Try again.");
      return;
    }

    // The queue starts and owns the first run, so progress has one reporter and
    // leaving this page cannot orphan a request nobody is listening to.
    router.push(firstRun ? "/feed?discovering=1" : "/feed");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <Panel title="What you know" hint="matched against a repository's stack">
        <div className="space-y-6">
          <ChipPicker
            label="Languages"
            options={LANGUAGES}
            selected={languages}
            onChange={setLanguages}
            icons
          />
          <ChipPicker
            label="Frameworks and libraries"
            options={FRAMEWORKS}
            selected={frameworks}
            onChange={setFrameworks}
            icons
          />
          <ChipPicker
            label="Tools and databases"
            options={TOOLS}
            selected={tools}
            onChange={setTools}
            icons
          />
        </div>
      </Panel>

      <Panel title="What you want to learn" hint="a skill gap you chose costs you less">
        <div className="space-y-6">
          <ChipPicker
            label="I want to get better at"
            options={[...LANGUAGES, ...FRAMEWORKS, "Testing", "Documentation"]}
            selected={learning}
            onChange={setLearning}
            icons
          />
          <ChipPicker
            label="Subjects I care about"
            hint="matched against repository topics"
            options={INTERESTS}
            selected={interests}
            onChange={setInterests}
          />
        </div>
      </Panel>

      <Panel title="How you want to work">
        <div className="space-y-7">
          <fieldset className="border-0 p-0">
            <legend className="mb-2.5 text-sm font-medium">Kinds of contribution</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CONTRIBUTION_TYPES.map((type) => {
                const active = contributionTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setContributionTypes((current) =>
                        current.includes(type.value)
                          ? current.filter((item) => item !== type.value)
                          : [...current, type.value],
                      )
                    }
                    className={cn(
                      "rounded-md border px-3 py-2 text-left transition-colors duration-100",
                      active
                        ? "border-ink bg-raised"
                        : "border-line hover:border-line-strong hover:bg-raised/50",
                    )}
                  >
                    <span className="block text-sm font-medium">{type.label}</span>
                    <span className="block text-xs text-ink-faint">{type.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="mb-2.5 text-sm font-medium">
              Time you can give one contribution
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={timeCommitment === value}
                  onClick={() => setTimeCommitment(value)}
                  className={cn(
                    "rounded border px-2.5 py-1 text-xs font-medium transition-colors duration-100",
                    timeCommitment === value
                      ? "border-transparent bg-ink text-canvas"
                      : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="mb-2.5 text-sm font-medium">How you feel about strange code</legend>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  aria-pressed={experienceLevel === level.value}
                  onClick={() => setExperienceLevel(level.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left transition-colors duration-100",
                    experienceLevel === level.value
                      ? "border-ink bg-raised"
                      : "border-line hover:border-line-strong hover:bg-raised/50",
                  )}
                >
                  <span className="block text-sm font-medium">{level.label}</span>
                  <span className="block text-xs text-ink-faint">{level.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button
          variant="primary"
          onClick={submit}
          disabled={!hasSkills || status !== "idle"}
          className="px-4 py-2"
        >
          {status === "saving" ? "Saving" : firstRun ? "Save and find me work" : "Save changes"}
        </Button>

        {!hasSkills ? <StatusMessage>Pick at least one thing you know.</StatusMessage> : null}
        {errorMessage ? <StatusMessage tone="bad">{errorMessage}</StatusMessage> : null}
      </div>
    </div>
  );
}

/** Selects the stored skills that belong to one catalog. */
function split(skills: string[], catalog: readonly string[]): string[] {
  return skills.filter((skill) => catalog.some((item) => item.toLowerCase() === skill.toLowerCase()));
}
