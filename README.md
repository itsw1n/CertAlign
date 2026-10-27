# CertAlign

A static, browser-first web app that positions and prints recipient names on **existing physical or digital certificates**. Built with Next.js, TypeScript, React Aria Components, Tailwind CSS v4, Lucide React, React Konva, PDF.js, pdf-lib and IndexedDB/Dexie.

## Requirements
- Node.js **22 LTS or newer**
- npm and internet access **for the initial package install**
- Chromium, Edge, Firefox, or Safari (recent version); desktop recommended for calibration

## Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in a browser. Windows users can alternatively double-click **START-CERTALIGN.bat** (requires Node.js and internet for first install). `npm install` automatically copies the locally served PDF.js worker to `public/pdf.worker.min.mjs`.

## Production static build

```bash
npm run typecheck
npm run build
```

Serve the generated `out/` directory as a static website (HTTPS recommended). There is **no backend**, login, hosted database, or secret key. Static Next.js output supports the following routes: `/`, `/editor`, `/projects`, `/settings`, `/help`.

## How to use

1. On Home, choose **I have a digital certificate** (PNG/JPG/PDF), **I have a printed certificate** (camera/photo), or **I don't have an image** (manual measurements). You can also open **Try a sample**.
2. On **Prepare**, confirm paper dimensions. For printed photos, use **Correct photo** to manually straighten the four corners.
3. On **Add name**, type recipient name, select a bundled font, adjust size/color/spacing and drag the text or enter accurate X/Y millimeter positions. Use the **Fit name to width** control if necessary.
4. On **Print**, choose **Print just the name** (physical certificate) or **Full certificate PDF** (digital document). Generate a test sheet, calibrate millimeter offsets, then download/open your PDF.
5. Work autosaves to IndexedDB. Go to **My projects** to resume, duplicate, create layouts/templates or export portable `.certalign` backups. Import them on another device to continue there.

## Core implemented features

- Static routes, guided 3-step workflow, clean responsive UI, no login
- Image import with magic-byte validation, 30 MB limit; PDF first-page import/preview
- Physical certificate photo upload, 4-corner manual photo rectification and rotation
- Actual paper-size controls (A4, Letter, Legal, custom); manual/no-image option
- React Konva name placement, zoom, guides, drag, undo/redo, numeric mm controls
- Curated locally bundled fonts, searchable React Aria ComboBox, custom TTF/OTF uploads
- PDF generator with embedded fonts; printable name-only PDF **without any certificate background**; complete PDF mode
- Test-sheet calibration using X/Y mm shifts, plain-paper confirmation and printing checklist
- IndexedDB autosave and recovery, saved projects and templates, portable `.certalign` ZIP bundle
- Basic keyboard-accessible forms, dialogs and responsive layouts
- Storage/privacy settings, local storage cleanup, printing instructions

## Current limitations (important)

- **No automated perspective detection**: manually position the four crop corners. The Canvas2D mesh provides approximate straightening; test intricate/photo-skewed certificates before final printing.
- **PDF input previews the first page only**. Unsupported or encrypted PDFs may fail to import. Rotated/cropped pages require more advanced validation.
- **Fonts:** eleven included font styles and compatible TTF/OTF imports, not every existing commercial font. Some fonts or non-Latin glyphs may fail embedding; a clear error is shown rather than silently substituting.
- **Preview-to-print placement:** geometry is in millimeters and font metrics determine the PDF baseline; printer feed differences mean always use a **test sheet**. Physical printer behavior cannot be controlled from the browser.
- **No cross-device automatic sync**. Project exports are the transfer mechanism. Clearing browser data loses locally saved projects unless previously exported.
- **No batch CSV generator or automatic name-area detection**; these are deferred from the plan to later phases.
- Files are processed in the browser; external requests are only for the static website bundles and locally hosted assets.

## Validation note

The source was generated and checked for TypeScript/TSX parsing and file completeness. The authoring environment **could not reach the npm registry**, so `npm install`, Next.js type-check/build, browser smoke tests, PDF font embedding verification, and physical-printer tests **could not be run here**. Run the commands above on a networked machine before deploying or relying on it for real certificate printing.

## Project contents

- `src/app` — static routes, theme and guided screens
- `src/features` — Konva canvas and photo rectification UI
- `src/components/common` — canonical React Aria Button, Select, Modal, AlertDialog, FontComboBox
- `src/lib` — schemas, PDF generation, font registry, secure bundle import/export, persistence
- `public/fonts` — bundled font files and license notices
- `public/sample` — demo certificate reference
- `docs/DEVELOPMENT_PLAN.md` — approved full development plan
- `docs/user-rules` — supplied React Aria and architecture rules
- `docs/TESTING_CHECKLIST.md` — specific functional, PDF and real-printer acceptance tests

## Privacy

Certificate assets and names persist only in the current browser's IndexedDB. There is no application-level remote upload, cloud account, or telemetry. A static host may still see access logs. Users on shared browser profiles can view locally saved documents. Avoid storing sensitive certificates on shared devices.

## License

App source: provided for your project use. Bundled fonts retain their respective licenses in `public/fonts/LICENSE-*.txt`; review before redistribution. Third-party dependencies retain their own licenses.
