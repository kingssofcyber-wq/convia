let jpegEncode = null;
let webpEncode = null;
let avifEncode = null;
let pngEncode = null;
let jxlEncode = null;
let oxipngOptimise = null;
async function loadCodec(format) {
  switch (format) {
    case "jpeg":
      if (!jpegEncode) jpegEncode = (await Promise.resolve().then(function() {
        return compress$4;
      })).encode;
      return;
    case "webp":
      if (!webpEncode) webpEncode = (await Promise.resolve().then(function() {
        return compress$3;
      })).encode;
      return;
    case "avif":
      if (!avifEncode) avifEncode = (await Promise.resolve().then(function() {
        return compress$2;
      })).encode;
      return;
    case "png":
      if (!pngEncode) pngEncode = (await Promise.resolve().then(function() {
        return compress$1;
      })).encode;
      if (!oxipngOptimise) {
        try {
          const mod = await import("./compress-BQHeLU37.js");
          oxipngOptimise = mod.optimise;
        } catch {
          oxipngOptimise = null;
        }
      }
      return;
    case "jxl":
      if (!jxlEncode) jxlEncode = (await Promise.resolve().then(function() {
        return compress;
      })).encode;
      return;
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
async function encode(imageData, format, quality) {
  await loadCodec(format);
  const q = Math.round(quality * 100);
  switch (format) {
    case "jpeg": {
      const buffer = await jpegEncode(imageData, { quality: q });
      return { buffer, actualFormat: "jpeg" };
    }
    case "webp": {
      const buffer = await webpEncode(imageData, { quality: q });
      return { buffer, actualFormat: "webp" };
    }
    case "avif": {
      const avifPromise = avifEncode(imageData, { quality: q, speed: 7 });
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AVIF_TIMEOUT")), 3e3);
      });
      try {
        const buffer = await Promise.race([avifPromise, timeout]);
        return { buffer, actualFormat: "avif" };
      } catch (error) {
        if (error instanceof Error && error.message === "AVIF_TIMEOUT") {
          await loadCodec("webp");
          const buffer = await webpEncode(imageData, { quality: q });
          return { buffer, actualFormat: "webp", badge: "Used WebP for speed" };
        }
        throw error;
      }
    }
    case "png": {
      const rawPng = await pngEncode(imageData);
      const optimised = oxipngOptimise ? await oxipngOptimise(rawPng, { level: 2 }) : rawPng;
      return { buffer: optimised, actualFormat: "png" };
    }
    case "jxl": {
      const buffer = await jxlEncode(imageData, { quality: q, effort: 5 });
      return { buffer, actualFormat: "jxl" };
    }
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
async function decodeInWorker(blob, maxDimension) {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("decode-unsupported");
  }
  const bitmap = await createImageBitmap(blob);
  let w = bitmap.width;
  let h = bitmap.height;
  if (maxDimension && (w > maxDimension || h > maxDimension)) {
    const s = maxDimension / Math.max(w, h);
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("decode-unsupported");
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return ctx.getImageData(0, 0, w, h);
}
self.onmessage = async (e) => {
  const { type, id, format, quality, width, height, buffer, blob, maxDimension } = e.data;
  if (type !== "encode" && type !== "decode-encode") return;
  try {
    const imageData = type === "decode-encode" ? await decodeInWorker(blob, maxDimension) : new ImageData(new Uint8ClampedArray(buffer), width, height);
    const start = performance.now();
    const result = await encode(imageData, format, quality);
    const elapsed = performance.now() - start;
    self.postMessage(
      {
        type: "result",
        id,
        format: result.actualFormat,
        buffer: result.buffer,
        size: result.buffer.byteLength,
        elapsed,
        badge: result.badge
      },
      [result.buffer]
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : "Encoding failed"
    });
  }
};
var compress$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var compress$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var compress$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var compress$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
var compress = /* @__PURE__ */ Object.freeze({
  __proto__: null
});
//# sourceMappingURL=compressionWorker-B48Cp-sm.js.map
