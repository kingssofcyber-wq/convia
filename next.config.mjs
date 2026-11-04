/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads", // यह बिल्ड क्रैश से बचाएगा[reference:3]
  },
};

export default nextConfig;