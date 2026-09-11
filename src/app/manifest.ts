import type { MetadataRoute } from "next";

import { BRAND, SITE_DESCRIPTION, SITE_NAME } from "@/config/site";

/**
 * The maskable icon is its own file because Android crops to a circle, and the
 * mark has to sit inside that safe area rather than run to the edges.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: find open-source work worth doing`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/feed",
    display: "standalone",
    background_color: BRAND.canvas,
    theme_color: BRAND.canvas,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
