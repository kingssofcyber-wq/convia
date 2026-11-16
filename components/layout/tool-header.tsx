"use client";

import Link from "next/link";
import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { getPdfToolTagline } from "@/lib/pdf-tool-metadata";

type ToolHeaderProps = {
  title: string;
  description?: string;
  tagline?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

/** Shared premium header. Under /pdf, the PDF route layout provides the single global instance. */
export function ToolHeader({
  title,
  description = "",
  tagline,
  eyebrow = "CONVIA PDF WORKSPACE",
  icon: ToolIcon = FileText,
  backHref = "/#pdf-tools",
  backLabel = "Back to tools",
  className = "",
}: ToolHeaderProps) {
  const line = tagline?.trim() || getPdfToolTagline(title) || description.trim() || "A focused workspace to get more done with your PDF.";
  const titleId = useId();

  return (
    <section className={`cv-tool-header ${className}`.trim()} aria-labelledby={titleId}>
      <div className="cv-tool-header-glow cv-tool-header-glow-a" aria-hidden="true" />
      <div className="cv-tool-header-glow cv-tool-header-glow-b" aria-hidden="true" />
      <div className="cv-tool-header-grid" aria-hidden="true" />
      <div className="cv-tool-header-inner">
        <div className="cv-tool-header-copy">
          <div className="cv-tool-header-eyebrow"><Sparkles size={13} aria-hidden="true"/><span>{eyebrow}</span></div>
          <div className="cv-tool-header-title-row">
            <ToolIcon className="cv-tool-header-title-icon" size={22} aria-hidden="true" />
            <h1 id={titleId}>{title}</h1>
          </div>
          <p className="cv-tool-header-tagline">{line}</p>
        </div>
        <Link href={backHref} className="cv-tool-header-back" aria-label={backLabel} title={backLabel}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </section>
  );
}

export default ToolHeader;
