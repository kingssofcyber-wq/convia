# Existing PDF tool pages — common header and progress integration

This package deliberately does **not** overwrite your existing functional tool pages (`compress`, `organize`, `extract`, `merge`, `split`, `watermark`). Their PDF processing logic is unique and must be retained.

## 1. Make the hero identical on every PDF page

At the top of an existing page add:

```tsx
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
```

Replace only the large, inconsistent hero/header block with:

```tsx
<ToolPageHeader
  title="Compress PDF"
  description="Reduce PDF file size with adjustable image quality."
/>
```

For each page change only `title` and `description`. The component fixes the same height, gradient, typography, spacing and Back button for all tools.

Do not wrap or remove your existing upload, preview, compression, extraction, drag/drop, worker, or download logic.

## 2. Add the common processing bar

Import:

```tsx
import { ProcessingProgress } from "@/components/pdf/processing-progress";
```

Keep `progress` and `status` in your existing tool state and render:

```tsx
<ProcessingProgress
  progress={progress}
  status={isProcessing ? "processing" : isComplete ? "completed" : hasError ? "error" : "idle"}
  label={isProcessing ? "Processing your PDF…" : undefined}
  detail="Keep this tab open until processing finishes."
/>
```

Update `progress` from the actual processing callback. Do not fake 0–100 progress when the underlying library cannot report it; use indeterminate/loading UI in that case.

## 3. Optional upload component

`UploadDropzone` is included for new tools. Existing working tool pages can keep their current upload controls.

## 4. Pages still marked Coming Soon

`app/pdf/[slug]/page.tsx` catches tool routes that do not have a specific page file. Existing static routes have priority in Next.js and continue using their current implementation. The fallback gives all remaining listed tools a consistent Coming Soon screen instead of a 404.
