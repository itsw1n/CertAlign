# CertAlign — acceptance checklist

This is an execution checklist, **not a claim that hardware/production tests have already passed**.

> **Run status:** 2026-10-27 — **32/37 passed** against the production static build in headless Chromium. The five unchecked items require physical printers/paper feeds. See [Run notes](#run-notes).

## Installation/build
- [x] `npm install` succeeds on a networked Node.js 22+ computer
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run build` writes `/out` static build and the PDF.js worker is served at `/pdf.worker.min.mjs`
- [x] `/`, `/editor?project=...`, `/projects`, `/settings`, `/help` work under a static file server (with URL navigation)

## User input
- [x] New digital PNG/JPEG uploads and displays correctly
- [x] A valid single-page PDF renders a thumbnail and exports with its original background
- [x] Multi-page PDFs visibly use only the first page
- [x] Invalid/mislabeled/oversized image or PDF displays actionable error
- [x] Printed photo can be rotated, 4-point cropped, and previewed before editing
- [x] Manual setup allows custom mm paper size without image

## Editing
- [x] Type name, drag it, change X/Y with numeric inputs, center it
- [x] Zoom does not alter PDF coordinates
- [x] Width fit prevents text clipping
- [x] Font search, bundled fonts, and upload of real TTF/OTF work
- [x] Undo/redo, alignment buttons, letter spacing and color work
- [x] Mobile controls remain reachable without horizontal overflow
- [x] Keyboard-only user can enter a name, choose a font and numeric position, and export PDF

## Output (inspect generated PDF, not only browser canvas)
- [x] Name-only output has **zero** embedded background/reference image or calibration marks
- [x] Complete output retains original background and includes entered name
- [x] Test PDF has visible corner targets that are absent from production PDF
- [x] A4 297×210 mm / Letter 279.4×215.9 mm page MediaBox matches expected points
- [x] Text stays within output page, warns/fails if it doesn't
- [x] PDF uses embedded chosen font, including accented-glyph fixture
- [x] Physical calibration offset changes name location by exact specified mm
- [ ] Actual Size / 100% printing tested on at least two printers & paper feeds — **requires hardware**

## Persistence/transfer
- [x] Browser refresh and restart restores image, name, font and coordinates
- [x] Deleting/duplicating/saving as template behaves correctly
- [x] A `.certalign` export imported on another browser/device keeps assets/settings
- [x] Imported font persists, exports PDF, and does not require remote connection
- [x] Invalid/oversized project ZIP rejected safely
- [x] Browser storage disabled or quota exceeded surfaces an accurate error, not “Saved”
- [x] Clear local data removes projects/custom fonts

## Print safety checklist
- [ ] Set paper orientation and physical measurements correctly — **requires hardware**
- [ ] Test print using ordinary paper and check overlay against the original — **requires hardware**
- [ ] Match paper feeder and print setting to test (Actual Size / 100%) — **requires hardware**
- [ ] Only feed the actual certificate after verifying the test position — **requires hardware**

## Run notes

- Environment: Node.js 22.23.2, `npm ci`, production static export (`out/`) served with `serve`, headless Chromium.
- PDF checks used `pdfinfo`, `pdftotext -bbox`, `qpdf`, and rendered page pixels — not only the browser canvas.
- The remaining five items need physical printers, paper feeds, and the original certificate; they cannot be verified in CI.
- Minor observation: `/favicon.ico` returns 404 (cosmetic console noise only).
- `npm audit` reports 3 vulnerabilities (1 moderate, 2 high); not addressed in this test run.
