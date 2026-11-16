"use client";

import type { LucideIcon } from "lucide-react";
import { ToolHeader } from "@/components/layout/tool-header";

type ToolPageHeaderProps = {
  title: string;
  description: string;
  tagline?: string;
  eyebrow?: string;
  backHref?: string;
  icon?: LucideIcon;
};

/** Compatibility wrapper for the original dynamic PDF tool route. */
export function ToolPageHeader({
  title,
  description,
  tagline,
  eyebrow = "CONVIA PDF WORKSPACE",
  backHref = "/#pdf-tools",
  icon,
}: ToolPageHeaderProps) {
  return (
    <ToolHeader
      title={title}
      description={description}
      tagline={tagline}
      eyebrow={eyebrow}
      backHref={backHref}
      icon={icon}
    />
  );
}

export default ToolPageHeader;
