import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { createRequire } from 'node:module'
// Use the global TS installation when available; install dependencies for full typecheck.
const require = createRequire(import.meta.url)
let ts
try { ts = require('typescript') } catch {
  try { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript') }
  catch { console.error('TypeScript compiler unavailable. Install packages first with npm install.'); process.exit(2) }
}
const base = process.cwd()
let errors = 0, files = 0
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d,e)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(p)) {
      files++
      const source = ts.createSourceFile(p, readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true,extname(p)==='.tsx'?ts.ScriptKind.TSX:ts.ScriptKind.TS)
      for (const err of source.parseDiagnostics) { errors++; console.error(`Syntax error in ${relative(base,p)}: ${ts.flattenDiagnosticMessageText(err.messageText,' ')}`) }
    }
  }
}
walk(join(base,'src'))
const mandatory = ['src/app/page.tsx','src/app/editor/page.tsx','src/app/projects/page.tsx','src/app/settings/page.tsx','src/app/help/page.tsx','src/lib/pdf.ts','src/lib/storage.ts','src/lib/transfer.ts','src/lib/photo.ts','public/fonts/eb-garamond.ttf','public/fonts/lato-regular.ttf','public/fonts/free-serif.ttf','public/sample/workshop-certificate.svg','scripts/copy-pdf-worker.mjs']
for (const p of mandatory) if (!existsSync(join(base,p))) { errors++; console.error('Required file missing:',p) }
for (const p of ['src/lib/pdf.ts','src/lib/storage.ts','src/lib/transfer.ts']) {
  const contents = readFileSync(join(base,p),'utf8')
  if (!contents.trim()) { errors++; console.error('Empty core file',p) }
}
console.log(`Checked ${files} TypeScript/TSX files, ${mandatory.length} required assets/files. ${errors===0?'All source checks passed.':`${errors} errors.`}`)
if(errors)process.exit(1)
