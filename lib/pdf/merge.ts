import { PDFDocument } from "pdf-lib";

export async function mergePDFs(files: File[]) {
  if (files.length < 2) throw new Error("Please select at least 2 PDF files.");

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    totalPages += pdf.getPageCount();
    
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  
  return {
    bytes: mergedPdfBytes,
    fileName: `convia-merged-${Date.now()}.pdf`,
    totalPages: totalPages
  };
}