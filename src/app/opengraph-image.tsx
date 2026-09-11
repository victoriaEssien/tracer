import { ImageResponse } from "next/og";

import { BRAND, SITE_TAGLINE, markDataUri } from "@/config/site";

export const alt = `Tracer · ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The link preview. The three verdicts along the bottom are the product's
 * actual vocabulary, so a shared link shows what Tracer does rather than a
 * logo on a colour field.
 */
const VERDICTS = [
  { score: "79", label: "Take it", colour: "#1a6b3c" },
  { score: "58", label: "Worth a look", colour: "#8a5410" },
  { score: "19", label: "Skip it", colour: "#9c3025" },
];

/**
 * The interface's own face, fetched rather than imported: this renders to a
 * bitmap outside React and cannot reach what `next/font` self-hosts. No
 * `User-Agent` is sent deliberately, because Google then answers with
 * TrueType, and the rasteriser cannot read the woff2 a browser would get.
 */
async function instrumentSans(weight: 400 | 600): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@${weight}`,
    ).then((response) => response.text());

    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;

    return await fetch(url).then((response) => response.arrayBuffer());
  } catch {
    // A preview in the fallback face beats a build that fails over a picture.
    return null;
  }
}

export default async function OpengraphImage() {
  const [regular, semibold] = await Promise.all([instrumentSans(400), instrumentSans(600)]);
  const fonts = [
    regular && { name: "Instrument Sans", data: regular, weight: 400 as const },
    semibold && { name: "Instrument Sans", data: semibold, weight: 600 as const },
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BRAND.canvas,
          color: BRAND.ink,
          padding: "68px 76px",
          fontFamily: "Instrument Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={markDataUri({ bar: BRAND.ink, node: BRAND.accent })}
            alt=""
            width={34}
            height={33}
          />
          <div style={{ fontSize: 31, fontWeight: 600, letterSpacing: "-0.02em" }}>tracer</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: BRAND.inkSoft,
              maxWidth: 780,
            }}
          >
            Scored against what you know and the time you have, with the reasoning on screen.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 52,
            borderTop: `2px solid ${BRAND.line}`,
            paddingTop: 32,
          }}
        >
          {VERDICTS.map((verdict) => (
            <div key={verdict.label} style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
              <div style={{ fontSize: 46, fontWeight: 600, color: verdict.colour }}>
                {verdict.score}
              </div>
              <div style={{ fontSize: 26, color: BRAND.inkSoft }}>{verdict.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
