import { PDFDocument } from "pdf-lib";

export async function convertImagesToPDF(files: File[]) {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    
    // इमेज का टाइप चेक करें (JPG या PNG)
    let image;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      throw new Error(`Unsupported file format: ${file.name}. Please use JPG or PNG.`);
    }

    // इमेज के साइज़ के हिसाब से पेज बनाएँ
    const page = pdfDoc.addPage([image.width, image.height]);
    
    // पेज पर इमेज ड्रा करें
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return {
    bytes: pdfBytes,
    fileName: `convia-images-${Date.now()}.pdf`,
  };
}