/**
 * What Tracer says about itself to anything that is not a person: search
 * engines, link previews, the sitemap, an installed home-screen icon.
 *
 * Read straight from the environment rather than through `env()`, because
 * metadata is generated during `next build`, where a database URL is not
 * available and must not be required.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "Tracer";

/** Under 160 characters, because that is all a search result will show. */
export const SITE_DESCRIPTION =
  "Tracer scores open-source GitHub issues against what you know and the time you have, tells you which ones are worth taking, and shows its working.";

export const SITE_TAGLINE = "Find open-source issues actually worth your time";

export const REPOSITORY_URL = "https://github.com/victoriaEssien/tracer";

/** Ink and canvas, matching globals.css. Used by the generated images. */
export const BRAND = {
  ink: "#191817",
  canvas: "#faf9f7",
  line: "#e4e1da",
  inkSoft: "#575450",
  accent: "#1b4ea8",
  accentOnInk: "#8fb3ff",
} as const;

/**
 * The mark, as a string, for the image generators. They rasterise rather than
 * render React, so they cannot use the component in `src/components/logo.tsx`.
 */
export function markSvg({
  bar = BRAND.canvas,
  node = BRAND.accentOnInk,
}: { bar?: string; node?: string } = {}): string {
  const rows = [
    { y: 7.4, fill: 13.5, colour: node },
    { y: 14, fill: 9, colour: bar },
    { y: 20.6, fill: 5.5, colour: bar },
  ];

  const tracks = rows
    .map((row) => `<rect x="7" y="${row.y}" width="18" height="4" rx="2" fill="${bar}" opacity="0.22"/>`)
    .join("");
  const fills = rows
    .map((row) => `<rect x="7" y="${row.y}" width="${row.fill}" height="4" rx="2" fill="${row.colour}"/>`)
    .join("");

  // Cropped to the mark, so a caller sizing the image sizes the mark itself.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="7 7.4 18 17.2">${tracks}${fills}</svg>`;
}

/** Satori takes images as data URIs, not as file paths. */
export function markDataUri(colours?: Parameters<typeof markSvg>[0]): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(markSvg(colours))}`;
}

export function canonical(path: string): string {
  return `${SITE_URL}${path}`;
}
