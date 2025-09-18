/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Optimize specific packages for better performance
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
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
