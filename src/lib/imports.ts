import { newProject, updatePaper, type ProjectRecord } from './model'

const MAX_SOURCE_BYTES = 30 * 1024 * 1024
export async function blobToPreview(blob: Blob): Promise<Blob> {
  const image = await createImageBitmap(blob)
  if (image.width * image.height > 24_000_000) { image.close(); throw new Error('Image is too large (maximum 24 megapixels).') }
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 2000 / Math.max(image.width, image.height))
  canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable on this device.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()
  return new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Failed to create an image preview.')), 'image/png'))
}
export async function validateSource(file: File) {
  if (file.size === 0 || file.size > MAX_SOURCE_BYTES) throw new Error('Choose a file between 1 byte and 30 MB.')
  const data = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isPDF = data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70
  const isPNG = data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71
  const isJPG = data[0] === 255 && data[1] === 216 && data[2] === 255
  if (!isPDF && !isPNG && !isJPG) throw new Error('Unsupported file. Please upload a PDF, PNG, or JPG certificate.')
  return isPDF ? 'application/pdf' : isPNG ? 'image/png' : 'image/jpeg'
}
async function pdfPreview(data: ArrayBuffer): Promise<{ blob: Blob; w: number; h: number }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const loading = pdfjs.getDocument({ data: new Uint8Array(data) })
  const doc = await loading.promise
  const page = await doc.getPage(1)
  const viewport = page.getViewport({ scale: Math.min(2, 1600 / page.getViewport({ scale: 1 }).width) })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(v => v ? resolve(v) : reject(new Error('Unable to preview PDF.')), 'image/png'))
  const native = page.getViewport({ scale: 1 })
  await doc.destroy()
  return { blob, w: native.width * 25.4 / 72, h: native.height * 25.4 / 72 }
}
export async function projectFromFile(file: File, kind: 'digital' | 'physical'): Promise<ProjectRecord> {
  const mime = await validateSource(file)
  if (kind === 'physical' && mime === 'application/pdf') throw new Error('For printed certificates, choose a photo (JPG or PNG).')
  const project = newProject(kind)
  project.title = file.name.replace(/\.[^.]+$/, '').slice(0, 100) || 'New certificate'
  project.sourceBlob = file
  project.sourceMime = mime
  project.sourceName = file.name
  if (mime === 'application/pdf') {
    try {
      const preview = await pdfPreview(await file.arrayBuffer())
      project.previewBlob = preview.blob
      const size = updatePaper(project, preview.w, preview.h, 'custom')
      return { ...size, sourceBlob: file, previewBlob: preview.blob }
    } catch { throw new Error('Could not read this PDF. Password-protected or damaged PDFs are not supported.') }
  }
  project.previewBlob = await blobToPreview(file)
  return project
}
export async function sampleProject(): Promise<ProjectRecord> {
  const p = newProject('sample')
  const response = await fetch('/sample/workshop-certificate.svg')
  if (!response.ok) throw new Error('Sample certificate is unavailable.')
  const svg = await response.blob()
  const url = URL.createObjectURL(svg)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1684; canvas.height = 1191
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Sample could not be generated.')), 'image/png'))
    return { ...p, sourceBlob: blob, previewBlob: blob, sourceMime: 'image/png', sourceName: 'workshop-certificate.png', layer: { ...p.layer, text: 'Juan Dela Cruz', yMm: 96 } }
  } finally { URL.revokeObjectURL(url) }
}
