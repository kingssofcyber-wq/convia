import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function splitPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();

  if (totalPages === 0) throw new Error("The PDF has no pages.");

  const zip = new JSZip();
  const originalName = file.name.replace(".pdf", "");

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    zip.file(`${originalName}_page_${i + 1}.pdf`, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  return {
    blob: zipBlob,
    fileName: `convia-split-${Date.now()}.zip`,
    totalPages: totalPages,
  };
}