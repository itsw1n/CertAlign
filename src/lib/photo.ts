// A manual four-corner image rectifier. Subdivided affine mesh approximates a
// bilinear perspective projection using browser Canvas2D, entirely offline.
type Point = { x: number; y: number }
function lerp(a: Point, b: Point, t: number): Point { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }
function quadPoint(tl: Point, tr: Point, br: Point, bl: Point, x: number, y: number): Point {
  return lerp(lerp(tl, tr, x), lerp(bl, br, x), y)
}
function drawTriangle(ctx: CanvasRenderingContext2D, image: CanvasImageSource, src: Point[], dst: Point[]) {
  const [a, b, c] = src; const [u, v, w] = dst
  const det = a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)
  if (Math.abs(det) < 0.0001) return
  const aa = (u.x * (b.y - c.y) + v.x * (c.y - a.y) + w.x * (a.y - b.y)) / det
  const bb = (u.y * (b.y - c.y) + v.y * (c.y - a.y) + w.y * (a.y - b.y)) / det
  const cc = (u.x * (c.x - b.x) + v.x * (a.x - c.x) + w.x * (b.x - a.x)) / det
  const dd = (u.y * (c.x - b.x) + v.y * (a.x - c.x) + w.y * (b.x - a.x)) / det
  const ee = (u.x * (b.x * c.y - c.x * b.y) + v.x * (c.x * a.y - a.x * c.y) + w.x * (a.x * b.y - b.x * a.y)) / det
  const ff = (u.y * (b.x * c.y - c.x * b.y) + v.y * (c.x * a.y - a.x * c.y) + w.y * (a.x * b.y - b.x * a.y)) / det
  ctx.save(); ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y); ctx.lineTo(w.x, w.y); ctx.closePath(); ctx.clip()
  ctx.setTransform(aa, bb, cc, dd, ee, ff)
  ctx.drawImage(image, 0, 0)
  ctx.restore()
}
export async function straightenPhoto(blob: Blob, coords: [Point, Point, Point, Point]): Promise<Blob> {
  const image = await createImageBitmap(blob)
  const src = coords.map(p => ({ x: p.x * image.width, y: p.y * image.height })) as [Point, Point, Point, Point]
  const d = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
  const w = Math.round((d(src[0], src[1]) + d(src[2], src[3])) / 2)
  const h = Math.round((d(src[0], src[3]) + d(src[1], src[2])) / 2)
  if (w < 100 || h < 100 || w * h > 24_000_000) throw new Error('Corner selection creates an invalid or oversized crop.')
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
  const n = 24
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const x0 = col / n, x1 = (col + 1) / n, y0 = row / n, y1 = (row + 1) / n
    const p = [quadPoint(...src, x0, y0), quadPoint(...src, x1, y0), quadPoint(...src, x1, y1), quadPoint(...src, x0, y1)]
    const q = [{ x: x0 * w, y: y0 * h }, { x: x1 * w, y: y0 * h }, { x: x1 * w, y: y1 * h }, { x: x0 * w, y: y1 * h }]
    drawTriangle(ctx, image, [p[0], p[1], p[2]], [q[0], q[1], q[2]])
    drawTriangle(ctx, image, [p[0], p[2], p[3]], [q[0], q[2], q[3]])
  }
  image.close()
  return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Photo processing failed.')), 'image/png'))
}
