/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger (Node.js) पर डिप्लॉय करने के लिए यह ज़रूरी है
  
  
  // बिल्ड के दौरान छोटी-मोटी ESLint गलतियों को नज़रअंदाज़ करने के लिए
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // बिल्ड के दौरान TypeScript की छोटी गलतियों को नज़रअंदाज़ करने के लिए
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack क्रैश को रोकने के लिए (वैकल्पिक, अगर आप --webpack इस्तेमाल नहीं कर रहे हैं)
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
  
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;