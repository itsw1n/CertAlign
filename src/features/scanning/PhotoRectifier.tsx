'use client'
import { useEffect, useRef, useState } from 'react'
import { RotateCw, ScanLine } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { straightenPhoto } from '@/lib/photo'

type Point = { x: number; y: number }
const defaultPoints: [Point, Point, Point, Point] = [{ x: .045, y: .045 }, { x: .955, y: .045 }, { x: .955, y: .955 }, { x: .045, y: .955 }]
async function rotateBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas'); canvas.width = bitmap.height; canvas.height = bitmap.width
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Photo rotation failed.')), 'image/png'))
}
export function PhotoRectifier({ source, onApply, onCancel }: { source: Blob; onApply: (blob: Blob) => void; onCancel: () => void }) {
  const [working, setWorking] = useState(source)
  const [points, setPoints] = useState(defaultPoints)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const active = useRef<number | null>(null)
  useEffect(() => { const u = URL.createObjectURL(working); setUrl(u); return () => URL.revokeObjectURL(u) }, [working])
  const update = (i: number, p: Point) => setPoints(old => old.map((v, j) => i === j ? p : v) as typeof defaultPoints)
  const cx = (p: Point) => p.x * 1000, cy = (p: Point) => p.y * 1000
  async function rotate() { setBusy(true); setError(''); try { setWorking(await rotateBlob(working)); setPoints(defaultPoints) } catch(e) { setError(String(e)) } finally { setBusy(false) } }
  async function apply() { setBusy(true); setError(''); try { onApply(await straightenPhoto(working, points)) } catch(e) { setError(e instanceof Error ? e.message : 'Could not straighten the photo.') } finally { setBusy(false) } }
  return <div className="space-y-4">
    <p className="text-sm leading-6 text-muted">Drag the four corner handles onto the certificate corners. Use the arrow keys for fine adjustments. This helps flatten a photograph before adding your name.</p>
    <div className="overflow-hidden rounded-xl bg-slate-100"><div className="relative mx-auto max-w-lg">
      {url && <img src={url} alt="Original photographed certificate" className="block w-full" />}
      <svg ref={svgRef} className="absolute inset-0 h-full w-full touch-none" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Adjust four crop corners">
        <polygon points={points.map(p => `${cx(p)},${cy(p)}`).join(' ')} fill="#2b829622" stroke="#19748a" strokeWidth="5" strokeDasharray="12 10" vectorEffect="non-scaling-stroke" />
        {points.map((p,i) => <circle key={i} tabIndex={0} role="slider" aria-label={`${['Top-left','Top-right','Bottom-right','Bottom-left'][i]} corner`} aria-valuemin={0} aria-valuemax={1000} aria-valuenow={Math.round(cx(p))} cx={cx(p)} cy={cy(p)} r="17" fill="#fff" stroke="#146479" strokeWidth="6" className="cursor-grab outline-none focus:stroke-[#ed8d3c]" onPointerDown={e => { active.current = i; e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={e => {
          if (active.current !== i || !svgRef.current) return
          const rect = svgRef.current.getBoundingClientRect()
          update(i, { x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) })
        }} onPointerUp={() => active.current = null} onKeyDown={e => { const delta = e.shiftKey ? .01 : .002; const offset: Record<string,Point> = { ArrowLeft: {x:-delta,y:0}, ArrowRight:{x:delta,y:0}, ArrowUp:{x:0,y:-delta}, ArrowDown:{x:0,y:delta} }; if (offset[e.key]) { e.preventDefault(); update(i, {x:Math.max(0,Math.min(1,p.x+offset[e.key].x)), y:Math.max(0,Math.min(1,p.y+offset[e.key].y))}) } }} />)}
      </svg>
    </div></div>
    {error && <p className="text-sm text-danger" role="alert">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button variant="secondary" onPress={rotate} isDisabled={busy}><RotateCw className="h-4 w-4" /> Rotate photo</Button><Button variant="secondary" onPress={() => setPoints(defaultPoints)} isDisabled={busy}>Reset corners</Button></div>
    <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="secondary" onPress={onCancel} isDisabled={busy}>Cancel</Button><Button onPress={apply} isDisabled={busy}><ScanLine className="h-4 w-4" /> {busy ? 'Processing…' : 'Straighten photo'}</Button></div>
  </div>
}
