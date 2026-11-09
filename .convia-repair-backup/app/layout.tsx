import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const SITE_URL = "https://convia.saanwariyasethfashion.com";
const ADSENSE_CLIENT_ID = "ca-pub-7776844434912624";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Convia — Every Need, One Place",
    template: "%s | Convia",
  },
  description: "Useful PDF tools, practical financial calculators, insurance information and everyday wellness utilities in one workspace.",
  applicationName: "Convia",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Convia",
    title: "Convia — Every Need, One Place",
    description: "PDF tools and everyday digital utilities in one workspace.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="min-w-0 flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        {/* Load the AdSense library once for the whole App Router application. */}
        <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
