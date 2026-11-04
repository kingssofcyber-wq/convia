import { PDFDocument } from "pdf-lib";

export async function mergePDFs(files: File[]) {
  if (files.length < 2) throw new Error("कम से कम 2 PDF फाइलें चुनें।");

  // नई खाली PDF डॉक्यूमेंट बनाएँ
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    // फाइल को बाइट्स में पढ़ें
    const arrayBuffer = await file.arrayBuffer();
    
    // पुरानी PDF लोड करें (ignoreEncryption का मतलब है पासवर्ड वाली पीडीएफ को भी पढ़ने की कोशिश करे)
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // पुरानी PDF के सारे पेज निकालें
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    
    // उन पेजों को नई PDF में जोड़ें
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // फाइनल PDF को सेव करें
  const mergedPdfBytes = await mergedPdf.save();
  
  return {
    bytes: mergedPdfBytes,
    fileName: `convia-merged-${Date.now()}.pdf`,
  };
}