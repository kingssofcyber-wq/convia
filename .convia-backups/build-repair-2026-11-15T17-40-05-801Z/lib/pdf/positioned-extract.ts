export type PositionedChunk = { x: number; y: number; width: number; height: number; fontSize: number; fontName: string; text: string };
export type PositionedLine = { y: number; chunks: PositionedChunk[]; cells: string[]; cellStarts: number[]; text: string };
export type PositionedPage = { page: number; width: number; height: number; lines: PositionedLine[]; columnStarts: number[]; ocrUsed: boolean };

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function groupChunks(chunks: PositionedChunk[], gapFactor = 2.2): PositionedLine[] {
  const heights = chunks.map((chunk) => chunk.height).filter((value) => value > 0);
  const tolerance = Math.max(2, Math.min(5.5, median(heights) * 0.42 || 3.2));
  const rows: Array<{ y: number; chunks: PositionedChunk[] }> = [];
  for (const chunk of [...chunks].sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find((candidate) => Math.abs(candidate.y - chunk.y) <= tolerance);
    if (!row) { row = { y: chunk.y, chunks: [] }; rows.push(row); }
    row.chunks.push(chunk);
  }

  return rows.sort((a, b) => b.y - a.y).map((row) => {
    const sorted = row.chunks.sort((a, b) => a.x - b.x);
    const charWidth = median(sorted.map((chunk) => chunk.width / Math.max(1, chunk.text.length)).filter((value) => value > 0));
    const gapLimit = Math.max(10, Math.min(38, (charWidth || 4.5) * gapFactor));
    const cells: string[] = [];
    const cellStarts: number[] = [];
    let cell = "";
    let cellStart = 0;
    let previousRight: number | null = null;
    for (const chunk of sorted) {
      const gap = previousRight === null ? 0 : chunk.x - previousRight;
      if (previousRight !== null && gap > gapLimit && cell.trim()) {
        cells.push(cell.trim()); cellStarts.push(cellStart); cell = ""; cellStart = chunk.x;
      } else if (!cell.trim()) {
        cellStart = chunk.x;
      }
      cell += `${cell ? " " : ""}${chunk.text}`;
      previousRight = chunk.x + chunk.width;
    }
    if (cell.trim()) { cells.push(cell.trim()); cellStarts.push(cellStart); }
    return { y: row.y, chunks: sorted, cells, cellStarts, text: sorted.map((chunk) => chunk.text).join(" ").replace(/\s+/g, " ").trim() };
  }).filter((line) => line.text);
}

function inferColumnStarts(lines: PositionedLine[], pageWidth: number) {
  const candidates = lines.filter((line) => line.cells.length >= 2).flatMap((line) => line.cellStarts);
  const tolerance = Math.max(14, pageWidth * 0.015);
  const clusters: Array<{ x: number; hits: number }> = [];
  for (const x of candidates.sort((a, b) => a - b)) {
    const nearest = clusters.find((cluster) => Math.abs(cluster.x - x) <= tolerance);
    if (nearest) { nearest.x = (nearest.x * nearest.hits + x) / (nearest.hits + 1); nearest.hits += 1; }
    else clusters.push({ x, hits: 1 });
  }
  const minimumHits = Math.max(2, Math.ceil(lines.length * 0.035));
  const anchors: number[] = [];
  for (const cluster of clusters.filter((cluster) => cluster.hits >= minimumHits).sort((a, b) => a.x - b.x)) {
    if (!anchors.length || cluster.x - anchors[anchors.length - 1] > tolerance * 1.4) anchors.push(cluster.x);
  }
  return anchors.length >= 2 ? anchors : [];
}

function alignRows(lines: PositionedLine[], anchors: number[], pageWidth: number) {
  if (anchors.length < 2) return lines;
  const tolerance = Math.max(24, pageWidth * 0.035);
  return lines.map((line) => {
    const cells = Array.from({ length: anchors.length }, () => "");
    for (const chunk of line.chunks) {
      let target = 0;
      for (let index = 0; index < anchors.length; index += 1) {
        if (anchors[index] <= chunk.x + tolerance) target = index;
        else break;
      }
      cells[target] = `${cells[target]} ${chunk.text}`.trim();
    }
    const populated = cells.filter(Boolean);
    return { ...line, cells: populated.length >= 2 ? cells : line.cells };
  });
}

async function ocrCanvas(page: any, language: string, onProgress?: (progress: number, message: string) => void, pageIndex = 0, pageTotal = 1) {
  const viewport = page.getViewport({ scale: 2.1 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Could not create the OCR page canvas.");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(language);
  try {
    onProgress?.(Math.round((pageIndex / pageTotal) * 80), `Reading scanned page ${pageIndex + 1} of ${pageTotal}`);
    const result = await worker.recognize(canvas);
    const words = (result.data.words ?? []) as Array<{ text: string; confidence?: number; bbox: { x0: number; y0: number; x1: number; y1: number }; block?: number; paragraph?: number; line?: number }>;
    const chunks = words.filter((word) => word.text?.trim()).map((word) => ({
      x: word.bbox.x0 / 2.1, y: -((word.bbox.y0 + word.bbox.y1) / 4.2),
      width: (word.bbox.x1 - word.bbox.x0) / 2.1, height: (word.bbox.y1 - word.bbox.y0) / 2.1,
      fontSize: (word.bbox.y1 - word.bbox.y0) / 2.1, fontName: "OCR", text: word.text,
    }));
    return groupChunks(chunks, 3.1);
  } finally {
    await worker.terminate(); canvas.width = 1; canvas.height = 1;
  }
}

export async function extractPositionedPages(
  file: File,
  options: { useOcr?: boolean; ocrLanguage?: "eng" | "hin" | "eng+hin"; onProgress?: (progress: number, message: string) => void } = {},
): Promise<PositionedPage[]> {
  const pdfjs = await getPdfJs();
  const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loading.promise;
  const output: PositionedPage[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const text = await page.getTextContent();
      const items = (text.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>).filter((item) => item.str?.trim());
      let lines: PositionedLine[] = [];
      let ocrUsed = false;
      const selectableText = items.map((item) => item.str ?? "").join(" ").trim();
      const shouldUseOcr = Boolean(options.useOcr) && (!items.length || selectableText.length < 24);
      if (items.length && !shouldUseOcr) {
        const chunks = items.map((item) => ({
          x: item.transform?.[4] ?? 0,
          y: item.transform?.[5] ?? 0,
          width: item.width ?? Math.max(4, (item.str ?? "").length * 4.5),
          height: item.height ?? Math.abs(item.transform?.[3] ?? 10),
          fontSize: Math.abs(item.transform?.[3] ?? 10),
          fontName: item.fontName ?? "",
          text: item.str ?? "",
        }));
        lines = groupChunks(chunks);
      } else if (options.useOcr) {
        lines = await ocrCanvas(page, options.ocrLanguage ?? "eng", options.onProgress, pageNumber - 1, pdf.numPages);
        ocrUsed = true;
      }
      const anchors = inferColumnStarts(lines, viewport.width);
      output.push({ page: pageNumber, width: viewport.width, height: viewport.height, lines: alignRows(lines, anchors, viewport.width), columnStarts: anchors, ocrUsed });
      options.onProgress?.(Math.round((pageNumber / pdf.numPages) * 90), `Analyzed page ${pageNumber} of ${pdf.numPages}`);
      page.cleanup();
    }
  } finally { await loading.destroy(); }
  return output;
}
