import { PDFDocument } from "pdf-lib";

export async function compressPDF(file: File) {
  // फाइल को बाइट्स में पढ़ें
  const arrayBuffer = await file.arrayBuffer();
  
  // PDF लोड करें
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // useObjectStreams: true का मतलब है कि यह PDF के डेटा को कॉम्पैक्ट करके सेव करेगा
  const compressedBytes = await pdf.save({ useObjectStreams: true });

  return {
    bytes: compressedBytes,
    fileName: `convia-compressed-${Date.now()}.pdf`,
    originalSize: file.size,
    compressedSize: compressedBytes.length
  };
}