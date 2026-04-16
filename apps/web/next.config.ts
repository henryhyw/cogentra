import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@concentra/ui", "@concentra/schemas", "@concentra/config"],
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
