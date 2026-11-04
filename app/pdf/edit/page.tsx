"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// 1. NamahaEditor को Dynamic Import करें ताकि यह सिर्फ ब्राउज़र में लोड हो
const NamahaEditor = dynamic(
  () => import("@namahapdf/react").then((mod) => mod.NamahaEditor),
  { ssr: false }
);

export default function EditPdfPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* हेडर */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center shadow-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-bold text-lg">Edit PDF</span>
        </Link>
      </header>

      {/* एडिटर कंटेनर - इसे पूरी स्क्रीन कवर करनी चाहिए */}
      <div className="flex-1 w-full h-[calc(100vh-65px)] relative">
        <NamahaEditor
          licenseKey="YOUR_LICENSE_KEY_HERE" 
          // अभी के लिए इसे खाली छोड़ सकते हैं, यह वॉटरमार्क के साथ चलेगा
          serverFeatures={false} // चूँकि हमारे पास बैकएंड नहीं है, इसे false रखें
          theme="#6366f1" // हमारी Convia का ब्रांड कलर (Indigo)
          className="w-full h-full"
        />
      </div>
    </div>
  );
}