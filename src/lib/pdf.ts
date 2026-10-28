import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { toPt, type Calibration, type ProjectRecord } from './model'
import { fontBytes } from './fonts'

function colorToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
function measure(font: PDFFont, text: string, size: number, spacing: number) {
  return font.widthOfTextAtSize(text, size) + Math.max(0, Array.from(text).length - 1) * spacing
}
async function applyBackground(doc: PDFDocument, page: PDFPage, project: ProjectRecord) {
  const blob = project.sourceKind === 'physical' ? project.previewBlob : project.sourceBlob
  if (!blob) return
  if (project.sourceMime === 'application/pdf') {
    const [embedded] = await doc.embedPdf(await blob.arrayBuffer(), [0])
    page.drawPage(embedded, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  } else if (blob.type === 'image/png' || project.sourceMime === 'image/png') {
    const image = await doc.embedPng(await blob.arrayBuffer())
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  } else {
    const image = await doc.embedJpg(await blob.arrayBuffer())
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  }
}
function drawCalibration(docPage: PDFPage) {
  const w = docPage.getWidth(), h = docPage.getHeight()
  const thin = rgb(0.2, 0.48, 0.75)
  for (const [cx, cy] of [[toPt(12), toPt(12)], [w - toPt(12), toPt(12)], [toPt(12), h - toPt(12)], [w - toPt(12), h - toPt(12)]]) {
    docPage.drawLine({ start: { x: cx - 10, y: cy }, end: { x: cx + 10, y: cy }, thickness: 0.6, color: thin })
    docPage.drawLine({ start: { x: cx, y: cy - 10 }, end: { x: cx, y: cy + 10 }, thickness: 0.6, color: thin })
  }
  docPage.drawRectangle({ x: toPt(8), y: toPt(8), width: w - toPt(16), height: h - toPt(16), borderColor: rgb(0.7, 0.8, 0.9), borderWidth: 0.4 })
  // Deliberately unprinted on the production name-only output.
  // Test marks are inside 12 mm margins, so they fit many ordinary printers.
}
export async function makePdf(project: ProjectRecord, mode: 'name-only' | 'complete' | 'test', calibration: Calibration): Promise<Blob> {
  if (!Number.isFinite(project.widthMm) || project.widthMm < 50 || project.widthMm > 1200 || !Number.isFinite(project.heightMm) || project.heightMm < 50 || project.heightMm > 1200) throw new Error('Invalid paper size.')
  if (!project.layer.text.trim()) throw new Error('Enter a recipient name before exporting.')
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const page = doc.addPage([toPt(project.widthMm), toPt(project.heightMm)])
  if (mode === 'complete') {
    if (!project.sourceBlob && !project.previewBlob) throw new Error('There is no certificate background. Use Name Only or upload a certificate.')
    try { await applyBackground(doc, page, project) } catch { throw new Error('Could not embed the certificate background. Try a PNG or JPG source.') }
  }
  const layer = project.layer
  let font: PDFFont
  try { font = await doc.embedFont(await fontBytes(layer.fontId), { subset: true }) }
  catch { throw new Error('The selected font could not be embedded in this PDF. Choose another font or import a compatible TTF/OTF.') }
  const spacing = layer.letterSpacingPt
  let widthPt: number
  try { widthPt = measure(font, layer.text, layer.fontSizePt, spacing) }
  catch { throw new Error('This font cannot render every character in the name. Choose a font with suitable glyph support.') }
  const boxPt = toPt(layer.widthMm)
  if (widthPt > boxPt + 0.25) throw new Error('The name is wider than its text box. Increase the box width or use Fit Name to Width.')
  const alignmentShift = layer.align === 'center' ? (boxPt - widthPt) / 2 : layer.align === 'right' ? boxPt - widthPt : 0
  const x = toPt(layer.xMm + (mode === 'complete' ? 0 : calibration.xMm)) + alignmentShift
  // The top edge of the text box is an approximate cap-height line; use the same
  // nominal font ascent to convert from top-left mm to PDF baseline coordinates.
  const y = page.getHeight() - toPt(layer.yMm + (mode === 'complete' ? 0 : calibration.yMm)) - font.heightAtSize(layer.fontSizePt, { descender: false })
  if (x < -1 || x + widthPt > page.getWidth() + 1 || y < -1 || y + layer.fontSizePt > page.getHeight() + 2) throw new Error('The name extends outside the page. Move or resize it before exporting.')
  const color = colorToRgb(layer.color)
  if (spacing === 0) page.drawText(layer.text, { x, y, font, size: layer.fontSizePt, color })
  else {
    let cursor = x
    for (const character of Array.from(layer.text)) {
      page.drawText(character, { x: cursor, y, font, size: layer.fontSizePt, color })
      cursor += font.widthOfTextAtSize(character, layer.fontSizePt) + spacing
    }
  }
  if (mode === 'test') {
    drawCalibration(page)
    const label = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText('CERTALIGN TEST SHEET - DO NOT PRINT ON THE ORIGINAL CERTIFICATE', { x: toPt(15), y: toPt(5), size: 7, font: label, color: rgb(0.22, 0.43, 0.65) })
  }
  const bytes = await doc.save()
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
export function fileStem(title: string) { return title.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'certificate' }
