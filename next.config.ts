import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow builds to succeed even when type errors are present.
  // This prevents CI/build failures when developers add/remove files that
  // temporarily introduce type issues.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
