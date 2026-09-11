import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/event";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Tickets and the admin area must never be indexed.
        disallow: ["/admin", "/admin/", "/api/", "/find"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
