# Convia Compress PDF V4

## What changed
- Target-size bytes are created using the SDK's documented `toBytes()` helper (the previous page passed a raw number directly).
- Auto mode now tries High → Balanced → Strong → Maximum and stops once the requested target is reached.
- If the target cannot be met, the smallest valid output among the attempted profiles is retained and its real Blob size is shown.
- The download is generated from the exact result Blob whose size is displayed.
- Target reduction is capped at 95%, because 100% reduction means a zero-byte file, which cannot be a valid PDF.

## Install

The project already uses `@fileslim/compress`. Check that the installed version is 2.5.0 or newer:

```bash
npm list @fileslim/compress
```

For its optional higher-quality image encoders, the SDK README recommends:

```bash
npm install @jsquash/jpeg @jsquash/png @jsquash/webp @jsquash/avif @jsquash/oxipng
```

These are optional enhancements, not a guarantee of a specific reduction. Keep the existing worker patch and `postinstall` setup that currently works in your project; this package does not overwrite it.

## Replace

Replace only:

`app/pdf/compress/page.tsx`

Then run:

```bash
npm run dev
npm run build
```

## Important

A 40 MB PDF with 37 MB of already-compressed images, vectors, fonts, or other data may not shrink much. The tool recompresses embedded images and can downsample them under stronger profiles. Strong/Maximum may visibly soften photos and fine print. A 95% requested reduction is a target, not a promise. Always compare the actual output and keep the original.
