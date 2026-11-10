import {
  Combine, Scissors, LayoutGrid, FileOutput, Hash,
  Minimize2, ScanText, Wrench, Image as ImageIcon,
  FileText, Table, Presentation, Code, FileType,
  FileSpreadsheet, FileImage, FileSliders, Archive,
  Pencil, MessageSquare, Droplet, RotateCw, PenTool,
  Lock, Unlock, Signature, MessageCircle, Sparkles,
  Languages, type LucideIcon,
} from "lucide-react";

export type ToolCategory = "organize" | "optimize" | "convert" | "edit" | "security" | "ai";

export interface Tool {
  id: string;
  name: string;
  desc: string;
  href: string;
  category: ToolCategory;
  icon?: LucideIcon;
  popular?: boolean;
  badge?: "NEW" | "AI" | "BETA";
}

export const categoryLabels: Record<ToolCategory | "all" | "popular", string> = {
  all: "All",
  popular: "Popular",
  organize: "Organize",
  optimize: "Optimize",
  convert: "Convert",
  edit: "Edit",
  security: "Secure",
  ai: "AI",
};

export const categoryColors: Record<ToolCategory, string> = {
  organize: "#3b82f6", // Blue
  optimize: "#f59e0b", // Amber
  convert: "#10b981",  // Emerald
  edit: "#ec4899",     // Pink
  security: "#dc2626", // Red
  ai: "#8b5cf6",       // Violet
};

export const tools: Tool[] = [
  // Organize
  { id: "merge", name: "Merge PDF", desc: "Combine multiple PDF files into one document.", href: "/pdf/merge", category: "organize", icon: Combine, popular: true },
  { id: "split", name: "Split PDF", desc: "Separate a document into smaller PDF files.", href: "/pdf/split", category: "organize", icon: Scissors, popular: true },
  { id: "organize", name: "Organize PDF", desc: "Reorder, rotate and remove PDF pages.", href: "/pdf/organize", category: "organize", icon: LayoutGrid },
  { id: "extract", name: "Extract PDF Pages", desc: "Save selected pages as a new PDF.", href: "/pdf/extract", category: "organize", icon: FileOutput },
  { id: "pagenum", name: "Add Page Numbers", desc: "Insert page numbers into PDF.", href: "/pdf/page-numbers", category: "organize", icon: Hash },

  // Optimize
  { id: "compress", name: "Compress PDF", desc: "Reduce PDF file size with adjustable image quality.", href: "/pdf/compress", category: "optimize", icon: Minimize2, popular: true },
  { id: "ocr", name: "OCR PDF", desc: "Make scanned PDFs searchable.", href: "/pdf/ocr", category: "optimize", icon: ScanText },
  { id: "repair", name: "Repair PDF", desc: "Recover damaged or corrupted PDFs.", href: "/pdf/repair", category: "optimize", icon: Wrench },

  // Convert
  { id: "jpg2pdf", name: "JPG to PDF", desc: "Create a PDF from one or more images.", href: "/pdf/jpg-to-pdf", category: "convert", icon: ImageIcon, popular: true },
  { id: "word2pdf", name: "Word to PDF", desc: "Convert DOC and DOCX documents into PDF.", href: "/pdf/word-to-pdf", category: "convert", icon: FileText, popular: true },
  { id: "excel2pdf", name: "Excel to PDF", desc: "Convert spreadsheets into shareable PDFs.", href: "/pdf/excel-to-pdf", category: "convert", icon: Table },
  { id: "ppt2pdf", name: "PowerPoint to PDF", desc: "Convert presentations into PDF documents.", href: "/pdf/ppt-to-pdf", category: "convert", icon: Presentation },
  { id: "html2pdf", name: "HTML to PDF", desc: "Convert web pages to PDF.", href: "/pdf/html-to-pdf", category: "convert", icon: Code },
  { id: "pdf2word", name: "PDF to Word", desc: "Convert PDF content into an editable Word document.", href: "/pdf/pdf-to-word", category: "convert", icon: FileType, popular: true },
  { id: "pdf2excel", name: "PDF to Excel", desc: "Extract tables from PDF to Excel.", href: "/pdf/pdf-to-excel", category: "convert", icon: FileSpreadsheet },
  { id: "pdf2jpg", name: "PDF to JPG", desc: "Export PDF pages as high-quality images.", href: "/pdf/pdf-to-jpg", category: "convert", icon: FileImage },
  { id: "pdf2ppt", name: "PDF to PowerPoint", desc: "Convert PDF to editable slides.", href: "/pdf/pdf-to-ppt", category: "convert", icon: FileSliders },
  { id: "pdf2pdfa", name: "PDF to PDF/A", desc: "Convert to archival PDF/A format.", href: "/pdf/pdf-to-pdfa", category: "convert", icon: Archive },

  // Edit
  { id: "edit", name: "Edit PDF", desc: "Add, edit, or delete text in PDF.", href: "/pdf/edit", category: "edit", icon: Pencil, popular: true, badge: "NEW" },
  { id: "annotate", name: "Annotate PDF", desc: "Highlight, comment, and draw.", href: "/pdf/annotate", category: "edit", icon: MessageSquare },
  { id: "watermark", name: "Add Watermark", desc: "Apply a text or image watermark to pages.", href: "/pdf/watermark", category: "edit", icon: Droplet, popular: true },
  { id: "rotate", name: "Rotate PDF", desc: "Fix page orientation in one click.", href: "/pdf/rotate", category: "edit", icon: RotateCw },
  { id: "fillsign", name: "Fill & Sign", desc: "Fill forms and add e-signatures.", href: "/pdf/fill-sign", category: "edit", icon: PenTool },

  // Security
  { id: "protect", name: "Protect PDF", desc: "Lock PDF with a password.", href: "/pdf/protect", category: "security", icon: Lock },
  { id: "unlock", name: "Unlock PDF", desc: "Remove password from PDF.", href: "/pdf/unlock", category: "security", icon: Unlock },
  { id: "esign", name: "Sign PDF", desc: "Add digital signature to PDF.", href: "/pdf/sign", category: "security", icon: Signature },

  // AI
  { id: "chatpdf", name: "Chat with PDF", desc: "Ask questions about your document.", href: "/pdf/chat", category: "ai", icon: MessageCircle, popular: true, badge: "AI" },
  { id: "summarize", name: "AI Summarize", desc: "Get quick summaries of long PDFs.", href: "/pdf/summarize", category: "ai", icon: Sparkles, badge: "AI" },
  { id: "translate", name: "AI Translate", desc: "Translate PDFs to any language.", href: "/pdf/translate", category: "ai", icon: Languages, badge: "AI" },
];