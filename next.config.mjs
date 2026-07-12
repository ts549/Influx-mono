/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // These packages ship native binaries or resolve paths via __dirname at
  // import time. Bundling them into .next/server/ breaks the binary lookup,
  // so keep them external and load them from node_modules at runtime.
  serverExternalPackages: ["ffmpeg-static", "puppeteer"],
};

export default nextConfig;
