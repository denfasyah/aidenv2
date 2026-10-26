import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses browser APIs (DOMMatrix) internally.
  // Mark it as an external package so Next.js loads it natively at runtime
  // instead of trying to bundle/statically analyze it.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
