"use client";

import { Check, Search, X } from "lucide-react";
import { useState } from "react";

import { Chip, ScoreMeter } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

/**
 * The hero demonstration: the same six issues, before and after.
 *
 * Off is what a search gives you, where every row looks identical and the only
 * thing to go on is a label. On is the real product UI, built from the same
 * components the app uses, so it cannot drift away from what people actually
 * get. Switching between them is the whole pitch in one control.
 */

const RAW = [
  { title: "Add a dark mode toggle to the settings panel", repo: "acme/design-system", labels: ["good first issue", "help wanted"] },
  { title: "Make the right sidebar resizable, like the left one", repo: "openstreetmap/iD", labels: ["help wanted"] },
  { title: "Update the installation guide for the new CLI", repo: "acme/cli", labels: ["good first issue", "documentation"] },
  { title: "Fix toolbar icon alignment on Safari", repo: "acme/toolbar", labels: ["good first issue", "bug"] },
  { title: "Improve error message when config is missing", repo: "acme/runtime", labels: ["good first issue"] },
  { title: "Add tests for the pagination helper", repo: "acme/utils", labels: ["help wanted", "tests"] },
];

const SCORED: {
  title: string;
  repo: string;
  score: number;
  verdict: Verdict;
  note: string;
  tech: string[];
}[] = [
  {
    title: "Make the right sidebar resizable, like the left one",
    repo: "openstreetmap/iD",
    score: 79,
    verdict: "recommended",
    note: "Your stack, nobody assigned, maintainers active this week",
    tech: ["JavaScript", "3-10 hours"],
  },
  {
    title: "Improve error message when config is missing",
    repo: "acme/runtime",
    score: 71,
    verdict: "recommended",
    note: "Small and self-contained, and the issue says what finished looks like",
    tech: ["TypeScript", "1-3 hours"],
  },
  {
    title: "Add tests for the pagination helper",
    repo: "acme/utils",
    score: 58,
    verdict: "possible",
    note: "Good practice, but outside pull requests have not merged in 90 days",
    tech: ["TypeScript", "2-5 hours"],
  },
  {
    title: "Add a dark mode toggle to the settings panel",
    repo: "acme/design-system",
    score: 31,
    verdict: "not-recommended",
    note: "Someone called it in the comments eight months ago",
    tech: [],
  },
  {
    title: "Update the installation guide for the new CLI",
    repo: "acme/cli",
    score: 24,
    verdict: "not-recommended",
    note: "A linked pull request already merged. The issue was never closed",
    tech: [],
  },
  {
    title: "Fix toolbar icon alignment on Safari",
    repo: "acme/toolbar",
    score: 19,
    verdict: "not-recommended",
    note: "Open since 2017, no comment since 2019",
    tech: [],
  },
];

export function HeroDemo() {
  const [on, setOn] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-medium">
          {on ? "1,247,983 issues, ranked for you" : "1,247,983 issues, all identical"}
        </p>

        <div
          role="group"
          aria-label="Compare searching GitHub with using Tracer"
          className="flex rounded-lg bg-raised p-0.5"
        >
          {[
            { value: false, label: "Without Tracer" },
            { value: true, label: "With Tracer" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setOn(option.value)}
              aria-pressed={on === option.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                on === option.value
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {on ? <ScoredList /> : <RawList />}

        {/* The list continues past the frame either way; the difference is
            whether continuing is a chore or unnecessary. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent"
        />
      </div>

      <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
        {on
          ? "Three of these are worth your time. Tracer says which, and why."
          : "Same six issues. Which one is worth your Saturday?"}
      </p>
    </div>
  );
}

function RawList() {
  return (
    <ul className="divide-y divide-line">
      {RAW.map((item) => (
        <li key={item.title} className="flex items-start gap-3 px-4 py-3.5">
          <Search size={14} strokeWidth={2} aria-hidden className="mt-1 shrink-0 text-ink-faint" />
          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium text-ink-soft">{item.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-ink-faint">{item.repo}</span>
              {item.labels.map((label) => (
                <Chip key={label} className="opacity-70">
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScoredList() {
  return (
    <ul className="divide-y divide-line">
      {SCORED.map((item, index) => {
        const skip = item.verdict === "not-recommended";
        return (
          <li
            key={item.title}
            className={cn("flex items-start gap-3.5 px-4 py-3.5", skip && "bg-raised/45")}
          >
            <div className={cn("shrink-0", skip && "opacity-55")}>
              <ScoreMeter
                value={item.score}
                verdict={item.verdict}
                animate
                delayMs={index * 45}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-snug font-medium",
                  skip ? "text-ink-faint" : "text-ink",
                )}
              >
                {item.title}
              </p>
              <p className="mt-1 font-mono text-xs text-ink-faint">{item.repo}</p>

              <div className="mt-2 flex items-start gap-2">
                {skip ? (
                  <X size={13} strokeWidth={2.5} aria-hidden className="mt-0.5 shrink-0 text-bad" />
                ) : (
                  <Check
                    size={13}
                    strokeWidth={2.5}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-good"
                  />
                )}
                <p className="text-xs leading-relaxed text-ink-soft">{item.note}</p>
              </div>

              {item.tech.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tech.map((tech) => (
                    <Chip key={tech}>{tech}</Chip>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
