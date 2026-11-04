import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function splitPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();

  if (totalPages === 0) throw new Error("The PDF has no pages.");

  const zip = new JSZip();
  const originalName = file.name.replace(".pdf", "");

  // हर पेज के लिए लूप चलाएँ
  for (let i = 0; i < totalPages; i++) {
    // हर पेज के लिए नई खाली पीडीएफ बनाएँ
    const newPdf = await PDFDocument.create();
    
    // उस स्पेसिफिक पेज को कॉपी करें
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);

    // उसे बाइट्स में सेव करें
    const pdfBytes = await newPdf.save();
    
    // ZIP फाइल में जोड़ें (जैसे: document_page_1.pdf)
    zip.file(`${originalName}_page_${i + 1}.pdf`, pdfBytes);
  }

  // पूरी ZIP फाइल जनरेट करें
  const zipBlob = await zip.generateAsync({ type: "blob" });

  return {
    blob: zipBlob,
    fileName: `convia-split-${Date.now()}.zip`,
    totalPages: totalPages,
  };
}