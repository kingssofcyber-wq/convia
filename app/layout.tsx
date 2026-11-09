import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./adsense-layout.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SitewideAdPlacements } from "@/components/ads/sitewide-ad-placements";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Convia — Every Need, One Place",
  description:
    "PDF tools, loan EMI calculators, insurance estimates, and health utilities — all in one place.",
};

const ADSENSE_SCRIPT_URL =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7776844434912624";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Load the AdSense library once for the entire App Router application. */}
        <script async src={ADSENSE_SCRIPT_URL} crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <SitewideAdPlacements position="top" />
            <main className="min-w-0 flex-1">{children}</main>
            <SitewideAdPlacements position="bottom" />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
