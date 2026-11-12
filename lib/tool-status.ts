/**
 * Keep this list aligned with PDF routes that have an implemented tool page.
 * JPG to PDF is enabled by this patch and is processed locally in the browser.
 */
export const READY_TOOL_IDS = new Set([
  "merge",
  "split",
  "organize",
  "extract",
  "compress",
  "watermark",
  "jpg2pdf",
]);

export function isToolReady(toolId: string): boolean {
  return READY_TOOL_IDS.has(toolId);
}
