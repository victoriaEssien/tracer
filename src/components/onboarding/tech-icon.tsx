import type { CSSProperties } from "react";

import { TECH_ICONS } from "@/config/tech-icons";
import { cn } from "@/lib/utils";

/**
 * A technology's brand mark, in its own colour.
 *
 * The colour is the point: sixty identical pills are hard to read, and a logo
 * stripped of its colour gives up most of what makes it recognisable at a
 * glance. Both values come pre-adjusted for the background they sit on, since
 * several of these brands are black and would disappear on the dark canvas.
 *
 * On a selected chip the mark takes the chip's own colour instead. A selected
 * chip is already filled with ink, which most brand colours cannot be read
 * against, and by then it is the only chip of its kind that matters.
 *
 * Anything with no mark falls back to its first letter, so a row of chips keeps
 * its rhythm instead of showing a gap where an icon should be.
 */
export function TechIcon({
  name,
  size = 13,
  brand = true,
}: {
  name: string;
  size?: number;
  brand?: boolean;
}) {
  const icon = TECH_ICONS[name.toLowerCase()];

  if (!icon) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center font-mono text-[0.65rem] leading-none opacity-60"
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={cn("shrink-0", brand && "text-(--tech-mark) dark:text-(--tech-mark-dark)")}
      style={
        brand
          ? ({ "--tech-mark": icon.light, "--tech-mark-dark": icon.dark } as CSSProperties)
          : undefined
      }
    >
      <path d={icon.path} />
    </svg>
  );
}
