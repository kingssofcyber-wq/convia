import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3, FileQuestion, Sparkles } from "lucide-react";

const comingSoonTools = {
  "page-numbers": { name: "Add Page Numbers", description: "Add page numbers to PDF pages with adjustable placement and formatting.", category: "Organize" },
  "ocr": { name: "OCR PDF", description: "Make scanned documents searchable with optical character recognition.", category: "Optimize" },
  "repair": { name: "Repair PDF", description: "Try to recover readable content from damaged PDF documents.", category: "Optimize" },
  "jpg-to-pdf": { name: "JPG to PDF", description: "Turn one or more images into a single PDF document.", category: "Convert" },
  "word-to-pdf": { name: "Word to PDF", description: "Convert Word documents into shareable PDF files.", category: "Convert" },
  "excel-to-pdf": { name: "Excel to PDF", description: "Export spreadsheet content into PDF format.", category: "Convert" },
  "ppt-to-pdf": { name: "PowerPoint to PDF", description: "Convert presentation slides into a PDF document.", category: "Convert" },
  "html-to-pdf": { name: "HTML to PDF", description: "Create a PDF from HTML content or a web page.", category: "Convert" },
  "pdf-to-word": { name: "PDF to Word", description: "Convert PDF content into an editable Word document.", category: "Convert" },
  "pdf-to-excel": { name: "PDF to Excel", description: "Extract tables and structured data from PDF files.", category: "Convert" },
  "pdf-to-jpg": { name: "PDF to JPG", description: "Export PDF pages as image files.", category: "Convert" },
  "pdf-to-ppt": { name: "PDF to PowerPoint", description: "Turn PDF pages into a presentation.", category: "Convert" },
  "pdf-to-pdfa": { name: "PDF to PDF/A", description: "Prepare documents for long-term archival workflows.", category: "Convert" },
  "edit": { name: "Edit PDF", description: "Edit supported text and elements in PDF documents.", category: "Edit" },
  "annotate": { name: "Annotate PDF", description: "Highlight, draw and add comments to PDF pages.", category: "Edit" },
  "rotate": { name: "Rotate PDF", description: "Rotate individual pages or the full document.", category: "Edit" },
  "fill-sign": { name: "Fill & Sign", description: "Fill form fields and add a signature to supported PDFs.", category: "Security" },
  "protect": { name: "Protect PDF", description: "Add password protection to a PDF where supported.", category: "Security" },
  "unlock": { name: "Unlock PDF", description: "Remove PDF restrictions when you have the right to do so and know the password where required.", category: "Security" },
  "sign": { name: "Sign PDF", description: "Add a visible signature to PDF documents.", category: "Security" },
  "chat": { name: "Chat with PDF", description: "Ask questions about the content of a document.", category: "AI Tools" },
  "summarize": { name: "AI Summarize", description: "Create a concise summary of a PDF document.", category: "AI Tools" },
  "translate": { name: "AI Translate", description: "Translate supported PDF text into another language.", category: "AI Tools" }
} as const;

type ToolSlug = keyof typeof comingSoonTools;
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(comingSoonTools).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = comingSoonTools[slug as ToolSlug];
  if (!tool) return { title: "PDF Tool Not Found | Convia", robots: { index: false, follow: true } };
  return {
    title: `${tool.name} — Coming Soon`,
    description: tool.description,
    robots: { index: false, follow: true },
  };
}

export default async function PdfComingSoonPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = comingSoonTools[slug as ToolSlug];
  if (!tool) notFound();

  return (
    <main className="min-h-[70vh] bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/#pdf-tools" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary">
          <ArrowLeft size={16} /> Back to all PDF tools
        </Link>
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-sky-600 px-5 py-5 text-white sm:px-7 sm:py-6 convia-compact-tool-hero">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
              <Clock3 size={14} /> Coming soon
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tool.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">{tool.description}</p>
          </div>
          <div className="p-6 sm:p-10">
            <div className="flex items-start gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileQuestion size={24} /></div>
              <div>
                <h2 className="font-bold">This tool is not available yet</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">We are still preparing this feature. It is shown here so you do not land on a broken page. No files will be processed on this screen.</p>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link href="/#pdf-tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Explore available PDF tools <ArrowUpRight size={16} />
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-muted">
                <Sparkles size={16} /> Send feature feedback
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Category: {tool.category} · Availability: Coming Soon</p>
          </div>
        </section>
      </div>
    </main>
  );
}
