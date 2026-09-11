import type { MetadataRoute } from "next";

import { canonical } from "@/config/site";

/** Only the four pages a signed-out visitor can actually read. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: canonical("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: canonical("/resources"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: canonical("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: canonical("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
