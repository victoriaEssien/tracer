import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";

/**
 * Everything behind sign-in is disallowed. It is already unreachable without a
 * session, but a crawler that follows a shared link should not spend its budget
 * collecting sign-in redirects.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/feed", "/saved", "/profile", "/onboarding", "/opportunities/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
