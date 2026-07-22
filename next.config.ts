import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare quick tunnels + local preview
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "consequently-expand-celebrate-likes.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
