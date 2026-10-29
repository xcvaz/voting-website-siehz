import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <-- Required for GitHub Pages static export
  images: {
    unoptimized: true, // <-- Required since GitHub Pages doesn't support Next.js image optimization servers
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;