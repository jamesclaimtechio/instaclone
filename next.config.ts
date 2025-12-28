import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions body size limit - must match MAX_FILE_SIZE in lib/image.ts
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public URLs (dev URLs)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // DiceBear avatars (default profile pictures)
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      // Allow any HTTPS image (fallback for custom domains)
      // Remove this in production if you want stricter security
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
