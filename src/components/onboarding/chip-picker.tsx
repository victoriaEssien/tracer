"use client";

import { useState } from "react";

import { TechIcon } from "@/components/onboarding/tech-icon";
import { cn } from "@/lib/utils";

/**
 * Multi-select as chips, with a free-text escape hatch.
 *
 * The catalog is a suggestion, not a constraint: someone contributing to a Zig
 * compiler should not be blocked by a list that stops at Rust.
 */
export function ChipPicker({
  label,
  hint,
  options,
  selected,
  onChange,
  allowCustom = true,
  icons = false,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  /** Only where the options are technologies. Subjects have no brand marks. */
  icons?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const addCustom = () => {
    const value = draft.trim();
    if (!value) return;
    if (!selected.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...selected, value]);
    }
    setDraft("");
  };

  const custom = selected.filter(
    (item) => !options.some((option) => option.toLowerCase() === item.toLowerCase()),
  );

  const inputId = `chip-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    // A fieldset rather than a label: these are a group of toggle buttons, and
    // a bare <label> has no control to point at.
    <fieldset className="border-0 p-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <legend className="text-sm font-medium">{label}</legend>
        {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[...options, ...custom].map((option) => {
          const active = selected.some((item) => item.toLowerCase() === option.toLowerCase());
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                active
                  ? "border-transparent bg-ink text-canvas"
                  : "border-line bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
              )}
            >
              {icons ? <TechIcon name={option} /> : null}
              {option}
            </button>
          );
        })}
      </div>

      {allowCustom ? (
        <div className="mt-2 flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Add another {label.toLowerCase()}
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="Something else…"
            className="w-44 rounded-md border border-line bg-surface px-2.5 py-1 text-xs focus:border-ink-faint"
          />
          <button
            type="button"
            onClick={addCustom}
            className="text-xs text-ink-faint transition hover:text-ink"
          >
            Add
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
