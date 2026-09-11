"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChipPicker } from "@/components/onboarding/chip-picker";
import { Button, Card, SectionHeading, StatusMessage } from "@/components/ui";
import {
  CONTRIBUTION_TYPES,
  EXPERIENCE_LEVELS,
  FRAMEWORKS,
  INTERESTS,
  LANGUAGES,
  TOOLS,
} from "@/config/skills";
import { TIME_COMMITMENT_LABELS } from "@/config/scoring";
import { cn } from "@/lib/utils";
import type {
  ContributionType,
  ExperienceLevel,
  TimeCommitment,
  UserProfile,
} from "@/types";

const TIME_OPTIONS = Object.entries(TIME_COMMITMENT_LABELS) as [TimeCommitment, string][];

export function OnboardingForm({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();

  // Stored skills come back as one flat list, so the catalogs decide which
  // bucket each one is shown in.
  const [languages, setLanguages] = useState<string[]>(
    () => split(profile?.experienced ?? [], LANGUAGES),
  );
  const [frameworks, setFrameworks] = useState<string[]>(
    () => split(profile?.experienced ?? [], FRAMEWORKS),
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

  // Editing an existing profile should not trigger another search.
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
      setErrorMessage("Could not save your profile. Try again.");
      return;
    }

    // A first run needs something in the feed to look at, so discovery starts
    // here rather than waiting for a scheduler. It is deliberately not awaited:
    // a run takes a minute or two, and making someone stare at a disabled
    // button for that long is not a first impression worth having. The feed
    // picks up the `?discovering=1` flag and reports progress there instead.
    void fetch("/api/jobs/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxIssues: 30 }),
    }).catch(() => null);

    router.push(firstRun ? "/feed?discovering=1" : "/feed");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Card className="space-y-6 p-5">
        <SectionHeading hint="Used to match you against a repository's stack">
          What you know
        </SectionHeading>

        <ChipPicker
          label="Languages"
          options={LANGUAGES}
          selected={languages}
          onChange={setLanguages}
        />
        <ChipPicker
          label="Frameworks and libraries"
          options={FRAMEWORKS}
          selected={frameworks}
          onChange={setFrameworks}
        />
        <ChipPicker
          label="Tools and databases"
          options={TOOLS}
          selected={tools}
          onChange={setTools}
        />
      </Card>

      <Card className="space-y-6 p-5">
        <SectionHeading hint="A partial skill match is not penalised as heavily when it matches a goal">
          What you want to learn
        </SectionHeading>

        <ChipPicker
          label="I want to improve"
          options={[...LANGUAGES, ...FRAMEWORKS, "Testing", "Documentation"]}
          selected={learning}
          onChange={setLearning}
        />
        <ChipPicker
          label="Interested in"
          hint="Matched against repository topics"
          options={INTERESTS}
          selected={interests}
          onChange={setInterests}
        />
      </Card>

      <Card className="space-y-6 p-5">
        <SectionHeading>How you want to contribute</SectionHeading>

        <div>
          <p className="mb-2 text-sm font-medium">Contribution types</p>
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
                    "rounded-md border px-3 py-2 text-left transition",
                    active
                      ? "border-ink bg-raised"
                      : "border-line hover:border-ink-faint",
                  )}
                >
                  <span className="block text-sm font-medium">{type.label}</span>
                  <span className="block text-xs text-ink-faint">{type.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Time you can give one contribution</p>
          <div className="flex flex-wrap gap-1.5">
            {TIME_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={timeCommitment === value}
                onClick={() => setTimeCommitment(value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  timeCommitment === value
                    ? "border-transparent bg-ink text-canvas"
                    : "border-line text-ink-soft hover:border-ink-faint hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Experience</p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                aria-pressed={experienceLevel === level.value}
                onClick={() => setExperienceLevel(level.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left transition",
                  experienceLevel === level.value
                    ? "border-ink bg-raised"
                    : "border-line hover:border-ink-faint",
                )}
              >
                <span className="block text-sm font-medium">{level.label}</span>
                <span className="block text-xs text-ink-faint">{level.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={submit}
          disabled={!hasSkills || status !== "idle"}
          className="px-4 py-2"
        >
          {status === "saving" ? "Saving…" : firstRun ? "Save and find opportunities" : "Save changes"}
        </Button>

        {!hasSkills ? (
          <StatusMessage>Pick at least one thing you know.</StatusMessage>
        ) : null}
        {errorMessage ? <StatusMessage tone="bad">{errorMessage}</StatusMessage> : null}
      </div>
    </div>
  );
}

/** Selects the stored skills that belong to one catalog. */
function split(skills: string[], catalog: readonly string[]): string[] {
  return skills.filter((skill) =>
    catalog.some((item) => item.toLowerCase() === skill.toLowerCase()),
  );
}
