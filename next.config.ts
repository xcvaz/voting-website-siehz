
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for GitHub Pages static export
  output: "export",

  // Allow mobile device to access Next.js dev resources
  allowedDevOrigins: ["192.168.1.15"],

  // GitHub Pages does not support Next.js image optimization
  images: {
    unoptimized: true,
  },

  experimental: {
    agentFeedback: true,
  },

  // Keep the existing Turbopack CSS configuration
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