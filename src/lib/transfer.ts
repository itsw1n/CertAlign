import JSZip from 'jszip'
import { db, saveProject } from './storage'
import { fileStem, downloadBlob } from './pdf'
import { isBuiltInFont } from './fonts'
import { projectSchema, type ProjectRecord } from './model'

const MAX_BUNDLE = 45 * 1024 * 1024
export async function exportProject(project: ProjectRecord) {
  const zip = new JSZip()
  const meta = projectSchema.parse(project)
  zip.file('manifest.json', JSON.stringify({ format: 'certalign', version: 1, project: meta, source: !!project.sourceBlob, preview: !!project.previewBlob, customFont: !isBuiltInFont(project.layer.fontId) }, null, 2))
  if (project.sourceBlob) zip.file('source.bin', project.sourceBlob)
  if (project.previewBlob) zip.file('preview.png', project.previewBlob)
  if (!isBuiltInFont(project.layer.fontId)) {
    const font = await db.fonts.get(project.layer.fontId)
    if (font) {
      zip.file('font.bin', font.blob)
      zip.file('font.json', JSON.stringify({ id: font.id, label: font.label }))
    }
  }
  const data = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 5 } })
  downloadBlob(data, `${fileStem(project.title)}.certalign`)
}
export async function importProjectBundle(file: File): Promise<ProjectRecord> {
  if (file.size > MAX_BUNDLE || file.size < 20) throw new Error('Project files must be below 45 MB.')
  let zip: JSZip
  try { zip = await JSZip.loadAsync(file) } catch { throw new Error('This is not a valid CertAlign project file.') }
  const allowed = new Set(['manifest.json', 'source.bin', 'preview.png', 'font.bin', 'font.json'])
  if (Object.keys(zip.files).some(name => !allowed.has(name))) throw new Error('Project package contains unexpected files.')
  for (const item of Object.values(zip.files)) {
    const uncompressed = (item as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0
    if (uncompressed > MAX_BUNDLE) throw new Error('Project contains an oversized file.')
  }
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) throw new Error('Project manifest is missing.')
  const manifestString = await manifestFile.async('string')
  if (manifestString.length > 100_000) throw new Error('Project manifest is too large.')
  let obj: unknown
  try { obj = JSON.parse(manifestString) } catch { throw new Error('Project metadata is invalid.') }
  if (!obj || typeof obj !== 'object') throw new Error('Invalid project data.')
  const manifest = obj as { format?: unknown; version?: unknown; project?: unknown; source?: unknown; preview?: unknown; customFont?: unknown }
  if (manifest.format !== 'certalign' || manifest.version !== 1) throw new Error('Unsupported CertAlign project version.')
  const safe = projectSchema.safeParse(manifest.project)
  if (!safe.success) throw new Error('Project settings failed validation.')
  const meta = safe.data
  const project: ProjectRecord = { ...meta, id: crypto.randomUUID(), isTemplate: false, title: `${meta.title} (imported)`.slice(0, 180), createdAt: Date.now(), updatedAt: Date.now() }
  const source = zip.file('source.bin')
  if (manifest.source === true && !source) throw new Error('Missing certificate source.')
  if (source) project.sourceBlob = new Blob([await source.async('arraybuffer')], { type: project.sourceMime })
  const preview = zip.file('preview.png')
  if (preview) project.previewBlob = new Blob([await preview.async('arraybuffer')], { type: 'image/png' })
  if (manifest.customFont && zip.file('font.bin') && zip.file('font.json')) {
    const bin = await zip.file('font.bin')!.async('arraybuffer')
    if (bin.byteLength > 8 * 1024 * 1024) throw new Error('Font is too large.')
    let metaFont: { label?: string }
    try { metaFont = JSON.parse(await zip.file('font.json')!.async('string')) } catch { throw new Error('Invalid font description.') }
    if (typeof metaFont.label !== 'string') throw new Error('Invalid font label.')
    const id = crypto.randomUUID()
    await db.fonts.put({ id, label: metaFont.label.slice(0, 90), blob: new Blob([bin]), createdAt: Date.now() })
    project.layer = { ...project.layer, fontId: id }
  } else if (manifest.customFont) {
    throw new Error('The project needs a custom font that was not included.')
  }
  await saveProject(project)
  return project
}
