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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/admin/relationship-managers",
          destination: "/admin/regional-managers",
        },
        {
          source: "/admin/relationship-managers/:id",
          destination: "/admin/regional-managers/:id",
        },
      ],
      // Let local Next.js route handlers like /api/auth/* resolve first.
      fallback: [
        {
          source: "/api/:path*",
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
