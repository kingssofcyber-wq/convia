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
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDF content into an editable Word document.", category: "Convert", icon: "word", status: "coming-soon" },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Convert DOC and DOCX documents into PDF.", category: "Convert", icon: "file", status: "coming-soon" },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Export PDF pages as high-quality images.", category: "Convert", icon: "image", status: "coming-soon" },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Create a PDF from one or more images.", category: "Convert", icon: "images", status: "coming-soon" },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert spreadsheets into shareable PDFs.", category: "Convert", icon: "sheet", status: "coming-soon" },
  { slug: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Convert presentations into PDF documents.", category: "Convert", icon: "presentation", status: "coming-soon" },
  { slug: "rotate", name: "Rotate PDF", description: "Correct the orientation of selected pages.", category: "Organize", icon: "rotate", status: "coming-soon" },
  { slug: "delete-pages", name: "Delete PDF Pages", description: "Remove unwanted pages from a document.", category: "Organize", icon: "trash", status: "coming-soon" },
  { slug: "crop", name: "Crop PDF", description: "Adjust visible page areas and margins.", category: "Edit", icon: "crop", status: "coming-soon" },
  { slug: "page-numbers", name: "Add Page Numbers", description: "Add page numbers with flexible positioning.", category: "Edit", icon: "numbers", status: "coming-soon" },
  { slug: "protect", name: "Protect PDF", description: "Add password protection to documents you own.", category: "Secure", icon: "lock", status: "coming-soon" },
  { slug: "unlock", name: "Unlock PDF", description: "Remove restrictions from documents you are authorized to edit.", category: "Secure", icon: "unlock", status: "coming-soon" },
  { slug: "sign", name: "Sign PDF", description: "Place a signature on a PDF document.", category: "Secure", icon: "signature", status: "coming-soon" },
  { slug: "edit", name: "Edit PDF", description: "Make changes and annotations to PDF content.", category: "Edit", icon: "edit", status: "coming-soon" },
  { slug: "ocr", name: "OCR PDF", description: "Make scanned pages searchable with text recognition.", category: "Convert", icon: "scan", status: "coming-soon" },
  { slug: "repair", name: "Repair PDF", description: "Attempt to recover damaged PDF documents.", category: "Organize", icon: "wrench", status: "coming-soon" },
  { slug: "flatten", name: "Flatten PDF", description: "Flatten form fields and annotations.", category: "Organize", icon: "layers", status: "coming-soon" },
  { slug: "redact", name: "Redact PDF", description: "Permanently remove selected sensitive content.", category: "Secure", icon: "shield", status: "coming-soon" },
  { slug: "compare", name: "Compare PDF", description: "Compare two PDF files and review differences.", category: "Edit", icon: "compare", status: "coming-soon" },
  { slug: "annotate", name: "Annotate PDF", description: "Add comments, highlights and notes.", category: "Edit", icon: "highlight", status: "coming-soon" },
  { slug: "add-image", name: "Add Image to PDF", description: "Insert images into selected PDF pages.", category: "Edit", icon: "image-plus", status: "coming-soon" },
  { slug: "html-to-pdf", name: "HTML to PDF", description: "Create a PDF from HTML content.", category: "Convert", icon: "code", status: "coming-soon" },
  { slug: "text-to-pdf", name: "Text to PDF", description: "Turn plain text into a formatted PDF.", category: "Convert", icon: "type", status: "coming-soon" },
  { slug: "metadata", name: "PDF Metadata", description: "View and update document properties.", category: "Edit", icon: "info", status: "coming-soon" },
];

export function getToolBySlug(slug: string) {
  return PDF_TOOLS.find((tool) => tool.slug === slug);
}
