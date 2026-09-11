import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: there is a package.json in the parent
  // Downloads\Programs folder, and Turbopack warns about the ambiguity.
  turbopack: {
    root: import.meta.dirname,
  },
  // The native Postgres driver must not be bundled into server components.
  serverExternalPackages: ["@prisma/client", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Never let a proxy or browser cache a personal ticket.
        source: "/ticket/:code*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
