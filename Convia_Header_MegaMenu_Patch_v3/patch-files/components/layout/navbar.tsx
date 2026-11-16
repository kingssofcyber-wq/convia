"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Archive,
  ChevronDown,
  Code,
  Combine,
  Droplet,
  FileImage,
  FileOutput,
  FileSpreadsheet,
  FileText,
  FileType,
  Hash,
  Image as ImageIcon,
  Languages,
  LayoutGrid,
  Lock,
  Menu,
  MessageCircle,
  MessageSquare,
  Minimize2,
  Pencil,
  PenTool,
  Presentation,
  RotateCw,
  ScanText,
  Scissors,
  Search,
  ShieldCheck,
  Signature,
  Sparkles,
  Table,
  Unlock,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConviaLogo } from "@/components/brand/convia-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type PdfToolLink = {
  name: string;
  href: string;
  description: string;
  icon: LucideIcon;
  badge?: "POPULAR" | "AI" | "NEW";
};

type PdfToolCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tools: PdfToolLink[];
};

/**
 * Keep this navigation catalogue local to the header so the mega menu does not
 * silently disappear when lib/tools-data.ts is edited or uses another schema.
 * Keep hrefs in sync with the App Router page folders.
 */
const pdfCategories: PdfToolCategory[] = [
  {
    id: "organize",
    title: "Organize & Pages",
    description: "Combine, split and manage PDF pages",
    icon: LayoutGrid,
    tools: [
      { name: "Merge PDF", href: "/pdf/merge", description: "Combine multiple PDFs", icon: Combine, badge: "POPULAR" },
      { name: "Split PDF", href: "/pdf/split", description: "Split documents into files", icon: Scissors, badge: "POPULAR" },
      { name: "Organize PDF", href: "/pdf/organize", description: "Reorder, rotate and remove pages", icon: LayoutGrid },
      { name: "Extract Pages", href: "/pdf/extract", description: "Save selected pages", icon: FileOutput },
      { name: "Page Numbers", href: "/pdf/page-numbers", description: "Add page numbering", icon: Hash },
    ],
  },
  {
    id: "optimize",
    title: "Optimize & OCR",
    description: "Reduce size and improve documents",
    icon: Minimize2,
    tools: [
      { name: "Compress PDF", href: "/pdf/compress", description: "Reduce PDF file size", icon: Minimize2, badge: "POPULAR" },
      { name: "OCR PDF", href: "/pdf/ocr", description: "Recognize text in scanned pages", icon: ScanText },
      { name: "Repair PDF", href: "/pdf/repair", description: "Try to repair damaged PDFs", icon: Wrench },
    ],
  },
  {
    id: "convert",
    title: "Convert Files",
    description: "Convert PDFs, images and Office files",
    icon: FileText,
    tools: [
      { name: "JPG to PDF", href: "/pdf/jpg-to-pdf", description: "Create a PDF from images", icon: ImageIcon, badge: "POPULAR" },
      { name: "Word to PDF", href: "/pdf/word-to-pdf", description: "Convert DOCX documents", icon: FileText, badge: "POPULAR" },
      { name: "Excel to PDF", href: "/pdf/excel-to-pdf", description: "Convert spreadsheets", icon: Table },
      { name: "PowerPoint to PDF", href: "/pdf/ppt-to-pdf", description: "Convert presentations", icon: Presentation },
      { name: "HTML to PDF", href: "/pdf/html-to-pdf", description: "Convert web content", icon: Code },
      { name: "PDF to Word", href: "/pdf/pdf-to-word", description: "Create editable DOCX", icon: FileType },
      { name: "PDF to Excel", href: "/pdf/pdf-to-excel", description: "Extract tables to XLSX", icon: FileSpreadsheet },
      { name: "PDF to JPG", href: "/pdf/pdf-to-jpg", description: "Export pages as images", icon: FileImage },
      { name: "PDF to PowerPoint", href: "/pdf/pdf-to-ppt", description: "Create presentation slides", icon: Presentation },
      { name: "PDF to PDF/A", href: "/pdf/pdf-to-pdfa", description: "Prepare archival PDFs", icon: Archive },
    ],
  },
  {
    id: "edit",
    title: "Edit & Annotate",
    description: "Mark up and prepare documents",
    icon: Pencil,
    tools: [
      { name: "Edit PDF", href: "/pdf/edit", description: "Edit PDF content", icon: Pencil, badge: "NEW" },
      { name: "Annotate PDF", href: "/pdf/annotate", description: "Highlight, draw and comment", icon: MessageSquare },
      { name: "Add Watermark", href: "/pdf/watermark", description: "Stamp text or a logo", icon: Droplet },
      { name: "Rotate PDF", href: "/pdf/rotate", description: "Rotate selected pages", icon: RotateCw },
      { name: "Fill & Sign", href: "/pdf/fill-sign", description: "Complete forms and add a signature", icon: PenTool },
    ],
  },
  {
    id: "security",
    title: "Security & Sign",
    description: "Protect and sign documents you own",
    icon: ShieldCheck,
    tools: [
      { name: "Protect PDF", href: "/pdf/protect", description: "Add password protection", icon: Lock },
      { name: "Unlock PDF", href: "/pdf/unlock", description: "Unlock with the correct password", icon: Unlock },
      { name: "Sign PDF", href: "/pdf/sign", description: "Add a certificate-backed signature", icon: Signature },
    ],
  },
  {
    id: "ai",
    title: "AI PDF Tools",
    description: "Understand and translate documents",
    icon: Sparkles,
    tools: [
      { name: "Chat with PDF", href: "/pdf/chat", description: "Ask questions about a PDF", icon: MessageCircle, badge: "AI" },
      { name: "AI Summarize", href: "/pdf/summarize", description: "Summarize long documents", icon: Sparkles, badge: "AI" },
      { name: "AI Translate", href: "/pdf/translate", description: "Translate document content", icon: Languages, badge: "AI" },
    ],
  },
];

const secondaryLinks = [
  { href: "/#loans", label: "Loans & EMI" },
  { href: "/#insurance", label: "Insurance" },
  { href: "/#health", label: "Health" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [pdfMenuOpen, setPdfMenuOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement | null>(null);
  const pdfToolsCount = React.useMemo(
    () => pdfCategories.reduce((count, category) => count + category.tools.length, 0),
    [],
  );

  React.useEffect(() => {
    setPdfMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!pdfMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setPdfMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPdfMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pdfMenuOpen]);

  const closeAll = () => {
    setPdfMenuOpen(false);
    setMobileOpen(false);
  };

  const isPdfArea = pathname.startsWith("/pdf/");

  return (
    <>
      <div className="announcement-bar">
        <span><i className="announcement-dot" /> Your everyday digital workspace</span>
        <span className="announcement-right">Simple tools. Clear results. <b>convia.workspace</b></span>
      </div>

      <header
        ref={headerRef}
        className="cv-site-header"
        data-pdf-menu-open={pdfMenuOpen ? "true" : "false"}
      >
        <div className="cv-header-inner">
          <Link href="/" className="cv-header-logo" aria-label="Convia home" onClick={closeAll}>
            <ConviaLogo compact />
          </Link>

          <nav className="cv-desktop-nav" aria-label="Main navigation">
            <button
              type="button"
              className={`cv-nav-link cv-pdf-menu-trigger${isPdfArea || pdfMenuOpen ? " is-active" : ""}`}
              aria-expanded={pdfMenuOpen}
              aria-haspopup="true"
              aria-controls="convia-pdf-mega-menu"
              onMouseEnter={() => setPdfMenuOpen(true)}
              onFocus={() => setPdfMenuOpen(true)}
              onClick={() => setPdfMenuOpen((open) => !open)}
            >
              PDF Tools <ChevronDown size={15} className={pdfMenuOpen ? "is-open" : ""} />
            </button>
            {secondaryLinks.map((item) => (
              <Link key={item.href} href={item.href} className="cv-nav-link" onClick={closeAll}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="cv-header-actions">
            <Link href="/#pdf-tools" className="cv-header-search" aria-label="Find a tool" onClick={closeAll}>
              <Search size={16} /><span>Find a tool</span>
            </Link>
            <span className="cv-theme-toggle"><ThemeToggle /></span>
            <Link href="/login" className="cv-header-login" onClick={closeAll}>Log in</Link>
            <Link href="/signup" className="cv-header-cta" onClick={closeAll}>Get started <ArrowUpRight size={15} /></Link>
            <button
              type="button"
              className="cv-mobile-menu-button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="convia-mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {pdfMenuOpen && (
          <div
            id="convia-pdf-mega-menu"
            className="cv-mega-panel"
            role="region"
            aria-label="PDF tools by category"
            onMouseEnter={() => setPdfMenuOpen(true)}
          >
            <div className="cv-mega-heading">
              <div>
                <span className="cv-mega-kicker"><Sparkles size={13} /> CONVIA PDF WORKSPACE</span>
                <h2>Everything you need for PDF work</h2>
                <p>{pdfToolsCount} tools, grouped by task so you can find the right one quickly.</p>
              </div>
              <div className="cv-mega-heading-actions">
                <Link href="/#pdf-tools" className="cv-mega-all-link" onClick={closeAll}>
                  Browse all tools <ArrowUpRight size={15} />
                </Link>
                <button type="button" className="cv-mega-close" onClick={() => setPdfMenuOpen(false)} aria-label="Close PDF tools menu"><X size={17} /></button>
              </div>
            </div>

            <div className="cv-mega-category-grid">
              {pdfCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <section key={category.id} className={`cv-mega-category cv-mega-${category.id}`}>
                    <div className="cv-mega-category-title">
                      <span className="cv-mega-category-icon"><CategoryIcon size={17} /></span>
                      <span><strong>{category.title}</strong><small>{category.description}</small></span>
                    </div>
                    <div className="cv-mega-tool-list">
                      {category.tools.map((tool) => {
                        const ToolIcon = tool.icon;
                        return (
                          <Link key={tool.href} href={tool.href} className="cv-mega-tool-link" onClick={closeAll}>
                            <span className="cv-mega-tool-icon"><ToolIcon size={15} /></span>
                            <span className="cv-mega-tool-copy">
                              <span className="cv-mega-tool-name">{tool.name}</span>
                              {tool.badge && <span className={`cv-mega-badge cv-mega-badge-${tool.badge.toLowerCase()}`}>{tool.badge}</span>}
                              <span className="cv-mega-tool-description">{tool.description}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="cv-mega-footer">
              <span><ShieldCheck size={13} /> Your PDF is handled by the selected tool.</span>
              <Link href="/contact" onClick={closeAll}>Need help choosing a tool?</Link>
            </div>
          </div>
        )}

        {mobileOpen && (
          <nav id="convia-mobile-navigation" className="cv-mobile-nav" aria-label="Mobile navigation">
            <details className="cv-mobile-pdf-details">
              <summary>PDF Tools <ChevronDown size={17} /></summary>
              <div className="cv-mobile-categories">
                {pdfCategories.map((category) => (
                  <section key={category.id} className="cv-mobile-category">
                    <h3>{category.title}</h3>
                    <div className="cv-mobile-tool-grid">
                      {category.tools.map((tool) => (
                        <Link key={tool.href} href={tool.href} onClick={closeAll}>{tool.name}</Link>
                      ))}
                    </div>
                  </section>
                ))}
                <Link href="/#pdf-tools" className="cv-mobile-all-tools" onClick={closeAll}>Browse all PDF tools <ArrowUpRight size={14} /></Link>
              </div>
            </details>
            {secondaryLinks.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeAll}>{item.label}</Link>
            ))}
            <div className="cv-mobile-nav-actions">
              <Link href="/login" onClick={closeAll}>Log in</Link>
              <Link href="/signup" onClick={closeAll}>Get started</Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}


/** Compatibility export for layouts that mount Navbar instead of SiteHeader. */
export function Navbar() {
  return <SiteHeader />;
}

export default SiteHeader;
