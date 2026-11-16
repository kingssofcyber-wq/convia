
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
