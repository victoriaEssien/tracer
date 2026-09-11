import { cn } from "@/lib/utils";

/**
 * The mark: three score meters, ranked, the top one picked out.
 *
 * The product's own instrument rather than an invented symbol. A queue is a
 * column of tracks with a score filled into each, the best sits at the top,
 * and the accent marks the one worth taking.
 */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {[
        { y: 4.8, fill: 13.5, accent: true },
        { y: 10.3, fill: 9 },
        { y: 15.8, fill: 5.5 },
      ].map((row) => (
        <g key={row.y}>
          <rect x="3" y={row.y} width="18" height="3.4" rx="1.7" fill="currentColor" opacity="0.16" />
          <rect
            x="3"
            y={row.y}
            width={row.fill}
            height="3.4"
            rx="1.7"
            fill={row.accent ? "var(--accent)" : "currentColor"}
          />
        </g>
      ))}
    </svg>
  );
}

