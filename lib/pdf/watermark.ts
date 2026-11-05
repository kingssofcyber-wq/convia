import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export async function addWatermark(
  file: File,
  text: string,
  opacity: number,
  fontSize: number
) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  // फॉन्ट लोड करें
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // टेक्स्ट का साइज़ निकालें ताकि वह सेंटर में आए
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // वॉटरमार्क ड्रा करें
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5), // ग्रे कलर
      opacity: opacity,
      rotate: degrees(45), // 45 डिग्री तिरछा
    });
  }

  const bytes = await pdf.save();
  return {
    bytes,
    fileName: `convia-watermarked-${Date.now()}.pdf`,
  };
}