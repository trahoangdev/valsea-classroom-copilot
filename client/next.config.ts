import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const deployBasePath =
  (process.env.BASENAME || "").replace(/\/$/, "") || undefined;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  ...(isStaticExport && deployBasePath
    ? { basePath: deployBasePath, assetPrefix: `${deployBasePath}/` }
    : {}),
  ...(isStaticExport ? { output: "export" as const } : {}),
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  ...(!isStaticExport
    ? {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "X-Frame-Options",
                  value: "DENY",
                },
                {
                  key: "X-Content-Type-Options",
                  value: "nosniff",
                },
                {
                  key: "Referrer-Policy",
                  value: "origin-when-cross-origin",
                },
              ],
            },
          ];
        },
        async redirects() {
          return [
            {
              source: "/home",
              destination: "/classroom-copilot",
              permanent: true,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
