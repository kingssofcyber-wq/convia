# CONVIA – Professional PDF Engine Upgrade (Hindi Guide)

## Is ZIP me kya hai

Yeh pehle wale **Convia All PDF Tools Premium Patch** ka incremental upgrade hai. Isme updated Annotate, PDF-to-Excel, PDF-to-Word, PDF-to-PowerPoint, Fill & Sign / Sign, Chat with PDF / AI Summarize, server engine API aur engine-backed conversion pages hain. `/pdf/edit` jaan-boojhkar change nahi kiya gaya.

## 1) Files copy karein

1. ZIP ko extract karein.
2. Extracted folders `app`, `components`, `lib`, `scripts`, `infra`, `docs` ko `D:\convia` me copy/merge karein.
3. Windows ke overwrite prompt par in listed files ko replace karna theek hai; `package.json`, `package-lock.json`, `.env`, Supabase aur AdSense config ko manually overwrite na karein.
4. `app/pdf/edit/page.tsx` ko bilkul na badlein.

## 2) Dependencies safely merge karein

CMD me:

```cmd
cd /d D:\convia
node scripts\merge-advanced-pdf-dependencies.cjs
npm install
npx tsc --noEmit
npm run build
```

Yeh script existing dependencies aur scripts ko preserve karte hue sirf missing package `docx`/PDF dependencies add karta hai. `next.config.mjs` me type checking skip configured ho sakta hai, isliye `npx tsc --noEmit` ko alag se chalana bhi zaroori hai. `package-lock.json` `npm install` se update hoga. Existing `postinstall` worker scripts ko delete nahi karta.

Build successful hone par:

```cmd
npm run dev
```

Local URLs:

- `http://localhost:3000/pdf/annotate`
- `http://localhost:3000/pdf/pdf-to-excel`
- `http://localhost:3000/pdf/pdf-to-word`
- `http://localhost:3000/pdf/pdf-to-ppt`
- `http://localhost:3000/pdf/fill-sign`
- `http://localhost:3000/pdf/sign`
- `http://localhost:3000/pdf/chat`
- `http://localhost:3000/pdf/summarize`
- `http://localhost:3000/pdf/word-to-pdf`
- `http://localhost:3000/pdf/excel-to-pdf`
- `http://localhost:3000/pdf/ppt-to-pdf`
- `http://localhost:3000/pdf/html-to-pdf`
- `http://localhost:3000/pdf/pdf-to-pdfa`
- `http://localhost:3000/pdf/protect`
- `http://localhost:3000/pdf/unlock`

## 3) Server engine (required for advanced tools)

Word/Excel/PowerPoint/HTML to PDF, PDF/A remediation, AES-256 protect/unlock aur certificate-backed PAdES signing ko server-side Gotenberg 9 + LibreOffice + Chromium chahiye. Sirf website ka ZIP copy karne se ye engine automatically install nahi hota.

`infra/gotenberg/compose.yml` ko Docker-capable VPS/container host par run karein. Compose file Gotenberg ko `127.0.0.1:3000` par bind karti hai, Basic Auth enable karti hai aur untrusted HTML conversions ke liye JavaScript / downloadFrom disable rakhti hai. Gotenberg ko direct public internet par expose na karein. Agar Next.js site alag Hostinger Node app par hai to engine ko separate Docker-capable host par run karke HTTPS reverse proxy ke peeche rakhein.

Hostinger Node.js application ke server environment me `.env.pdf-engine.example` ke variables set karein:

- `GOTENBERG_URL` – private HTTPS engine endpoint
- `GOTENBERG_USERNAME`
- `GOTENBERG_PASSWORD`
- `OPENAI_API_KEY` – optional, only if Chat/Summarize enabled
- `OPENAI_MODEL` – optional; default `gpt-6-luna`

Real passwords/API keys kabhi GitHub me commit na karein. `.env.pdf-engine.example` sirf sample hai; isko real credentials se replace karke Git par push na karein. Hostinger environment values save karne ke baad app redeploy/restart karein.

**Important:** Hostinger Business Node.js app me Docker availability plan/account par depend kar sakti hai. Agar Docker Compose run karne ka option nahi hai, Gotenberg ko separate Docker-enabled VPS ya managed container host par run karna hoga. Node.js website API us secure HTTPS endpoint ko call karegi.

The API accepts files up to 60 MB, but Hostinger/proxy request-body limits may be lower. Configure upstream limits above the intended upload size or lower the Convia UI cap. The included per-process rate limits are a basic guard, not a distributed quota; add gateway/Redis limits before a public high-traffic launch.

## 4) Feature notes

### Annotate PDF

Highlight, underline, strike, freehand pen, line, arrow, rectangle, ellipse, text, comment/note, PNG/JPG image, page navigation, undo, clear-page aur export active hain. Export marks ko page content me flatten karta hai, isliye output me stable dikhenge; export ke baad har mark separate editable PDF annotation object nahi rahega. Rotated/cropped PDFs par placement zaroor test karein.

### PDF to Excel

PDF.js text coordinates se row baselines, repeated x-starts aur horizontal gaps detect karke page-wise worksheets banata hai. Scanned pages ke liye optional Tesseract OCR (English/Hindi) hai. Yeh iLovePDF ke proprietary Solid Documents engine ka source/algorithm copy nahi karta; complex merged cells, border-only tables, nested tables, multi-line financial rows aur low-quality scans ko manual review ki zarurat ho sakti hai.

### PDF to Word / PowerPoint

Word conversion selectable text, approximate font emphasis/indent aur detected row tables ko DOCX me reconstruct karta hai; scanned pages par OCR checkbox available hai. PDF-to-PowerPoint me editable text mode (OCR optional) aur full-page visual mode dono hain. Original vector shapes, photos, complex columns aur exact page layout 1:1 editable objects me reconstruct nahi hote. Visual mode original appearance ko slide-image ke roop me preserve karta hai.

### Fill & Sign / Sign PDF

AcroForm text, checkbox, dropdown/radio fields fill ho sakte hain; drawn signature image bhi add hoti hai. PKCS#12 `.p12/.pfx` ke saath PAdES cryptographic signature ke liye private server-side Gotenberg engine configured hona chahiye. Visible drawn signature alone cryptographic signature nahi hai. Sirf signer ki apni/authorized certificate use karein; certificate password/private key sensitive hota hai aur configured engine ko bheja jata hai. Minor user ke liye certificate owner/adult guardian ki supervision zaroori hai. Trusted status certificate authority chain aur PDF reader trust store par depend karta hai. Signature se pehle document ke saare edits complete karein.

### Chat with PDF / AI Summarize

Requires `OPENAI_API_KEY`. Extracted document text (PDF binary nahi) AI provider ko bheja jata hai. Sensitive documents upload na karein jab tak site owner data handling se comfortable na ho. API key and billing site owner/adult guardian manage karein. API usage paid ho sakti hai. Scanned PDF ke liye pehle OCR run karein; long documents are capped and may need splitting.

### PDF/A

Engine `/forms/pdf/remediate` use karta hai. Gotenberg `Gotenberg-Remediation-Residual` header report karta hai; zero means its remediation engine reports no remaining violations. Important archive ke liye independent PDF/A validator bhi use karein. Engine 200 status return kar sakta hai while residual violations remain.

## 5) Test checklist (small sample files first)

- Annotate: markups on page 1 and page 3; different page sizes; rotation; delete one mark; export and reopen.
- PDF to Excel: searchable invoice, bank-like statement, border-grid table, merged headers, scanned English table, scanned Hindi table; compare totals against source.
- PDF to Word: selectable text, multiple columns, table, Hindi text, scanned pages with OCR enabled.
- PDF to PowerPoint: editable mode, scanned mode with OCR, visual mode, portrait and landscape pages.
- Fill & Sign: blank AcroForm fields, dropdown, checkbox, long text, page selection; separately test a non-sensitive sample for PAdES in a trusted PDF reader.
- Word/Excel/PowerPoint to PDF: sample .docx, .xlsx, .pptx, charts, print area, page breaks, fonts.
- HTML to PDF: inline CSS/data images; ensure external links/scripts are not required.
- Protect/Unlock: AES-256 password protect; reopen; unlock using the correct password; verify wrong password fails.
- PDF/A: check residual count and validate separately.
- Chat/Summarize: searchable PDF, then a scanned PDF after OCR; verify page references and factual answers.

## 6) Deploy

First `npm run build` must pass locally. Then commit only intended files. Check `git status` and confirm `.env*` secrets are not staged. Push to the existing `main` branch only after the local build succeeds. After Hostinger deployment, test all routes and engine health.
