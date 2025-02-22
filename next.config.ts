import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mastra/pg"],
  images: {
    domains: ["i.kym-cdn.com", "knowyourmeme.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.kym-cdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "knowyourmeme.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
