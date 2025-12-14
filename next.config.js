/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-map-gl"],
  turbopack: {
    // Empty turbopack config to silence Turbopack warnings
  },
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
};

module.exports = nextConfig;
