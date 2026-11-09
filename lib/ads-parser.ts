export interface ParsedAdCode {
  publisherId: string;
  slotId: string;
  format: string | null;
  layout: string | null;
  layoutKey: string | null;
  widthPx: number | null;
  heightPx: number | null;
  fullWidthResponsive: boolean;
}

function attribute(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2]?.trim() ?? null;
}

export function parseAdSenseSnippet(code: string): ParsedAdCode {
  if (typeof code !== "string" || !code.trim() || code.length > 30000) {
    throw new Error("Paste one AdSense ad-unit snippet (maximum 30,000 characters).");
  }

  // We deliberately parse only the adsbygoogle <ins> attributes.
  // Pasted script tags and arbitrary JavaScript are never stored or executed.
  const insTags = code.match(/<ins\b[^>]*>/gi) ?? [];
  const matching = insTags.filter((tag) => {
    const className = attribute(tag, "class") ?? "";
    return className.split(/\s+/).includes("adsbygoogle");
  });

  if (matching.length !== 1) {
    throw new Error(matching.length === 0
      ? 'No <ins class="adsbygoogle"> ad unit found. Auto Ads scripts cannot be added here.'
      : "Paste one ad-unit snippet at a time; multiple AdSense units were found.");
  }

  const tag = matching[0];
  const publisherId = attribute(tag, "data-ad-client") ?? "";
  const slotId = attribute(tag, "data-ad-slot") ?? "";
  const format = attribute(tag, "data-ad-format");
  const layout = attribute(tag, "data-ad-layout");
  const layoutKey = attribute(tag, "data-ad-layout-key");
  const responsive = attribute(tag, "data-full-width-responsive");
  const style = attribute(tag, "style") ?? "";

  const widthMatch = style.match(/(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)px/i);
  const heightMatch = style.match(/(?:^|;)\s*height\s*:\s*(\d+(?:\.\d+)?)px/i);
  const widthPx = widthMatch ? Math.round(Number(widthMatch[1])) : null;
  const heightPx = heightMatch ? Math.round(Number(heightMatch[1])) : null;

  if (!/^ca-pub-\d{8,30}$/.test(publisherId)) {
    throw new Error('Publisher ID is missing or invalid. Check data-ad-client="ca-pub-...".');
  }
  if (!/^\d{5,20}$/.test(slotId)) {
    throw new Error("Ad Slot ID is missing or invalid. Check data-ad-slot.");
  }

  const allowedFormats = new Set(["auto", "fluid", "autorelaxed", "rectangle", "horizontal", "vertical"]);
  if (format !== null && !allowedFormats.has(format)) {
    throw new Error(`Unsupported AdSense format: ${format}.`);
  }
  if (layout && !["in-article", "image-side", "text-only"].includes(layout)) {
    throw new Error(`Unsupported ad layout: ${layout}.`);
  }
  if (layoutKey && layoutKey.length > 200) {
    throw new Error("Ad layout key is too long.");
  }

  return {
    publisherId,
    slotId,
    format,
    layout,
    layoutKey,
    widthPx: widthPx && widthPx > 0 ? widthPx : null,
    heightPx: heightPx && heightPx > 0 ? heightPx : null,
    fullWidthResponsive: responsive === "true" || (responsive !== "false" && !widthPx),
  };
}
