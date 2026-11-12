// global.d.ts
declare module 'mammoth' {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
  const mammoth: { convertToHtml: typeof convertToHtml };
  export default mammoth;
}

declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}