import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convia AdSense Manager",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdsAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
