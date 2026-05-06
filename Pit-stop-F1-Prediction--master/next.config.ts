import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shorten the dist directory name to avoid Windows MAX_PATH issues
  distDir: ".x",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
