import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Future proofing
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      }
    ],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/actuator/:path*',
        destination: `${apiBase}/actuator/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

// Sentry configuration options
const sentryOptions = {
  org: "nbh-jm",
  project: "javascript-nextjs",

  // An auth token is required for uploading source maps.
  authToken: sentryAuthToken,

  // Keep builds quiet when release upload is not configured.
  silent: true,

  // Forwards certain Sentry config to the client-side
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (not needed for modern apps but default in some configs)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from the client-side build
  hideSourceMaps: true,

};

export default sentryAuthToken ? withSentryConfig(nextConfig, sentryOptions) : nextConfig;
