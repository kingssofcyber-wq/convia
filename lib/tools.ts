export type ToolStatus = "available" | "coming-soon";
export type ToolCategory = "All" | "Convert" | "Organize" | "Edit" | "Secure" | "AI";

export type PdfTool = {
  slug: string;
  name: string;
  description: string;
  category: Exclude<ToolCategory, "All">;
  icon: string;
  status: ToolStatus;
};

export const PDF_TOOLS: PdfTool[] = [
  { slug: "compress", name: "Compress PDF", description: "Reduce PDF file size with adjustable image quality.", category: "Organize", icon: "minimize", status: "available" },
  { slug: "merge", name: "Merge PDF", description: "Combine multiple PDF files into one document.", category: "Organize", icon: "merge", status: "available" },
  { slug: "split", name: "Split PDF", description: "Separate a document into smaller PDF files.", category: "Organize", icon: "split", status: "available" },
  { slug: "organize", name: "Organize PDF", description: "Reorder, rotate and remove PDF pages.", category: "Organize", icon: "pages", status: "available" },
  { slug: "extract", name: "Extract PDF Pages", description: "Save selected pages as a new PDF.", category: "Organize", icon: "extract", status: "available" },
  { slug: "watermark", name: "Add Watermark", description: "Apply a text or image watermark to pages.", category: "Edit", icon: "stamp", status: "available" },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Rebuild selectable PDF text and detected rows into an editable DOCX; review complex layouts.", category: "Convert", icon: "word", status: "available" },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert Word and OpenDocument files to PDF using LibreOffice.", category: "Convert", icon: "file", status: "available" },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Export PDF pages as high-quality images.", category: "Convert", icon: "image", status: "available" },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Create a PDF from one or more images.", category: "Convert", icon: "images", status: "available" },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert Excel and OpenDocument spreadsheets to PDF with workbook print settings.", category: "Convert", icon: "sheet", status: "available" },
  { slug: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert PowerPoint and OpenDocument presentations to PDF.", category: "Convert", icon: "presentation", status: "available" },
  { slug: "rotate", name: "Rotate PDF", description: "Correct the orientation of selected pages.", category: "Organize", icon: "rotate", status: "available" },
  { slug: "delete-pages", name: "Delete PDF Pages", description: "Remove unwanted pages from a document.", category: "Organize", icon: "trash", status: "coming-soon" },
  { slug: "crop", name: "Crop PDF", description: "Adjust visible page areas and margins.", category: "Edit", icon: "crop", status: "coming-soon" },
  { slug: "page-numbers", name: "Add Page Numbers", description: "Insert page numbers with configurable placement and page selection.", category: "Edit", icon: "numbers", status: "available" },
  { slug: "protect", name: "Protect PDF", description: "Encrypt PDFs with AES-256 and optional recipient permissions.", category: "Secure", icon: "lock", status: "available" },
  { slug: "unlock", name: "Unlock PDF", description: "Unlock PDFs using the correct opening password.", category: "Secure", icon: "unlock", status: "available" },
  { slug: "sign", name: "Sign PDF", description: "Add a visible signature or optional certificate-backed PAdES signature.", category: "Secure", icon: "signature", status: "available" },
  { slug: "edit", name: "Edit PDF", description: "Make changes and annotations to PDF content.", category: "Edit", icon: "edit", status: "available" },
  { slug: "ocr", name: "OCR PDF", description: "Make scanned pages searchable with text recognition.", category: "Convert", icon: "scan", status: "available" },
  { slug: "repair", name: "Repair PDF", description: "Attempt to recover damaged PDF documents.", category: "Organize", icon: "wrench", status: "available" },
  { slug: "flatten", name: "Flatten PDF", description: "Flatten form fields and annotations.", category: "Organize", icon: "layers", status: "coming-soon" },
  { slug: "redact", name: "Redact PDF", description: "Permanently remove selected sensitive content.", category: "Secure", icon: "shield", status: "coming-soon" },
  { slug: "compare", name: "Compare PDF", description: "Compare two PDF files and review differences.", category: "Edit", icon: "compare", status: "coming-soon" },
  { slug: "annotate", name: "Annotate PDF", description: "Highlight, underline, strike, draw, add shapes, text, notes and images.", category: "Edit", icon: "highlight", status: "available" },
  { slug: "add-image", name: "Add Image to PDF", description: "Insert images into selected PDF pages.", category: "Edit", icon: "image-plus", status: "coming-soon" },
  { slug: "html-to-pdf", name: "HTML to PDF", description: "Render sanitized HTML and inline styles to a selectable-text PDF.", category: "Convert", icon: "code", status: "available" },
  { slug: "text-to-pdf", name: "Text to PDF", description: "Turn plain text into a formatted PDF.", category: "Convert", icon: "type", status: "coming-soon" },
  { slug: "metadata", name: "PDF Metadata", description: "View and update document properties.", category: "Edit", icon: "info", status: "coming-soon" },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Detect positioned rows and columns; optionally OCR scanned tables into XLSX.", category: "Convert", icon: "sheet", status: "available" },
  { slug: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Create editable text slides or high-fidelity page-image slides.", category: "Convert", icon: "presentation", status: "available" },
  { slug: "pdf-to-pdfa", name: "PDF to PDF/A", description: "Remediate to a selectable PDF/A archival profile and report residual violations.", category: "Convert", icon: "archive", status: "available" },
  { slug: "fill-sign", name: "Fill & Sign", description: "Fill AcroForm fields, add a visible signature and optionally apply PAdES signing.", category: "Edit", icon: "signature", status: "available" },
  { slug: "chat", name: "Chat with PDF", description: "Ask grounded questions about extracted PDF text with page references (AI key required).", category: "AI", icon: "message", status: "available" },
  { slug: "summarize", name: "AI Summarize", description: "Generate a source-grounded AI summary of PDF text (AI key required).", category: "AI", icon: "sparkles", status: "available" },
];

export function getToolBySlug(slug: string) {
  return PDF_TOOLS.find((tool) => tool.slug === slug);
}
