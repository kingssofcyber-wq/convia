export type PdfOcrLanguage = "eng" | "hin" | "eng+hin";

export type WordChunk = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  text: string;
};

export type WordLine = {
  y: number;
  chunks: WordChunk[];
  cells: string[];
  cellStarts: number[];
  text: string;
};

export type WordPage = {
  page: number;
  width: number;
  height: number;
  lines: WordLine[];
  ocrUsed: boolean;
};

export type PdfWordExtraction = {
  pages: WordPage[];
  totalPages: number;
  scannedPages: number[];
};

export type PdfWordProgress = (percent: number, message: string) => void;

type ExtractOptions = {
  language?: PdfOcrLanguage;
  autoOcrScannedPages?: boolean;
  forceOcrAllPages?: boolean;
  onProgress?: PdfWordProgress;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
};

type OcrWord = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function groupChunks(input: WordChunk[]): WordLine[] {
  if (!input.length) return [];
  const heights = input.map((item) => item.height).filter((height) => height > 0);
  const typicalHeight = median(heights) || 10;
  const tolerance = Math.max(2, Math.min(6, typicalHeight * 0.48));
  const rows: Array<{ y: number; chunks: WordChunk[] }> = [];

  for (const chunk of [...input].sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find((candidate) => Math.abs(candidate.y - chunk.y) <= tolerance);
    if (!row) {
      row = { y: chunk.y, chunks: [] };
      rows.push(row);
    }
    row.chunks.push(chunk);
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => {
      const chunks = row.chunks.sort((a, b) => a.x - b.x);
      const charWidth = median(
        chunks
          .map((chunk) => chunk.width / Math.max(1, chunk.text.length))
          .filter((value) => Number.isFinite(value) && value > 0),
      ) || 4.5;
      const columnGap = Math.max(12, Math.min(42, charWidth * 3.2));
      const cells: string[] = [];
      const cellStarts: number[] = [];
      let current = "";
      let startX = 0;
      let previousRight: number | null = null;

      for (const chunk of chunks) {
        const gap = previousRight === null ? 0 : chunk.x - previousRight;
        if (previousRight !== null && gap > columnGap && current.trim()) {
          cells.push(current.trim());
          cellStarts.push(startX);
          current = "";
          startX = chunk.x;
        } else if (!current.trim()) {
          startX = chunk.x;
        }
        current += `${current ? " " : ""}${chunk.text}`;
        previousRight = chunk.x + chunk.width;
      }
      if (current.trim()) {
        cells.push(current.trim());
        cellStarts.push(startX);
      }

      return {
        y: row.y,
        chunks,
        cells,
        cellStarts,
        text: chunks.map((chunk) => chunk.text).join(" ").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((line) => line.text.length > 0);
}

function getTextChunks(items: PdfTextItem[]): WordChunk[] {
  return items
    .filter((item) => typeof item.str === "string" && item.str.trim().length > 0)
    .map((item) => {
      const transform = item.transform ?? [];
      const fontSize = Math.abs(transform[3] ?? item.height ?? 10) || 10;
      return {
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: item.width ?? Math.max(4, (item.str ?? "").length * fontSize * 0.48),
        height: item.height ?? fontSize,
        fontSize,
        fontName: item.fontName ?? "PDF",
        text: item.str ?? "",
      };
    });
}

function inferAndAlignColumns(lines: WordLine[], pageWidth: number): WordLine[] {
  const candidates = lines
    .filter((line) => line.cells.length >= 2)
    .flatMap((line) => line.cellStarts);
  const tolerance = Math.max(13, pageWidth * 0.014);
  const clusters: Array<{ x: number; hits: number }> = [];

  for (const x of candidates.sort((a, b) => a - b)) {
    const nearest = clusters.find((cluster) => Math.abs(cluster.x - x) <= tolerance);
    if (nearest) {
      nearest.x = (nearest.x * nearest.hits + x) / (nearest.hits + 1);
      nearest.hits += 1;
    } else {
      clusters.push({ x, hits: 1 });
    }
  }

  const minHits = Math.max(2, Math.ceil(lines.length * 0.04));
  const anchors: number[] = [];
  for (const cluster of clusters.filter((item) => item.hits >= minHits).sort((a, b) => a.x - b.x)) {
    if (!anchors.length || cluster.x - anchors[anchors.length - 1] > tolerance * 1.5) {
      anchors.push(cluster.x);
    }
  }
  if (anchors.length < 2) return lines;

  return lines.map((line) => {
    const aligned = Array.from({ length: anchors.length }, () => "");
    for (const chunk of line.chunks) {
      let column = 0;
      for (let index = 0; index < anchors.length; index += 1) {
        if (anchors[index] <= chunk.x + tolerance * 1.5) column = index;
        else break;
      }
      aligned[column] = `${aligned[column]} ${chunk.text}`.trim();
    }
    return aligned.filter(Boolean).length >= 2 ? { ...line, cells: aligned } : line;
  });
}

async function loadTesseractWorker(language: PdfOcrLanguage, onProgress: PdfWordProgress, getPageIndex: () => number, totalPages: number) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(language, 1, {
    logger: (message: { status?: string; progress?: number }) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        const pageFraction = Math.max(0, Math.min(1, message.progress));
        const overall = ((getPageIndex() + pageFraction) / totalPages) * 84;
        onProgress(Math.round(8 + overall), `OCR reading scanned page ${pageIndex + 1} of ${totalPages}`);
      }
    },
  });
  return worker;
}

async function recognizePage(page: any, worker: any, pageWidth: number, pageHeight: number): Promise<WordLine[]> {
  const scale = 2.15;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) throw new Error("OCR canvas could not be created. Please try a recent Chrome or Edge browser.");

  try {
    await page.render({ canvasContext: context, viewport }).promise;
    const recognition = await worker.recognize(canvas);
    const words = ((recognition.data?.words ?? []) as OcrWord[]).filter(
      (word) => word.text?.trim() && word.bbox && (word.confidence === undefined || word.confidence >= 8),
    );
    const chunks: WordChunk[] = words.map((word) => {
      const box = word.bbox!;
      const width = Math.max(1, (box.x1 - box.x0) / scale);
      const height = Math.max(1, (box.y1 - box.y0) / scale);
      return {
        x: box.x0 / scale,
        // PDF coordinates start at the bottom; OCR canvas coordinates start at the top.
        y: pageHeight - ((box.y0 + box.y1) / 2) / scale,
        width,
        height,
        fontSize: height,
        fontName: "OCR",
        text: word.text!.trim(),
      };
    });

    if (chunks.length) return groupChunks(chunks);

    const fallback = String(recognition.data?.text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const fallbackChunks = fallback.map((text, index) => ({
      x: 0,
      y: pageHeight - 24 - index * 15,
      width: Math.min(pageWidth, text.length * 5.5),
      height: 11,
      fontSize: 11,
      fontName: "OCR",
      text,
    }));
    return groupChunks(fallbackChunks);
  } finally {
    canvas.width = 1;
    canvas.height = 1;
    page.cleanup?.();
  }
}

/**
 * Extracts selectable PDF text page-by-page and automatically OCRs pages whose
 * text layer is missing/too small. A single Tesseract worker is reused for the file.
 */
export async function extractPdfForWord(file: File, options: ExtractOptions = {}): Promise<PdfWordExtraction> {
  const language = options.language ?? "eng+hin";
  const autoOcr = options.autoOcrScannedPages ?? true;
  const forceOcr = options.forceOcrAllPages ?? false;
  const onProgress = options.onProgress ?? (() => undefined);

  onProgress(2, "Loading PDF reader");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages as number;
  if (!totalPages) {
    await loadingTask.destroy();
    throw new Error("This PDF does not contain readable pages.");
  }
  if (totalPages > 80) {
    await loadingTask.destroy();
    throw new Error("This file has more than 80 pages. Split it into smaller parts for reliable browser OCR.");
  }

  const pages: WordPage[] = [];
  const scannedPages: number[] = [];
  let worker: any = null;
  let currentPageIndex = 0;

  try {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      currentPageIndex = pageNumber - 1;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = (content.items as PdfTextItem[]).filter(
        (item) => typeof item.str === "string" && item.str.trim().length > 0,
      );
      const selectableTextLength = items.reduce((sum, item) => sum + (item.str?.trim().length ?? 0), 0);
      const isScannedOrImagePage = items.length < 2 || selectableTextLength < 28;
      const shouldOcr = forceOcr || (autoOcr && isScannedOrImagePage);
      let chunks: WordChunk[];
      let ocrUsed = false;

      if (shouldOcr) {
        if (!worker) {
          onProgress(5, `Loading ${language === "eng+hin" ? "English + Hindi" : language === "hin" ? "Hindi" : "English"} OCR data`);
          worker = await loadTesseractWorker(language, onProgress, () => currentPageIndex, totalPages);
        }
        scannedPages.push(pageNumber);
        chunks = [];
        const lines = await recognizePage(page, worker, viewport.width, viewport.height);
        pages.push({
          page: pageNumber,
          width: viewport.width,
          height: viewport.height,
          lines: inferAndAlignColumns(lines, viewport.width),
          ocrUsed: true,
        });
        ocrUsed = true;
      } else {
        chunks = getTextChunks(items);
        const lines = groupChunks(chunks);
        pages.push({
          page: pageNumber,
          width: viewport.width,
          height: viewport.height,
          lines: inferAndAlignColumns(lines, viewport.width),
          ocrUsed,
        });
        page.cleanup?.();
      }

      onProgress(Math.round(8 + (pageNumber / totalPages) * 84), `Analyzed page ${pageNumber} of ${totalPages}${ocrUsed ? " with OCR" : ""}`);
    }
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch { /* OCR result is already handled. */ }
    }
    try { await loadingTask.destroy(); } catch { /* Ignore cleanup errors. */ }
  }

  const hasAnyText = pages.some((page) => page.lines.length > 0);
  if (!hasAnyText) {
    throw new Error("No readable text was found. Try English + Hindi OCR, improve the scan quality, or check whether the PDF is password-protected.");
  }

  return { pages, totalPages, scannedPages };
}
