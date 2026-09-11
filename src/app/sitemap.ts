import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/event";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/register`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
