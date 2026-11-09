/**
 * Keep this list aligned with the PDF routes that have been implemented and
 * smoke-tested. A tool absent from this set is shown as Coming Soon.
 */
export const READY_TOOL_IDS = new Set([
  "merge",
  "split",
  "organize",
  "extract",
  "compress",
  "watermark",
]);

export function isToolReady(toolId: string): boolean {
  return READY_TOOL_IDS.has(toolId);
}
