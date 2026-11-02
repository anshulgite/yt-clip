import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["archiver", "fluent-ffmpeg"],
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
