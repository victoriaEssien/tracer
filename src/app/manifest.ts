import type { MetadataRoute } from "next";

import { BRAND, SITE_DESCRIPTION, SITE_NAME } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: find open-source work worth doing`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/feed",
    display: "standalone",
    background_color: BRAND.canvas,
    theme_color: BRAND.canvas,
    // Two files: Android crops a home-screen icon to a circle, so the maskable
    // one keeps the mark inside that safe area instead of running to the edges.
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
