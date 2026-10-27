import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
const source = join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
const target = join(process.cwd(), 'public/pdf.worker.min.mjs')
if (!existsSync(source)) throw new Error('Expected PDF.js v4 worker not found. Check pdfjs-dist version.')
mkdirSync(join(process.cwd(), 'public'), { recursive: true })
copyFileSync(source, target)
console.log('Copied compatible PDF.js worker for static hosting.')
