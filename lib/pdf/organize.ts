import { PDFDocument, degrees } from "pdf-lib";

export async function organizePDF(
  file: File, 
  pages: { originalIndex: number; rotation: number }[]
) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  const newPdf = await PDFDocument.create();

  for (const pageData of pages) {
    // ओरिजिनल पीडीएफ से सही पेज कॉपी करें
    const [copiedPage] = await newPdf.copyPages(pdf, [pageData.originalIndex]);
    
    // अगर पेज घुमाया गया है
    if (pageData.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees(currentRotation + pageData.rotation));
    }
    
    // नई पीडीएफ में पेज जोड़ें
    newPdf.addPage(copiedPage);
  }

  const bytes = await newPdf.save();
  return {
    bytes,
    fileName: `convia-organized-${Date.now()}.pdf`,
  };
}