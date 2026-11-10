import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./convia-design-system.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://convia.saanwariyasethfashion.com";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Convia — Every need, one place", template: "%s | Convia" },
  description: "Practical PDF tools, financial calculators, insurance guides and everyday health utilities in one simple digital workspace.",
  applicationName: "Convia",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Convia", title: "Convia — Every need, one place", description: "PDF tools and useful everyday digital utilities.", url: siteUrl },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f7ff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-7776844434912624";
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="app-root">
            <SiteHeader />
            <main id="main-content" className="app-main">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        {/* Keep exactly one global AdSense loader. If your existing Supabase Ad Manager already loads it, remove this loader instead of duplicating it. */}
        <Script id="convia-adsense-loader" async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} crossOrigin="anonymous" />
      </body>
    </html>
  );
}
