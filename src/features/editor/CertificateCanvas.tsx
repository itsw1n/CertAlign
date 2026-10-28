'use client'
import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text, Line } from 'react-konva'
import type { ProjectRecord, NameLayer } from '@/lib/model'
import { round } from '@/lib/model'

export default function CertificateCanvas({ project, previewUrl, fontFamily, onChange, guides, zoom }: {
  project: ProjectRecord; previewUrl: string | null; fontFamily: string; onChange: (layer: NameLayer) => void; guides: boolean; zoom: number
}) {
  const container = useRef<HTMLDivElement>(null)
  const [maxWidth, setMaxWidth] = useState(760)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const el = container.current
    if (!el) return
    const resize = new ResizeObserver(entries => setMaxWidth(Math.max(280, entries[0].contentRect.width - 24)))
    resize.observe(el); return () => resize.disconnect()
  }, [])
  useEffect(() => {
    if (!previewUrl) { setImage(null); return }
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.onerror = () => setImage(null)
    img.src = previewUrl
    return () => { img.onload = null; img.onerror = null }
  }, [previewUrl])
  const paperWidth = Math.min(840, Math.max(270, maxWidth - 14)) * zoom
  const scale = paperWidth / project.widthMm
  const paperHeight = project.heightMm * scale
  const { layer } = project
  const typePx = layer.fontSizePt * 25.4 / 72 * scale
  return <div ref={container} className="relative flex h-full min-h-[350px] w-full justify-center overflow-auto rounded-xl border border-[#e4e7e4] bg-[#e8edec] p-3 sm:p-5" aria-label="Visual certificate canvas. Use the text position fields to move the name without dragging.">
    <div style={{ width: paperWidth, height: paperHeight }} className="relative shrink-0 bg-white shadow-[0_8px_30px_-10px_#4b6266]"><Stage width={paperWidth} height={paperHeight}>
      <Layer>
        <Rect x={0} y={0} width={paperWidth} height={paperHeight} fill="#fff" />
        {image && <KonvaImage image={image} x={0} y={0} width={paperWidth} height={paperHeight} />}
        {guides && <>
          <Line points={[paperWidth / 2, 0, paperWidth / 2, paperHeight]} stroke="#8bb8b9" opacity={0.65} dash={[5, 5]} strokeWidth={1} listening={false}/>
          <Line points={[0, paperHeight / 2, paperWidth, paperHeight / 2]} stroke="#8bb8b9" opacity={0.65} dash={[5, 5]} strokeWidth={1} listening={false}/>
          <Rect x={scale * 8} y={scale * 8} width={paperWidth - 16 * scale} height={paperHeight - 16 * scale} stroke="#8baeb1" dash={[6, 5]} strokeWidth={0.8} listening={false}/>
        </>}
        <Text x={layer.xMm * scale} y={layer.yMm * scale} width={layer.widthMm * scale} text={layer.text || 'Type a name…'}
          fontFamily={fontFamily} fontSize={typePx} fill={layer.text ? layer.color : '#9aaeb3'}
          align={layer.align} letterSpacing={layer.letterSpacingPt * 25.4 / 72 * scale} fontStyle="normal"
          lineHeight={1.04} wrap="none" draggable={true} onDragEnd={event => {
            const node = event.target
            onChange({ ...layer, xMm: round(node.x() / scale, 2), yMm: round(node.y() / scale, 2) })
          }} />
        {guides && <Rect x={layer.xMm * scale} y={layer.yMm * scale} width={layer.widthMm * scale} height={Math.max(typePx * 1.05, 22)} stroke="#26859c" dash={[4, 3]} strokeWidth={1.2} listening={false} />}
      </Layer>
    </Stage></div>
    {project.sourceKind === 'manual' && <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] text-muted shadow-sm">Blank page · Only the name prints</span>}
  </div>
}
