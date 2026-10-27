# CertAlign — acceptance checklist

This is an execution checklist, **not a claim that hardware/production tests have already passed**.

## Installation/build
- [ ] `npm install` succeeds on a networked Node.js 22+ computer
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` writes `/out` static build and the PDF.js worker is served at `/pdf.worker.min.mjs`
- [ ] `/`, `/editor?project=...`, `/projects`, `/settings`, `/help` work under a static file server (with URL navigation)

## User input
- [ ] New digital PNG/JPEG uploads and displays correctly
- [ ] A valid single-page PDF renders a thumbnail and exports with its original background
- [ ] Multi-page PDFs visibly use only the first page
- [ ] Invalid/mislabeled/oversized image or PDF displays actionable error
- [ ] Printed photo can be rotated, 4-point cropped, and previewed before editing
- [ ] Manual setup allows custom mm paper size without image

## Editing
- [ ] Type name, drag it, change X/Y with numeric inputs, center it
- [ ] Zoom does not alter PDF coordinates
- [ ] Width fit prevents text clipping
- [ ] Font search, bundled fonts, and upload of real TTF/OTF work
- [ ] Undo/redo, alignment buttons, letter spacing and color work
- [ ] Mobile controls remain reachable without horizontal overflow
- [ ] Keyboard-only user can enter a name, choose a font and numeric position, and export PDF

## Output (inspect generated PDF, not only browser canvas)
- [ ] Name-only output has **zero** embedded background/reference image or calibration marks
- [ ] Complete output retains original background and includes entered name
- [ ] Test PDF has visible corner targets that are absent from production PDF
- [ ] A4 297×210 mm / Letter 279.4×215.9 mm page MediaBox matches expected points
- [ ] Text stays within output page, warns/fails if it doesn't
- [ ] PDF uses embedded chosen font, including accented-glyph fixture
- [ ] Physical calibration offset changes name location by exact specified mm
- [ ] Actual Size / 100% printing tested on at least two printers & paper feeds

## Persistence/transfer
- [ ] Browser refresh and restart restores image, name, font and coordinates
- [ ] Deleting/duplicating/saving as template behaves correctly
- [ ] A `.certalign` export imported on another browser/device keeps assets/settings
- [ ] Imported font persists, exports PDF, and does not require remote connection
- [ ] Invalid/oversized project ZIP rejected safely
- [ ] Browser storage disabled or quota exceeded surfaces an accurate error, not “Saved”
- [ ] Clear local data removes projects/custom fonts

## Print safety checklist
- [ ] Set paper orientation and physical measurements correctly
- [ ] Test print using ordinary paper and check overlay against the original
- [ ] Match paper feeder and print setting to test (Actual Size / 100%)
- [ ] Only feed the actual certificate after verifying the test position
