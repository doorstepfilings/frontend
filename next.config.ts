import type { NextConfig } from "next";
import path from "node:path";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return {
      // Let local Next.js route handlers like /api/auth/* resolve first.
      fallback: [
        {
          source: "/api/:path((?!auth(?:/|$)).*)",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/storage/:path*",
          destination: `${backendUrl}/storage/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
