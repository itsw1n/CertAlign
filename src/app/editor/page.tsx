'use client'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, Download, FileDown, FileText, ImagePlus, Maximize2, Move, Ruler, Save, ScanLine, ShieldCheck, SlidersHorizontal, Type, Undo2, Redo2, Upload, ZoomIn, ZoomOut, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/common/Select'
import { Modal } from '@/components/common/Modal'
import { FontComboBox } from '@/components/common/FontComboBox'
import { PhotoRectifier } from '@/features/scanning/PhotoRectifier'
import { allFonts, importCustomFont, loadFont } from '@/lib/fonts'
import { db, getCalibration, getProject, saveProject, setCalibration } from '@/lib/storage'
import { exportProject } from '@/lib/transfer'
import { makePdf, downloadBlob, fileStem } from '@/lib/pdf'
import { PAGE_SIZES, round, updatePaper, type Calibration, type NameLayer, type ProjectRecord } from '@/lib/model'
import { projectFromFile } from '@/lib/imports'

const CertificateCanvas = dynamic(() => import('@/features/editor/CertificateCanvas'), { ssr: false, loading: () => <div className="flex min-h-96 items-center justify-center text-sm text-muted">Loading certificate canvas…</div> })
type Step = 'prepare' | 'edit' | 'print'
const steps: { id: Step; label: string; help: string }[] = [{ id: 'prepare', label: 'Prepare', help: 'Paper & source' }, { id: 'edit', label: 'Add name', help: 'Edit & align' }, { id: 'print', label: 'Print', help: 'Preview & export' }]

function Field({ label, value, onChange, min, max, step = 1, suffix }: {label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-medium text-muted">{label}</span><span className="relative block"><input className="field pr-9" type="number" value={value} min={min} max={max} step={step} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max)) onChange(n) }}/>{suffix && <span className="pointer-events-none absolute right-3 top-3 text-xs text-muted">{suffix}</span>}</span></label>
}
function EditorClient() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('project')
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [step, setStep] = useState<Step>(params.get('step') === 'prepare' ? 'prepare' : 'edit')
  const [fonts, setFonts] = useState<ReturnType<typeof allFonts>>([])
  const [fontFamily, setFontFamily] = useState('CertGaramond')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<'saving' | 'saved' | 'error'>('saved')
  const [ready, setReady] = useState(false)
  const [guides, setGuides] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [advanced, setAdvanced] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [fontBusy, setFontBusy] = useState(false)
  const [printMode, setPrintMode] = useState<'name-only' | 'complete'>('name-only')
  const [calibration, setCal] = useState<Calibration>({xMm:0,yMm:0})
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [testDone, setTestDone] = useState(false)
  const [printHelp, setPrintHelp] = useState(false)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<NameLayer[]>([])
  const [future, setFuture] = useState<NameLayer[]>([])
  const sourceInput = useRef<HTMLInputElement>(null)
  const fontInput = useRef<HTMLInputElement>(null)
  const loadedProject = useRef(false)
  useEffect(() => {
    if (!id) { router.replace('/'); return }
    getProject(id).then(p => { if (!p) { router.replace('/'); return }
      setProject(p); setPrintMode(p.outputMode); setCal(getCalibration()); loadedProject.current = true; setReady(true); setLoading(false)
    }).catch(() => { setError('Could not load the saved project. Return to Home and try again.'); setLoading(false) })
    db.fonts.toArray().then(r => setFonts(allFonts(r))).catch(() => setFonts(allFonts()))
  }, [id, router])
  useEffect(() => {
    if (!project?.previewBlob) { setUrl(null); return }
    const next = URL.createObjectURL(project.previewBlob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [project?.previewBlob])
  const activeFontId = project?.layer.fontId
  useEffect(() => { if (!activeFontId) return; loadFont(activeFontId).then(setFontFamily).catch(() => setError('Font could not be loaded. Choose another font.')) }, [activeFontId])
  useEffect(() => {
    if (!project || !ready || !loadedProject.current) return
    setSaved('saving')
    const t = setTimeout(() => {
      saveProject(project).then(() => setSaved('saved')).catch(() => { setSaved('error'); setError('Autosave failed. Browser storage may be full or disabled. Export a project backup now.') })
    }, 620)
    return () => clearTimeout(t)
  }, [project, ready])
  const patch = useCallback((changes: Partial<ProjectRecord>) => setProject(p => p ? { ...p, ...changes } : p), [])
  function updateLayer(layer: NameLayer) {
    setProject(p => { if (!p) return p; setHistory(prev => [...prev.slice(-59), p.layer]); setFuture([]); return { ...p, layer } })
  }
  function layerPatch(changes: Partial<NameLayer>) { if (project) updateLayer({ ...project.layer, ...changes }) }
  function undo() { if (!project || !history.length) return; const prev = history[history.length-1]; setHistory(h => h.slice(0,-1)); setFuture(f => [...f,project.layer]); patch({layer:prev}) }
  function redo() { if (!project || !future.length) return; const next = future[future.length-1]; setFuture(f => f.slice(0,-1)); setHistory(h => [...h,project.layer]); patch({layer:next}) }
  function selectPreset(value: string) {
    if (!project) return
    const preset = PAGE_SIZES.find(p => p.id === value)
    if (!preset) return
    patch(updatePaper(project,preset.widthMm,preset.heightMm,value))
  }
  async function replaceSource(file?: File) {
    if (!file || !project) return
    setError('')
    try {
      const from = await projectFromFile(file, project.sourceKind === 'physical' ? 'physical' : 'digital')
      patch({ sourceBlob:from.sourceBlob, previewBlob:from.previewBlob, sourceMime:from.sourceMime, sourceName:from.sourceName, sourceKind:from.sourceKind, ...from.sourceMime === 'application/pdf' ? { widthMm:from.widthMm, heightMm:from.heightMm, paperPreset:from.paperPreset } : {} })
    } catch(e) { setError(e instanceof Error ? e.message : 'Cannot open the new source file.') }
  }
  async function addCustomFont(file?: File) {
    if (!file) return
    setFontBusy(true); setError('')
    try { const f = await importCustomFont(file); setFonts(old => [...old, { id:f.id,label:f.label,category:'My fonts',css:`custom-${f.id}` }]); layerPatch({fontId:f.id}) }
    catch(e) { setError(e instanceof Error ? e.message : 'Font upload failed.') } finally { setFontBusy(false) }
  }
  function fitName() {
    if (!project) return
    const text = project.layer.text
    if (!text) return
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!
    ctx.font = `${project.layer.fontSizePt * 96/72}px "${fontFamily}"`
    const widthPx = ctx.measureText(text).width + Math.max(0,Array.from(text).length-1)*project.layer.letterSpacingPt*96/72
    const allowed = project.layer.widthMm * 96/25.4
    if (widthPx > allowed) layerPatch({fontSizePt:round(Math.max(6,project.layer.fontSizePt*allowed/widthPx*.96),1)})
  }
  function centerName() { if (project) layerPatch({xMm:round((project.widthMm-project.layer.widthMm)/2,2)}) }
  useEffect(() => { if (step !== 'print' || !project || !project.layer.text.trim()) { setPdfBlob(null); setPdfPreview(null); return }
    let active = true, objectUrl: string | undefined
    setPdfBusy(true); setPdfPreview(null); setPdfBlob(null)
    const timeout = setTimeout(async () => {
      try {
        const blob = await makePdf(project, printMode, calibration)
        if (!active) return
        objectUrl = URL.createObjectURL(blob); setPdfPreview(objectUrl); setPdfBlob(blob); setError('')
      } catch(e) { if(active) setError(e instanceof Error ? e.message : 'PDF preview could not be generated.') }
      finally { if(active) setPdfBusy(false) }
    }, 450)
    return () => { active=false; clearTimeout(timeout); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [step, project, printMode, calibration])
  async function testPrint() {
    if (!project) return
    try { const blob = await makePdf(project, 'test', calibration); downloadBlob(blob, `${fileStem(project.title)}-TEST-SHEET.pdf`); setTestDone(true) }
    catch(e) { setError(e instanceof Error ? e.message : 'Failed to generate test sheet.') }
  }
  function updateCalibration(c: Calibration) { setCal(c); setCalibration(c); setTestDone(false) }
  async function portableExport() {
    if (!project) return
    try { await saveProject(project); await exportProject(project) } catch(e) { setError(e instanceof Error ? e.message : 'Project export failed.') }
  }
  if (loading) return <div className="mx-auto max-w-5xl px-6 py-24 text-center text-muted">Loading project…</div>
  if (!project) return <div className="mx-auto max-w-5xl px-6 py-16"><p className="mb-4 text-danger">{error || 'Project not found.'}</p><Button onPress={() => router.push('/')}>Return home</Button></div>
  const field = project.layer
  const hasBackground = Boolean(project.sourceBlob || project.previewBlob)
  const atRisk = field.xMm < 8 || field.yMm < 8 || field.xMm + field.widthMm > project.widthMm - 8
  const nameEmpty = !field.text.trim()
  return <div className="mx-auto max-w-[1520px] px-4 pb-12 pt-5 sm:px-7">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3"><Button variant="ghost" size="icon" aria-label="Back to projects" onPress={() => router.push('/projects')}><ArrowLeft className="h-4 w-4" /></Button><div className="min-w-0"><input aria-label="Project title" className="w-full max-w-[340px] border-none bg-transparent text-lg font-semibold tracking-tight outline-none focus-visible:underline" value={project.title} maxLength={180} onChange={e => patch({title:e.target.value})}/><p role="status" className="mt-1 flex items-center gap-1.5 text-xs text-muted">{saved === 'saving' ? <><Save className="h-3.5 w-3.5" /> Saving locally…</> : saved === 'saved' ? <><CheckCircle2 className="h-3.5 w-3.5 text-[#35846f]" /> Saved on this device</> : <span className="text-danger">Not saved — back up your project</span>}</p></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" size="small" onPress={portableExport}><Download className="h-4 w-4" /> Export project</Button><Button size="small" onPress={() => setStep('print')} isDisabled={nameEmpty}><FileDown className="h-4 w-4" /> Print / download <ArrowRight className="h-4 w-4" /></Button></div>
    </div>
    <div className="mb-5 flex items-center justify-center"><div className="inline-flex max-w-full gap-1 rounded-xl border border-border bg-white p-1.5 shadow-sm">{steps.map((item,index) => <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${step===item.id?'bg-primary text-white':'text-muted hover:bg-surface-2 hover:text-foreground'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step===item.id?'bg-white/20':'bg-surface-2'}`}>{index+1}</span>{item.label}</button>)}</div></div>
    {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-danger"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="shrink-0 font-semibold">✕</button></div>}
    {step==='prepare' && <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="card-panel p-6"><span className="kicker">Step 1 of 3</span><h2 className="mt-2 text-xl font-semibold">Prepare your certificate</h2><p className="mt-2 text-sm leading-6 text-muted">Confirm the actual paper dimensions. For printed certificates, measure the physical sheet with a ruler.</p>
        <div className="mt-6 space-y-4"><Select label="Paper size" value={project.paperPreset} options={PAGE_SIZES.map(p => ({id:p.id,label:p.label}))} onChange={selectPreset}/>
          <div className="grid grid-cols-2 gap-3"><Field label="Width" value={round(project.widthMm,2)} onChange={v => patch({widthMm:v,paperPreset:'custom'})} suffix="mm" min={50} max={1200} step={.1}/><Field label="Height" value={round(project.heightMm,2)} onChange={v => patch({heightMm:v,paperPreset:'custom'})} suffix="mm" min={50} max={1200} step={.1}/></div>
          <div className="rounded-xl bg-surface-2 p-4"><p className="text-xs font-semibold">Certificate reference</p><p className="mt-1 break-words text-sm text-muted">{project.sourceName || 'Manual blank-paper setup'}</p><p className="helper mt-2">{project.sourceMime === 'application/pdf' ? 'The first PDF page is used as the certificate background.' : project.sourceKind === 'physical' ? 'The photo is used only for alignment. Printing just the name is the default.' : 'Change the reference if you selected the wrong file.'}</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" onPress={() => sourceInput.current?.click()}><ImagePlus className="h-4 w-4" /> Replace certificate</Button>{project.sourceKind==='physical' && project.sourceBlob && <Button variant="secondary" onPress={() => setCropOpen(true)}><ScanLine className="h-4 w-4" /> Correct photo</Button>}</div>
        </div><div className="mt-7 flex justify-end"><Button onPress={() => setStep('edit')}>Continue to editor <ArrowRight className="h-4 w-4" /></Button></div>
      </section>
      <section className="card-panel flex flex-col p-6"><span className="kicker">Paper preview</span><p className="helper mt-2">Reference only — not a final PDF</p><div className="mt-5 flex min-h-72 flex-1 items-center justify-center rounded-xl bg-surface-2 p-6"><div className="flex max-h-[350px] w-full max-w-lg items-center justify-center overflow-hidden border border-border bg-white shadow-xl" style={{aspectRatio:`${project.widthMm}/${project.heightMm}`}}>{url?<img className="h-full w-full object-fill" src={url} alt="Certificate reference" />:<span className="text-sm text-muted">Blank {round(project.widthMm)} × {round(project.heightMm)} mm</span>}</div></div><p className="mt-4 flex items-center gap-2 text-xs text-muted"><Ruler className="h-4 w-4" /> Printed names use the paper dimensions above.</p></section>
    </div>}
    {step==='edit' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_342px]">
      <section className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><span className="kicker">Step 2 of 3</span><h2 className="mt-1 text-lg font-semibold">Position the name</h2></div><div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-white p-1"><Button size="icon" variant="ghost" aria-label="Undo" isDisabled={!history.length} onPress={undo}><Undo2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Redo" isDisabled={!future.length} onPress={redo}><Redo2 className="h-4 w-4" /></Button><span className="mx-1 h-5 w-px bg-border"/><Button size="icon" variant="ghost" aria-label="Zoom out" onPress={() => setZoom(z=>Math.max(.65,round(z-.1,1)))}><ZoomOut className="h-4 w-4" /></Button><span className="px-1 text-xs font-medium tabular-nums text-muted">{Math.round(zoom*100)}%</span><Button size="icon" variant="ghost" aria-label="Zoom in" onPress={() => setZoom(z=>Math.min(1.5,round(z+.1,1)))}><ZoomIn className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Reset zoom" onPress={() => setZoom(1)}><Maximize2 className="h-4 w-4" /></Button></div></div>
        <div className="h-[min(64vh,690px)] min-h-[380px]"><CertificateCanvas project={project} previewUrl={url} fontFamily={fontFamily} onChange={updateLayer} guides={guides} zoom={zoom}/></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span className="flex items-center gap-1.5"><Move className="h-3.5 w-3.5" /> Drag the name on the page, or use X / Y fields for precise movement</span><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="accent-primary" checked={guides} onChange={e => setGuides(e.target.checked)}/> Show alignment guides</label></div>
      </section>
      <aside className="card-panel h-fit overflow-hidden"><div className="border-b border-border px-5 py-4"><h3 className="font-semibold">Name settings</h3><p className="mt-1 text-xs text-muted">The essentials, all in one place.</p></div><div className="space-y-5 p-5">
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Recipient name</span><input aria-label="Recipient name" className="field" placeholder="e.g. Juan Dela Cruz" value={field.text} maxLength={300} onChange={e => layerPatch({text:e.target.value})}/></label>
        <div><FontComboBox fonts={fonts} selected={field.fontId} onSelect={v=>layerPatch({fontId:v})}/><button type="button" disabled={fontBusy} onClick={()=>fontInput.current?.click()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Upload className="h-3.5 w-3.5" /> {fontBusy?'Importing…':'Upload a TTF/OTF font'}</button></div>
        <div className="grid grid-cols-[1fr_86px] gap-3"><Field label="Font size" value={field.fontSizePt} onChange={v=>layerPatch({fontSizePt:v})} min={6} max={200} step={.5} suffix="pt"/><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Text color</span><input className="h-10 w-full cursor-pointer rounded-lg border border-border bg-white p-1" type="color" aria-label="Name color" value={field.color} onChange={e=>layerPatch({color:e.target.value})}/></label></div>
        <div><span className="mb-2 block text-xs font-medium text-muted">Alignment</span><div className="grid grid-cols-3 gap-2">{([['left',AlignLeft],['center',AlignCenter],['right',AlignRight]] as const).map(([mode,Icon])=><button type="button" key={mode} onClick={()=>layerPatch({align:mode})} aria-label={`Align ${mode}`} aria-pressed={field.align===mode} className={`flex h-10 items-center justify-center rounded-lg border ${field.align===mode?'border-primary bg-[#e9f4f3] text-primary':'border-border hover:bg-surface-2'}`}><Icon className="h-4 w-4" /></button>)}</div></div>
        <div className="border-t border-border pt-4"><span className="mb-3 block text-xs font-semibold">Precise position</span><div className="grid grid-cols-2 gap-3"><Field label="From left (X)" value={field.xMm} onChange={v=>layerPatch({xMm:v})} suffix="mm" step={.5}/><Field label="From top (Y)" value={field.yMm} onChange={v=>layerPatch({yMm:v})} suffix="mm" step={.5}/></div><Button size="small" variant="secondary" className="mt-3 w-full" onPress={centerName}><AlignCenter className="h-3.5 w-3.5" /> Center on paper</Button></div>
        <div><button type="button" className="flex w-full items-center justify-between rounded-lg py-2 text-left text-xs font-semibold" onClick={()=>setAdvanced(x=>!x)} aria-expanded={advanced}><span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> More controls</span><ChevronDown className={`h-4 w-4 transition-transform ${advanced?'rotate-180':''}`}/></button>{advanced && <div className="mt-3 space-y-3"><Field label="Text box width" value={field.widthMm} onChange={v=>layerPatch({widthMm:v})} min={10} max={1200} step={.5} suffix="mm"/><Field label="Letter spacing" value={field.letterSpacingPt} onChange={v=>layerPatch({letterSpacingPt:v})} min={-3} max={15} step={.2} suffix="pt"/><Button className="w-full" size="small" variant="secondary" onPress={fitName}>Fit name to width</Button><p className="helper">The name must fit inside its text box. The PDF generator checks this before export.</p></div>}</div>
        <Button className="w-full" size="large" isDisabled={nameEmpty} onPress={()=>setStep('print')}>Continue to print <ArrowRight className="h-4 w-4" /></Button>
      </div></aside>
    </div>}
    {step==='print' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-between"><div><span className="kicker">Step 3 of 3</span><h2 className="mt-1 text-lg font-semibold">Your print-ready PDF</h2></div><span className="flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4" /> Generated locally</span></div>
        <div className="card-panel flex h-[min(69vh,730px)] min-h-[420px] items-center justify-center overflow-hidden bg-[#e6eae9] p-3 sm:p-6">{pdfPreview ? <iframe src={`${pdfPreview}#toolbar=0`} title="Generated PDF print preview" className="h-full w-full rounded-md border border-border bg-white shadow-lg"/> : <div className="max-w-md px-6 text-center"><FileText className="mx-auto mb-4 h-12 w-12 text-muted"/><p className="font-semibold">{pdfBusy?'Generating PDF preview…':nameEmpty?'Enter a name first':'Preview unavailable'}</p><p className="mt-2 text-sm leading-6 text-muted">{nameEmpty?'Go back to Add name to enter a recipient.':'Adjust the settings or use another compatible font.'}</p></div>}</div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{round(project.widthMm,1)} × {round(project.heightMm,1)} mm · {printMode==='name-only'?'Name-only PDF':'Full certificate PDF'}</span><Button variant="secondary" size="small" onPress={()=>setStep('edit')}><ArrowLeft className="h-4 w-4"/> Back to editor</Button></div>
      </section>
      <aside className="space-y-4"><section className="card-panel p-5"><h3 className="font-semibold">Choose what to print</h3><p className="helper mt-1">Both options use the same name positioning.</p><div className="mt-4 space-y-2">
        <button type="button" aria-pressed={printMode==='name-only'} onClick={()=>{setPrintMode('name-only');patch({outputMode:'name-only'});setTestDone(false)}} className={`w-full rounded-xl border p-4 text-left ${printMode==='name-only'?'border-primary bg-[#edf5f4]':'border-border hover:bg-surface-2'}`}><span className="flex items-center gap-2 text-sm font-semibold"><Type className="h-4 w-4 text-primary" /> Print just the name {printMode==='name-only' && <Check className="ml-auto h-4 w-4 text-primary" />}</span><span className="mt-1 block text-xs leading-5 text-muted">For an already-printed certificate. The background is not included.</span></button>
        <button type="button" aria-pressed={printMode==='complete'} disabled={!hasBackground} onClick={()=>{setPrintMode('complete');patch({outputMode:'complete'})}} className={`w-full rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-45 ${printMode==='complete'?'border-primary bg-[#edf5f4]':'border-border hover:bg-surface-2'}`}><span className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Full certificate PDF {printMode==='complete' && <Check className="ml-auto h-4 w-4 text-primary" />}</span><span className="mt-1 block text-xs leading-5 text-muted">Includes the original background and name together.</span></button>
      </div></section>
      {printMode==='name-only' && <section className="card-panel p-5"><h3 className="flex items-center gap-2 font-semibold"><Ruler className="h-4 w-4" /> Adjust print alignment</h3><p className="helper mt-2">Most printers shift the paper slightly. Print a test sheet, compare, and correct X / Y if needed.</p><div className="mt-4 grid grid-cols-2 gap-3"><Field label="Horizontal" value={calibration.xMm} onChange={v=>updateCalibration({...calibration,xMm:v})} min={-50} max={50} step={.5} suffix="mm"/><Field label="Vertical" value={calibration.yMm} onChange={v=>updateCalibration({...calibration,yMm:v})} min={-50} max={50} step={.5} suffix="mm"/></div><p className="helper mt-2">Positive X moves right; positive Y moves down.</p><Button variant="secondary" className="mt-4 w-full" onPress={testPrint} isDisabled={nameEmpty}><Ruler className="h-4 w-4" /> Download test sheet</Button><label className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><input type="checkbox" className="mt-0.5 accent-primary" checked={testDone} onChange={e=>setTestDone(e.target.checked)}/> I tested on plain paper and checked the alignment</label></section>}
      <section className="card-panel p-5"><h3 className="font-semibold">Finish</h3>{printMode==='name-only' && <div className="mt-3 rounded-xl border border-[#eedcac] bg-[#fff9e9] p-3 text-xs leading-5 text-[#846a30]"><TriangleAlert className="mr-1 inline h-4 w-4" /> Feed the original certificate only after testing. Use Actual Size / 100% in your printer dialog.</div>}{atRisk && <p className="mt-3 text-xs text-danger">Name is close to a paper edge. Some printers may clip it.</p>}
        <Button className="mt-4 w-full" size="large" isDisabled={!pdfBlob || pdfBusy || nameEmpty} onPress={()=>pdfBlob && downloadBlob(pdfBlob, `${fileStem(project.title)}-${printMode==='name-only'?'name-only':'complete'}.pdf`)}><Download className="h-4 w-4"/> Download PDF</Button>
        <Button className="mt-2 w-full" variant="secondary" isDisabled={!pdfPreview || (printMode==='name-only' && !testDone)} onPress={()=>{if(pdfPreview) window.open(pdfPreview,'_blank','noopener,noreferrer')}}><FileText className="h-4 w-4" /> Open PDF to print</Button>
        {printMode==='name-only' && !testDone && <p className="helper mt-2 text-center">Mark the test as complete to enable printing onto the original certificate.</p>}
        <button type="button" onClick={()=>setPrintHelp(true)} className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"><CircleHelp className="h-4 w-4" /> How to print correctly</button>
      </section></aside>
    </div>}
    <input ref={fontInput} className="hidden" type="file" accept=".ttf,.otf" onChange={e=>{void addCustomFont(e.target.files?.[0]);e.target.value=''}} />
    <input ref={sourceInput} className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>{void replaceSource(e.target.files?.[0]);e.target.value=''}} />
    <Modal title="Straighten certificate photo" isOpen={cropOpen} onOpenChange={setCropOpen} className="max-w-2xl">
      {cropOpen && project.sourceBlob && <PhotoRectifier source={project.sourceBlob} onCancel={()=>setCropOpen(false)} onApply={blob=>{patch({previewBlob:blob});setCropOpen(false)}}/>}
    </Modal>
    <Modal title="Printing checklist" isOpen={printHelp} onOpenChange={setPrintHelp}>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted"><li>Confirm the physical sheet dimensions match your project.</li><li>In the PDF print dialog, select the matching paper size and orientation.</li><li>Choose <strong className="text-foreground">Actual size / 100%</strong>. Do not use Fit to Page.</li><li>Print the test sheet on ordinary paper and compare it against the certificate in the light.</li><li>Adjust the horizontal/vertical offsets if necessary and repeat the test.</li><li>Only then put the original certificate in the paper tray, following your printer&apos;s feed direction.</li></ol>
      <div className="mt-5 rounded-lg bg-surface-2 p-3 text-xs leading-5 text-muted">CertAlign generates accurate PDF page coordinates, but cannot control your physical printer&apos;s margins, feeding or paper selection.</div><Button className="mt-5 w-full" onPress={()=>setPrintHelp(false)}>Got it</Button>
    </Modal>
  </div>
}
export default function EditorPage() { return <Suspense fallback={<div className="p-16 text-center text-muted">Preparing editor…</div>}><EditorClient /></Suspense> }
