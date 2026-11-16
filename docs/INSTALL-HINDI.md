# Convia PDF Experience Repair — Hindi setup

## Is patch mein kya update hai

- Add Watermark: text + PNG/JPG logo watermark, on-page image preview, opacity, size, rotation, page selection, tiling, optional TTF/OTF font. Controlled form values always have fallbacks to avoid React controlled/uncontrolled warnings.
- Rotate PDF: page-by-page PDF.js thumbnails and rotate-left/right controls; save preserves vector/text content with pdf-lib. PDF.js loading task cleanup uses `loadingTask.destroy()` only; do not call `pdf.destroy()` on a PDFDocumentProxy.
- Fill & Sign: visible signature pad/typed visible signature ki jagah PNG/JPG signature-image upload + preview. Interactive AcroForm fields can still be filled. Optional PFX/P12 PAdES signing is available.
- Sign PDF: requires both a visible signature image and an authorized PFX/P12 certificate, plus certificate password. The certificate operation is sent to `/api/pdf/engine` and signed by Gotenberg.
- Chat with PDF / AI Summarize / AI Translate: shared assistant page with OCR option (English, Hindi, English+Hindi), page-aware text extraction, translation target selection, result download and server-side configuration status.
- Unlock PDF: correct opening password is required. This patch does not bypass or recover an unknown password.

## Install on Windows

1. ZIP extract karein.
2. ZIP ke `app`, `components`, `lib`, `scripts` folders ko `D:\convia` mein merge/copy karein. Existing folders ko replace karne ki jagah merge karein.
3. CMD:

```cmd
cd /d D:\convia
node scripts\merge-pdf-experience-dependencies.cjs
npm install
```

4. Agar `scripts\copy-pdf-worker.cjs` maujood hai, run karein:

```cmd
node scripts\copy-pdf-worker.cjs
```

5. TypeScript/build checks:

```cmd
npx tsc --noEmit
npm run build
```

6. Local test:

```cmd
npm run dev
```

Routes:
- `/pdf/watermark`
- `/pdf/rotate`
- `/pdf/fill-sign`
- `/pdf/sign`
- `/pdf/unlock`
- `/pdf/chat`
- `/pdf/summarize`
- `/pdf/translate`

## AI configuration (why the old error appeared)

`PDF AI is not configured` ka matlab API code missing nahi; server par secret `OPENAI_API_KEY` set nahi hai. Is key ko ZIP/GitHub/client JavaScript mein add nahi karna.

Local testing ke liye `D:\convia\.env.local` create karein aur ismein:

```env
OPENAI_API_KEY=your-real-server-side-key
OPENAI_MODEL=gpt-6-luna
```

`.env.local` ko GitHub par commit na karein. Hostinger par Convia Node.js application ke server Environment Variables mein same names set karein, phir application redeploy/restart karein. Site status check:

`GET /api/pdf/assistant`

Configured hone par JSON mein `configured: true` aayega. False ka matlab variable Node server tak nahi pahunch raha.

API account, billing aur secret key ka setup adult site owner/parent/guardian kare; API key kisi chat, screenshot, public repo, frontend `NEXT_PUBLIC_` variable ya client component mein share na karein. API use paid ho sakta hai; usage limits/budget set karein.

The API route uses the OpenAI Responses API and defaults to `gpt-6-luna`. Model availability and pricing depend on the API project.

## PAdES certificate configuration

- `/api/pdf/engine` route requires a configured authenticated Gotenberg 9 service.
- Hostinger server environment needs `GOTENBERG_URL`, `GOTENBERG_USERNAME`, `GOTENBERG_PASSWORD`.
- Use HTTPS for a remote engine. Do not expose these values in browser code.
- Upload only the certificate holder's authorized `.p12` / `.pfx` file and enter its password. Private-key materials are sensitive. The certificate holder or an authorized adult should supervise use, especially for legally binding documents.
- A PAdES signature is cryptographic, but a visible PNG/JPG signature image alone is not. Certificate trust depends on the issuing chain and recipient's PDF reader. PAdES does not automatically replace regulated eSign/DSC workflows or guarantee acceptance by every authority.

## Unlock PDF safety

The Unlock page requires the correct opening password and authorization to modify the PDF. No-password password cracking, bypass, or recovery is not included—even as a paid feature. If the password is unknown, obtain it from the document owner/creator or use an authorized original copy.

## Important tests

1. Watermark text mode; Hindi with uploaded TTF; transparent PNG watermark; JPG watermark; all pages and a page range.
2. Rotate PDF: rotate page 2 only, rotate all pages, then verify in a PDF reader that searchable text remains selectable.
3. Fill & Sign: fill a form field, upload a transparent PNG signature, verify the correct page and position.
4. Sign PDF: run only with an authorized test PFX certificate; verify signature details in a PDF reader. A certificate/password failure should show a readable error.
5. AI: text PDF chat, scanned English PDF with OCR, scanned Hindi PDF with OCR, translation to Hindi/English, long document limit, missing/invalid API key behavior.
6. Unlock: test with the correct password on a PDF you own/control; test incorrect password shows an error and does not create a file.

A full production build and real engine/API tests must be run in your actual Convia environment. This patch cannot manufacture the AI API key or the Gotenberg server credentials for you.
