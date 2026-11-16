"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ToolHeader } from "@/components/layout/tool-header";
import { resolvePdfToolMetadata } from "@/lib/pdf-tool-metadata";

export function PdfWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/pdf";
  const meta = resolvePdfToolMetadata(pathname);

  return (
    <div className="cv-pdf-workspace-shell" data-cv-pdf-shell="true">
      <ToolHeader
        title={meta.title}
        tagline={meta.tagline}
        description={meta.tagline}
        backHref="/#pdf-tools"
        backLabel="Back to tools"
        className="cv-pdf-layout-header"
      />
      <div className="cv-pdf-route-content" data-tool={meta.slug}>
        {children}
      </div>
    </div>
  );
}
