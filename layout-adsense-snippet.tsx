// Keep this script exactly once in app/layout.tsx.
import Script from "next/script";

// Place inside RootLayout (do not duplicate it in individual pages):
<Script
  id="google-adsense"
  async
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7776844434912624"
  crossOrigin="anonymous"
/>
