/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger खुद standalone लागू करता है, लेकिन इसे रखने से कोई नुकसान नहीं
  output: "standalone",
  experimental: {
    // Turbopack के क्रैश को रोकने के लिए (यह सबसे ज़रूरी है)
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
};

export default nextConfig;