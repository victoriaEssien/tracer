import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Whole days between `from` and now. Negative values are clamped to 0. */
export function daysSince(from: string | Date | null | undefined, now = new Date()): number {
  if (!from) return Number.POSITIVE_INFINITY;
  const then = typeof from === "string" ? new Date(from) : from;
  const ms = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function hoursBetween(from: string | Date, to: string | Date): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return (b.getTime() - a.getTime()) / 3_600_000;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Maps a value onto 0-1 with a soft ceiling: `full` scores 1, half of `full`
 * scores ~0.5, and anything above `full` stays at 1.
 */
export function ratio(value: number, full: number): number {
  if (full <= 0) return 0;
  return clamp(value / full);
}

/** "3 days ago", "in 2 months". Deliberately coarse. */
export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return "unknown";
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return "just now";
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** "2-5 hours", hedged. Time is always an estimate (spec section 3.4). */
export function formatHours(estimate: { min: number; max: number } | null): string {
  if (!estimate) return "Unclear";
  if (estimate.min === estimate.max) return `~${estimate.max} hours`;
  if (estimate.max >= 40) return `${estimate.min}+ hours`;
  return `${estimate.min}-${estimate.max} hours`;
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Case-insensitive set intersection that preserves the casing of `a`. */
export function intersect(a: string[], b: string[]): string[] {
  const lowered = new Set(b.map((value) => value.toLowerCase()));
  return a.filter((value) => lowered.has(value.toLowerCase()));
}

/** Everything in `a` that is not in `b`, case-insensitively. */
export function difference(a: string[], b: string[]): string[] {
  const lowered = new Set(b.map((value) => value.toLowerCase()));
  return a.filter((value) => !lowered.has(value.toLowerCase()));
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/** Truncates on a word boundary, for prompts and previews. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const cut = value.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}
