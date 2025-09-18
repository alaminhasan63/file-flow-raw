/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable some experimental features that might cause issues
    optimizePackageImports: false,
  },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
      // Add more specific cache configuration
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.next/**"],
      };
    }
    config.ignoreWarnings = [
      (warn) =>
        typeof warn.message === "string" &&
        warn.message.includes("Critical dependency") &&
        /@supabase\/realtime-js/.test(warn.module?.resource || ""),
    ];
    return config;
  },
};
module.exports = nextConfig;
