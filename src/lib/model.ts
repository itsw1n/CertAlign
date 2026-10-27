import { z } from 'zod'

export const PAGE_SIZES = [
  { id: 'a4-l', label: 'A4 · Landscape', widthMm: 297, heightMm: 210 },
  { id: 'a4-p', label: 'A4 · Portrait', widthMm: 210, heightMm: 297 },
  { id: 'letter-l', label: 'Letter · Landscape', widthMm: 279.4, heightMm: 215.9 },
  { id: 'letter-p', label: 'Letter · Portrait', widthMm: 215.9, heightMm: 279.4 },
  { id: 'legal-l', label: 'Legal · Landscape', widthMm: 355.6, heightMm: 215.9 },
  { id: 'legal-p', label: 'Legal · Portrait', widthMm: 215.9, heightMm: 355.6 },
  { id: 'custom', label: 'Custom dimensions', widthMm: 297, heightMm: 210 },
] as const

export const layerSchema = z.object({
  text: z.string().max(300),
  xMm: z.number().finite().min(-200).max(1200),
  yMm: z.number().finite().min(-200).max(1200),
  widthMm: z.number().finite().min(10).max(1200),
  fontId: z.string().min(1).max(120),
  fontSizePt: z.number().finite().min(6).max(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(['left', 'center', 'right']),
  letterSpacingPt: z.number().finite().min(-3).max(15),
})
export const projectSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(180),
  sourceKind: z.enum(['digital', 'physical', 'manual', 'sample']),
  sourceName: z.string().max(255),
  sourceMime: z.string().max(100),
  widthMm: z.number().finite().min(50).max(1200),
  heightMm: z.number().finite().min(50).max(1200),
  paperPreset: z.string().max(40),
  outputMode: z.enum(['name-only', 'complete']),
  layer: layerSchema,
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
  isTemplate: z.boolean(),
})
export type ProjectMeta = z.infer<typeof projectSchema>
export type NameLayer = ProjectMeta['layer']
export type OutputMode = ProjectMeta['outputMode']
export type ProjectRecord = ProjectMeta & {
  sourceBlob?: Blob
  previewBlob?: Blob
}
export type FontRecord = { id: string; label: string; blob: Blob; createdAt: number }
export type Calibration = { xMm: number; yMm: number }
export const INITIAL_CALIBRATION: Calibration = { xMm: 0, yMm: 0 }

export function newProject(kind: ProjectMeta['sourceKind'] = 'manual'): ProjectRecord {
  const now = Date.now()
  return {
    id: crypto.randomUUID(), title: kind === 'physical' ? 'Printed certificate' : kind === 'sample' ? 'Workshop sample' : 'Untitled certificate',
    sourceKind: kind, sourceName: '', sourceMime: '', widthMm: 297, heightMm: 210, paperPreset: 'a4-l',
    outputMode: kind === 'physical' || kind === 'manual' ? 'name-only' : 'complete',
    layer: { text: '', xMm: 43, yMm: 100, widthMm: 211, fontId: 'garamond', fontSizePt: 32, color: '#18354b', align: 'center', letterSpacingPt: 0 },
    createdAt: now, updatedAt: now, isTemplate: false,
  }
}
export const toPt = (millimeters: number) => millimeters * 72 / 25.4
export const fromPt = (points: number) => points * 25.4 / 72
export const round = (value: number, digits = 1) => Number(value.toFixed(digits))
export function fileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB` }
export function updatePaper(project: ProjectRecord, widthMm: number, heightMm: number, paperPreset: string): ProjectRecord {
  const oldCenter = project.layer.xMm + project.layer.widthMm / 2
  const newWidth = Math.min(project.layer.widthMm, Math.max(10, widthMm - 14))
  return { ...project, widthMm, heightMm, paperPreset, layer: {
    ...project.layer, xMm: Math.max(0, Math.min(widthMm - newWidth, oldCenter + (widthMm - project.widthMm) / 2 - newWidth / 2)),
    widthMm: newWidth,
  } }
}
