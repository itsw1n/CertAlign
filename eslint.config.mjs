import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })
export default [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/pdf.worker.min.mjs', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { rules: { '@next/next/no-img-element': 'off' } },
]
