import { db } from './storage'
import type { FontRecord } from './model'

export const BUILTIN_FONTS = [
  { id: 'garamond', label: 'EB Garamond', category: 'Classic serif', file: '/fonts/eb-garamond.ttf', css: 'CertGaramond' },
  { id: 'freeserif', label: 'FreeSerif', category: 'Elegant serif', file: '/fonts/free-serif.ttf', css: 'CertFreeSerif' },
  { id: 'freeitalic', label: 'FreeSerif Italic', category: 'Script-inspired', file: '/fonts/free-serif-italic.ttf', css: 'CertFreeItalic' },
  { id: 'liberation', label: 'Liberation Serif', category: 'Formal serif', file: '/fonts/liberation-serif.ttf', css: 'CertLiberation' },
  { id: 'dejavu', label: 'DejaVu Serif', category: 'Classic serif', file: '/fonts/dejavu-serif.ttf', css: 'CertDejaVu' },
  { id: 'lato', label: 'Lato', category: 'Modern sans', file: '/fonts/lato-regular.ttf', css: 'CertLato' },
  { id: 'latobold', label: 'Lato Bold', category: 'Bold sans', file: '/fonts/lato-bold.ttf', css: 'CertLatoBold' },
  { id: 'charisitalic', label: 'Charis Italic', category: 'Formal italic', file: '/fonts/charis-italic.ttf', css: 'CertCharisItalic' },
  { id: 'gentium', label: 'Gentium Plus', category: 'Literary serif', file: '/fonts/gentium-plus.ttf', css: 'CertGentium' },
  { id: 'comfortaa', label: 'Comfortaa', category: 'Soft geometric', file: '/fonts/comfortaa.ttf', css: 'CertComfortaa' },
  { id: 'lobster', label: 'Lobster Two Italic', category: 'Decorative script', file: '/fonts/lobster-two-italic.otf', css: 'CertLobster' },
] as const
export function isBuiltInFont(id: string) { return BUILTIN_FONTS.some(f => f.id === id) }
export type FontChoice = { id: string; label: string; category: string; css: string; file?: string }
export function fontName(fontId: string, records: FontRecord[] = []) { return allFonts(records).find(f => f.id === fontId)?.label || 'Unknown font' }
export function allFonts(records: FontRecord[] = []): FontChoice[] { return [...BUILTIN_FONTS, ...records.map(f => ({ id: f.id, label: f.label, category: 'My fonts', css: `custom-${f.id}` }))] }
export async function fontBytes(fontId: string): Promise<ArrayBuffer> {
  const built = BUILTIN_FONTS.find(f => f.id === fontId)
  if (built) {
    const response = await fetch(built.file)
    if (!response.ok) throw new Error(`Could not load ${built.label} font. Please try again.`)
    return response.arrayBuffer()
  }
  const record = await db.fonts.get(fontId)
  if (!record) throw new Error('Selected custom font is missing. Choose another font or import it again.')
  return record.blob.arrayBuffer()
}
export async function loadFont(fontId: string) {
  const built = BUILTIN_FONTS.find(f => f.id === fontId)
  if (built) { await document.fonts.load(`24px "${built.css}"`); return built.css }
  const record = await db.fonts.get(fontId)
  if (!record) return 'CertGaramond'
  const family = `custom-${record.id}`
  if (!document.fonts.check(`24px "${family}"`)) {
    const face = new FontFace(family, await record.blob.arrayBuffer())
    await face.load()
    document.fonts.add(face)
  }
  return family
}
export async function importCustomFont(file: File) {
  if (!/\.(ttf|otf)$/i.test(file.name) || file.size > 8 * 1024 * 1024 || file.size < 100) throw new Error('Choose a TTF or OTF font under 8 MB.')
  const bytes = await file.arrayBuffer()
  const view = new DataView(bytes)
  const tag = view.getUint32(0)
  if (![0x00010000, 0x4f54544f, 0x74727565].includes(tag)) throw new Error('This does not appear to be a supported TTF/OTF font.')
  const id = crypto.randomUUID()
  const family = `custom-${id}`
  try { const face = new FontFace(family, bytes); await face.load(); document.fonts.add(face) }
  catch { throw new Error('This font could not be loaded. Try a different TTF/OTF file.') }
  const record: FontRecord = { id, label: file.name.replace(/\.(ttf|otf)$/i, '').replace(/[-_]+/g, ' ').slice(0, 90), blob: new Blob([bytes]), createdAt: Date.now() }
  await db.fonts.put(record)
  return record
}
