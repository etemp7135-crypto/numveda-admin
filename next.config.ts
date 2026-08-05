import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large page data
  experimental: {},
  // Server external packages
  serverExternalPackages: ['mongoose'],
};

export default nextConfig;
