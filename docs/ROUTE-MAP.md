# Convia route map in this package

## Existing routes kept in place
- `/pdf/compress`
- `/pdf/merge`
- `/pdf/split`
- `/pdf/organize`
- `/pdf/extract`
- `/pdf/watermark`

These existing files are not included in this patch so their processing logic is not overwritten. They should import `ToolPageHeader` and `ProcessingProgress` to adopt the new UI.

## Coming Soon fallback routes
The dynamic `app/pdf/[slug]/page.tsx` serves a standard Coming Soon page for all other tool slugs in `lib/tools.ts`, including:
- `/pdf/pdf-to-word`
- `/pdf/word-to-pdf`
- `/pdf/pdf-to-jpg`
- `/pdf/jpg-to-pdf`
- `/pdf/excel-to-pdf`
- `/pdf/ppt-to-pdf`
- `/pdf/rotate`
- `/pdf/delete-pages`
- `/pdf/crop`
- `/pdf/page-numbers`
- `/pdf/protect`
- `/pdf/unlock`
- `/pdf/sign`
- `/pdf/edit`
- `/pdf/ocr`
- `/pdf/repair`
- `/pdf/flatten`
- `/pdf/redact`
- `/pdf/compare`
- `/pdf/annotate`
- `/pdf/add-image`
- `/pdf/html-to-pdf`
- `/pdf/text-to-pdf`
- `/pdf/metadata`

`/login` and `/signup` are consistent Coming Soon placeholders until real authentication is implemented.

Finance, insurance and health sections are currently homepage navigation/overview cards only. Their calculators and content pages still need to be built.

## Finance / Insurance / Health landing pages in this package
- `/loans/emi-calculator`, `/loans/loan-planner`, `/loans/interest-calculator` — Coming Soon fallback pages.
- `/insurance` — informational Coming Soon landing page.
- `/health`, `/health/bmi`, `/health/water-intake`, `/health/age-calculator` — Coming Soon pages.
