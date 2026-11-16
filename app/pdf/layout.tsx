import type { ReactNode } from "react";
import { PdfWorkspaceShell } from "@/components/pdf/pdf-workspace-shell";

/** One consistent header for every PDF route. Page-level shared headers are visually suppressed inside this layout. */
export default function PdfLayout({ children }: { children: ReactNode }) {
  return <PdfWorkspaceShell>{children}</PdfWorkspaceShell>;
}
