import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
    // Large JSON bodies (e.g. base64 avatar/cover on PUT /api/auth/profile) can exceed the default ~10MB clone buffer.
    proxyClientMaxBodySize: "32mb",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
