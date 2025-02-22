import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/pg"],
  images: {
    domains: ["i.kym-cdn.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.kym-cdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
