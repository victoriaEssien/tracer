import { TECH_ICON_PATHS } from "@/config/tech-icons";

/**
 * A technology's brand mark, in whatever colour the text around it is.
 *
 * Monochrome on purpose. The problem these solve is sixty pills that look
 * identical, and a shape is enough to fix that; sixty brand colours would
 * replace one kind of overwhelming with another, and colour in this interface
 * means a verdict.
 *
 * Anything with no mark falls back to its first letter, so a row of chips keeps
 * its rhythm instead of showing a gap where an icon should be.
 */
export function TechIcon({ name, size = 13 }: { name: string; size?: number }) {
  const path = TECH_ICON_PATHS[name.toLowerCase()];

  if (!path) {
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
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}
