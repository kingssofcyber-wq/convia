import {
  Combine,
  Scissors,
  LayoutGrid,
  FileOutput,
  Hash,
  Minimize2,
  ScanText,
  Wrench,
  Image as ImageIcon,
  FileText,
  Table,
  Presentation,
  Code,
  FileType,
  FileSpreadsheet,
  FileImage,
  FileSliders,
  Archive,
  Pencil,
  MessageSquare,
  Droplet,
  RotateCw,
  PenTool,
  Lock,
  Unlock,
  Signature,
  MessageCircle,
  Sparkles,
  Languages,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "organize"
  | "optimize"
  | "convert"
  | "edit"
  | "security"
  | "ai";

export interface Tool {
  id: string;
  name: string;
  desc: string;
  href: string;
  category: ToolCategory;
  icon?: LucideIcon;
  formatLabel?: string;
  popular?: boolean;
  badge?: "NEW" | "AI" | "BETA";
}

export const categoryLabels: Record<ToolCategory | "all" | "popular", string> = {
  all: "All Tools",
  popular: "Popular",
  organize: "Organize",
  optimize: "Optimize",
  convert: "Convert",
  edit: "Edit",
  security: "Security",
  ai: "AI Tools",
};

export const categoryColors: Record<ToolCategory, string> = {
  organize: "#3b82f6",
  optimize: "#f59e0b",
  convert: "#10b981",
  edit: "#ec4899",
  security: "#dc2626",
  ai: "#8b5cf6",
};

export const tools: Tool[] = [
  // Organize
  {
    id: "merge",
    name: "Merge PDF",
    desc: "Combine multiple PDFs into one file",
    href: "/pdf/merge",
    category: "organize",
    icon: Combine,
    popular: true,
  },
  {
    id: "split",
    name: "Split PDF",
    desc: "Split into multiple files or extract pages",
    href: "/pdf/split",
    category: "organize",
    icon: Scissors,
    popular: true,
  },
  {
    id: "organize",
    name: "Organize PDF",
    desc: "Reorder, rotate, or delete pages",
    href: "/pdf/organize",
    category: "organize",
    icon: LayoutGrid,
  },
  {
    id: "extract",
    name: "Extract Pages",
    desc: "Pull selected pages from a PDF",
    href: "/pdf/extract",
    category: "organize",
    icon: FileOutput,
  },
  {
    id: "pagenum",
    name: "Add Page Numbers",
    desc: "Insert page numbers into PDF",
    href: "/pdf/page-numbers",
    category: "organize",
    icon: Hash,
  },

  // Optimize
  {
    id: "compress",
    name: "Compress PDF",
    desc: "Reduce file size, keep quality",
    href: "/pdf/compress",
    category: "optimize",
    icon: Minimize2,
    popular: true,
  },
  {
    id: "ocr",
    name: "OCR PDF",
    desc: "Make scanned PDFs searchable",
    href: "/pdf/ocr",
    category: "optimize",
    icon: ScanText,
  },
  {
    id: "repair",
    name: "Repair PDF",
    desc: "Recover damaged or corrupted PDFs",
    href: "/pdf/repair",
    category: "optimize",
    icon: Wrench,
  },

  // Convert
  {
    id: "jpg2pdf",
    name: "JPG to PDF",
    desc: "Convert images to PDF",
    href: "/pdf/jpg-to-pdf",
    category: "convert",
    icon: ImageIcon,
    formatLabel: "JPG→PDF",
    popular: true,
  },
  {
    id: "word2pdf",
    name: "Word to PDF",
    desc: "Convert Word documents to PDF",
    href: "/pdf/word-to-pdf",
    category: "convert",
    icon: FileText,
    formatLabel: "DOC→PDF",
    popular: true,
  },
  {
    id: "excel2pdf",
    name: "Excel to PDF",
    desc: "Convert spreadsheets to PDF",
    href: "/pdf/excel-to-pdf",
    category: "convert",
    icon: Table,
    formatLabel: "XLS→PDF",
  },
  {
    id: "ppt2pdf",
    name: "PowerPoint to PDF",
    desc: "Convert presentations to PDF",
    href: "/pdf/ppt-to-pdf",
    category: "convert",
    icon: Presentation,
    formatLabel: "PPT→PDF",
  },
  {
    id: "html2pdf",
    name: "HTML to PDF",
    desc: "Convert web pages to PDF",
    href: "/pdf/html-to-pdf",
    category: "convert",
    icon: Code,
    formatLabel: "HTML→PDF",
  },
  {
    id: "pdf2word",
    name: "PDF to Word",
    desc: "Convert PDF to editable Word",
    href: "/pdf/pdf-to-word",
    category: "convert",
    icon: FileType,
    formatLabel: "PDF→DOC",
    popular: true,
  },
  {
    id: "pdf2excel",
    name: "PDF to Excel",
    desc: "Extract tables from PDF to Excel",
    href: "/pdf/pdf-to-excel",
    category: "convert",
    icon: FileSpreadsheet,
    formatLabel: "PDF→XLS",
  },
  {
    id: "pdf2jpg",
    name: "PDF to JPG",
    desc: "Convert PDF pages to images",
    href: "/pdf/pdf-to-jpg",
    category: "convert",
    icon: FileImage,
    formatLabel: "PDF→JPG",
  },
  {
    id: "pdf2ppt",
    name: "PDF to PowerPoint",
    desc: "Convert PDF to editable slides",
    href: "/pdf/pdf-to-ppt",
    category: "convert",
    icon: FileSliders,
    formatLabel: "PDF→PPT",
  },
  {
    id: "pdf2pdfa",
    name: "PDF to PDF/A",
    desc: "Convert to archival PDF/A format",
    href: "/pdf/pdf-to-pdfa",
    category: "convert",
    icon: Archive,
    formatLabel: "PDF→A",
  },

  // Edit
  {
    id: "edit",
    name: "Edit PDF",
    desc: "Add, edit, or delete text in PDF",
    href: "/pdf/edit",
    category: "edit",
    icon: Pencil,
    popular: true,
    badge: "NEW",
  },
  {
    id: "annotate",
    name: "Annotate PDF",
    desc: "Highlight, comment, and draw",
    href: "/pdf/annotate",
    category: "edit",
    icon: MessageSquare,
  },
  {
    id: "watermark",
    name: "Add Watermark",
    desc: "Stamp text or logo on pages",
    href: "/pdf/watermark",
    category: "edit",
    icon: Droplet,
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    desc: "Fix page orientation in one click",
    href: "/pdf/rotate",
    category: "edit",
    icon: RotateCw,
  },
  {
    id: "fillsign",
    name: "Fill & Sign",
    desc: "Fill forms and add e-signatures",
    href: "/pdf/fill-sign",
    category: "edit",
    icon: PenTool,
  },

  // Security
  {
    id: "protect",
    name: "Protect PDF",
    desc: "Lock PDF with a password",
    href: "/pdf/protect",
    category: "security",
    icon: Lock,
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    desc: "Remove password from PDF",
    href: "/pdf/unlock",
    category: "security",
    icon: Unlock,
  },
  {
    id: "esign",
    name: "Sign PDF",
    desc: "Add digital signature to PDF",
    href: "/pdf/sign",
    category: "security",
    icon: Signature,
  },

  // AI
  {
    id: "chatpdf",
    name: "Chat with PDF",
    desc: "Ask questions about your document",
    href: "/pdf/chat",
    category: "ai",
    icon: MessageCircle,
    popular: true,
    badge: "AI",
  },
  {
    id: "summarize",
    name: "AI Summarize",
    desc: "Get quick summaries of long PDFs",
    href: "/pdf/summarize",
    category: "ai",
    icon: Sparkles,
    badge: "AI",
  },
  {
    id: "translate",
    name: "AI Translate",
    desc: "Translate PDFs to any language",
    href: "/pdf/translate",
    category: "ai",
    icon: Languages,
    badge: "AI",
  },
];