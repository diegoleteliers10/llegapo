/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-map-gl"],
  turbopack: {
    // Empty turbopack config to silence Turbopack warnings
  },
};

module.exports = nextConfig;
