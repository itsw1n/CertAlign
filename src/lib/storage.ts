import Dexie, { type Table } from 'dexie'
import type { ProjectRecord, FontRecord, Calibration } from './model'
import { INITIAL_CALIBRATION, projectSchema } from './model'

class CertAlignDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>
  fonts!: Table<FontRecord, string>
  constructor() {
    super('certalign-v1')
    this.version(1).stores({ projects: 'id, updatedAt, isTemplate', fonts: 'id, label' })
  }
}
export const db = new CertAlignDatabase()
export const LAST_PROJECT_KEY = 'certalign:last-project'
export const CALIBRATION_KEY = 'certalign:calibration'
export const SETTINGS_KEY = 'certalign:settings'

export async function saveProject(project: ProjectRecord) {
  projectSchema.parse(project)
  const saved = { ...project, updatedAt: Date.now() }
  await db.projects.put(saved)
  if (typeof window !== 'undefined') localStorage.setItem(LAST_PROJECT_KEY, saved.id)
  return saved
}
export async function getProject(id: string) { return db.projects.get(id) }
export async function listProjects() { return db.projects.orderBy('updatedAt').reverse().toArray() }
export async function deleteProject(id: string) {
  await db.projects.delete(id)
  if (localStorage.getItem(LAST_PROJECT_KEY) === id) localStorage.removeItem(LAST_PROJECT_KEY)
}
export function lastProjectId() { try { return localStorage.getItem(LAST_PROJECT_KEY) } catch { return null } }
export function getCalibration(): Calibration {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(CALIBRATION_KEY) || 'null')
    if (data && typeof data === 'object' && 'xMm' in data && 'yMm' in data && typeof data.xMm === 'number' && typeof data.yMm === 'number' && Number.isFinite(data.xMm) && Number.isFinite(data.yMm)) return { xMm: data.xMm, yMm: data.yMm }
  } catch { /* storage unavailable */ }
  return INITIAL_CALIBRATION
}
export function setCalibration(value: Calibration) { localStorage.setItem(CALIBRATION_KEY, JSON.stringify(value)) }
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null
  const { usage, quota } = await navigator.storage.estimate()
  return { usage: usage ?? 0, quota: quota ?? 0 }
}
