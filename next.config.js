/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    if (dev) config.cache = false;
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