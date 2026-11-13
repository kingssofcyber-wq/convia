/** @type {import('next').NextConfig} */

const nextConfig = {
  serverExternalPackages: ["pptxgenjs"],
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;