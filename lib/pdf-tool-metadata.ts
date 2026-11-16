export type PdfToolMetadata = { title: string; tagline: string };

export const PDF_TOOL_METADATA: Record<string, PdfToolMetadata> = {
  merge: { title: "Merge PDF", tagline: "Bring multiple PDFs together into one clean, organized document." },
  split: { title: "Split PDF", tagline: "Separate the pages you need and keep every section in order." },
  organize: { title: "Organize PDF", tagline: "Reorder, rotate and remove pages with a clear visual workspace." },
  extract: { title: "Extract Pages", tagline: "Save only the pages that matter in a new PDF." },
  "page-numbers": { title: "Add Page Numbers", tagline: "Give every page a clear place with neat, consistent numbering." },
  compress: { title: "Compress PDF", tagline: "Reduce document size while keeping pages clear and readable." },
  ocr: { title: "OCR PDF", tagline: "Turn scanned pages into searchable, selectable text." },
  repair: { title: "Repair PDF", tagline: "Try to recover readable pages from a damaged PDF." },
  "jpg-to-pdf": { title: "JPG to PDF", tagline: "Bring your images together in one polished PDF." },
  "word-to-pdf": { title: "Word to PDF", tagline: "Make Word documents easy to share in a consistent layout." },
  "excel-to-pdf": { title: "Excel to PDF", tagline: "Share spreadsheets while keeping their print layout easy to follow." },
  "ppt-to-pdf": { title: "PowerPoint to PDF", tagline: "Turn presentations into a portable document that is ready to share." },
  "html-to-pdf": { title: "HTML to PDF", tagline: "Capture web content as a clean, shareable PDF." },
  "pdf-to-word": { title: "PDF to Word", tagline: "Convert document content into an editable Word file, with OCR for scans." },
  "pdf-to-excel": { title: "PDF to Excel", tagline: "Extract tables and arrange their data in spreadsheet cells." },
  "pdf-to-jpg": { title: "PDF to JPG", tagline: "Export every page as a high-quality image in your chosen format." },
  "pdf-to-ppt": { title: "PDF to PowerPoint", tagline: "Turn PDF pages into presentation slides you can build on." },
  "pdf-to-pdfa": { title: "PDF to PDF/A", tagline: "Prepare documents for long-term storage and archival workflows." },
  edit: { title: "Edit PDF", tagline: "Make focused changes to your PDF content and layout." },
  annotate: { title: "Annotate PDF", tagline: "Highlight, underline, draw and add comments directly on pages." },
  watermark: { title: "Add Watermark", tagline: "Apply a clear text or logo watermark to the pages you choose." },
  rotate: { title: "Rotate PDF", tagline: "Correct page orientation one page at a time or across the document." },
  "fill-sign": { title: "Fill & Sign", tagline: "Complete PDF forms and place your signature where it belongs." },
  protect: { title: "Protect PDF", tagline: "Add password protection and control how a document can be used." },
  unlock: { title: "Unlock PDF", tagline: "Remove PDF encryption when you have the document password." },
  sign: { title: "Sign PDF", tagline: "Apply a visible signature or a certificate-backed digital signature." },
  chat: { title: "Chat with PDF", tagline: "Ask questions and find useful details inside your document." },
  summarize: { title: "AI Summarize", tagline: "Turn long documents into clear key points and takeaways." },
  translate: { title: "AI Translate", tagline: "Translate document content into the language you need." },
};

export function resolvePdfToolMetadata(pathname: string): PdfToolMetadata & { slug: string } {
  const cleanPath = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const slug = segments[segments.length - 1] || "pdf";
  const known = PDF_TOOL_METADATA[slug];
  if (known) return { ...known, slug };
  const title = slug
    .split("-")
    .map((word) => word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return { title: title || "PDF Tool", tagline: "A focused workspace to get more done with your PDF.", slug };
}

export function getPdfToolTagline(title: string): string | undefined {
  const normalized = title.trim().toLowerCase().replace(/\s+/g, " ");
  return Object.values(PDF_TOOL_METADATA).find((item) => item.title.toLowerCase() === normalized)?.tagline;
}
