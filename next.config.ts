import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Opt-out of anonymous Next.js telemetry collection
  // (keeps Vercel build logs clean and respects user privacy)
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // unsafe-eval needed by Next.js dev/prod runtime; unsafe-inline for Tailwind JIT
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://vercel.live",
            "font-src 'self' https://fonts.gstatic.com",
            // Gemini API calls originate from the server, but allow here as a belt-and-suspenders
            // in case any client-side fetch ever targets it
            "connect-src 'self' https://generativelanguage.googleapis.com https://vercel.live wss://ws-us3.pusher.com",
            "frame-src https://vercel.live",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
