import type { NextConfig } from "next";

// next-pwa uses webpack; we disable Turbopack for the build and configure it manually
// For development, Turbopack stays on (faster), but production builds use webpack via next-pwa

// Dynamically require next-pwa only in production so dev mode stays fast with Turbopack
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Allow both Turbopack (dev) and Webpack (prod) without errors
  turbopack: {},
};

let exportedConfig: NextConfig;

if (isDev) {
  // In dev: just use plain NextConfig (Turbopack handles it)
  exportedConfig = nextConfig;
} else {
  // In prod: wrap with next-pwa (which injects a webpack plugin for the service worker)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
    fallbacks: {
      document: "/offline",
    },
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "gate-warroom-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  });
  exportedConfig = withPWA(nextConfig);
}

export default exportedConfig;
