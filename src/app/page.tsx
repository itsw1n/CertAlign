'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Camera, CloudOff, FileImage, FileText, FolderOpen, MoveUpRight, ScanLine, ShieldCheck, Sparkles, Type, Upload, Wand2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { projectFromFile, sampleProject } from '@/lib/imports'
import { newProject, type ProjectRecord } from '@/lib/model'
import { importProjectBundle } from '@/lib/transfer'
import { lastProjectId, listProjects, saveProject } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()
  const digitalInput = useRef<HTMLInputElement>(null)
  const physicalInput = useRef<HTMLInputElement>(null)
  const bundleInput = useRef<HTMLInputElement>(null)
  const [recent, setRecent] = useState<ProjectRecord[]>([])
  const [resume, setResume] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { listProjects().then(p => { setRecent(p.filter(x => !x.isTemplate).slice(0, 3)); const id = lastProjectId(); setResume(p.some(x => x.id === id) ? id : null) }).catch(() => setError('Local drafts are unavailable in this browser. You can still try creating a project.')) }, [])
  async function openProject(p: ProjectRecord) { await saveProject(p); router.push(`/editor?project=${encodeURIComponent(p.id)}&step=prepare`) }
  async function fromFile(file: File | undefined, kind: 'digital' | 'physical') {
    if (!file) return
    setBusy(true); setError('')
    try { await openProject(await projectFromFile(file, kind)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to open this certificate.'); setBusy(false) }
  }
  async function startManual() { setBusy(true); setError(''); try { await openProject(newProject('manual')) } catch { setError('Unable to create a local project.'); setBusy(false) } }
  async function startSample() { setBusy(true); setError(''); try { await openProject(await sampleProject()) } catch(e) { setError(e instanceof Error ? e.message : 'Could not open sample.'); setBusy(false) } }
  async function fromBundle(file?: File) { if (!file) return; setBusy(true); setError(''); try { await openProject(await importProjectBundle(file)) } catch(e) { setError(e instanceof Error ? e.message : 'Could not import project.'); setBusy(false) } }
  return <div>
    <section className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-12 pt-14 sm:px-8 md:grid-cols-[1.02fr_.98fr] md:pb-20 md:pt-20">
      <div>
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce9e7] bg-[#f0f7f4] px-3 py-1.5 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Private by design · No sign-in needed</span>
        <h1 className="max-w-[670px] text-[clamp(2.5rem,5.5vw,4.9rem)] font-semibold leading-[1.065] tracking-[-.054em]">The right name.<br/><span className="text-primary">Right where it belongs.</span></h1>
        <p className="mt-6 max-w-[490px] text-base leading-7 text-muted sm:text-lg">Have a certificate without a name? Upload it, scan it, or start with the paper size. Place a name precisely and print with confidence.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button size="large" isDisabled={busy} onPress={() => digitalInput.current?.click()}><Upload className="h-4 w-4" /> Upload certificate <ArrowRight className="h-4 w-4" /></Button><Button size="large" variant="secondary" isDisabled={busy} onPress={startSample}><Sparkles className="h-4 w-4" /> Try a sample</Button></div>
        <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><CloudOff className="h-3.5 w-3.5" /> No cloud upload</span><span className="inline-flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Fonts & placement</span><span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Print-ready PDF</span></div>
      </div>
      <div aria-label="Certificate preview illustration" className="relative overflow-hidden rounded-[26px] border border-[#dbe5e4] bg-[#e9f0ec] p-5 shadow-[0_20px_70px_-45px_#305a61] sm:p-9">
        <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full border border-white/80" />
        <div className="relative rounded-xl border border-[#e8e0cf] bg-[#fffefb] p-3 shadow-[0_18px_35px_-22px_#173c49] sm:p-5">
          <div className="relative aspect-[297/210] border-[2px] border-[#ccb88a] p-4 sm:p-6"><div className="flex h-full flex-col items-center justify-center border border-[#e9dbc1] text-center">
            <p className="text-[8px] font-bold tracking-[.27em] text-[#ae9b73] sm:text-[11px]">CERTALIGN WORKSHOPS</p>
            <h2 className="mt-[7%] font-serif text-lg text-[#153b51] sm:text-[32px]">Certificate of Participation</h2>
            <p className="mt-[4%] font-serif text-[9px] text-[#79868a] sm:text-sm">This certificate is proudly presented to</p>
            <div className="relative mt-[3%] w-[76%] rounded border border-dashed border-[#7cabb1] bg-[#e7f4f2]/60 px-1 py-3 sm:py-5"><span className="font-serif text-lg italic text-[#1b4352] sm:text-4xl">Juan Dela Cruz</span><span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-sm border-2 border-white bg-primary"/><span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm border-2 border-white bg-primary"/></div>
            <p className="mt-[4%] font-serif text-[8px] text-[#7c8388] sm:text-xs">for successful participation in the workshop</p>
            <div className="mt-auto flex w-[70%] justify-between pb-2 pt-[5%] text-[7px] text-[#7b888a] sm:text-[10px]"><span className="border-t border-[#b7a989] pt-1">Facilitator</span><span className="border-t border-[#b7a989] pt-1">Organizer</span></div>
          </div></div>
        </div>
        <div className="relative mt-4 flex items-center justify-between rounded-xl border border-[#d4e5e3] bg-white px-4 py-3 shadow-sm"><span className="flex items-center gap-2 text-sm font-medium"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f5f0]"><Wand2 className="h-4 w-4 text-primary" /></span>Drag. Adjust. Print.</span><span className="rounded-md bg-[#e6f3ee] px-2.5 py-1 text-xs font-semibold text-[#285f4c]">Aligned perfectly</span></div>
      </div>
    </section>
    <section className="border-t border-border bg-white"><div className="mx-auto max-w-[1320px] px-5 py-14 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><span className="kicker">Get started</span><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">What do you have right now?</h2><p className="mt-2 text-sm text-muted">Choose what matches your certificate. All options lead to the same easy editor.</p></div></div>
      <div className="grid gap-4 md:grid-cols-3">
        <button type="button" disabled={busy} onClick={() => digitalInput.current?.click()} className="group flex min-h-56 flex-col items-start rounded-2xl border border-border bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-[#8db9b9] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f0f6] text-[#315f88]"><FileImage className="h-6 w-6" /></span><span className="mt-6 text-lg font-semibold">I have a digital certificate</span><span className="mt-2 text-sm leading-6 text-muted">Upload your PDF, PNG, or JPG. We&apos;ll keep its original design.</span><span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-primary">Choose file <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span></button>
        <button type="button" disabled={busy} onClick={() => physicalInput.current?.click()} className="group flex min-h-56 flex-col items-start rounded-2xl border border-border bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-[#8db9b9] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6f1e7] text-[#977445]"><Camera className="h-6 w-6" /></span><span className="mt-6 text-lg font-semibold">I have a printed certificate</span><span className="mt-2 text-sm leading-6 text-muted">Take a photo or scan it. Print only the name onto the original paper.</span><span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-primary">Take or upload photo <ArrowUpRight className="h-4 w-4" /></span></button>
        <button type="button" disabled={busy} onClick={startManual} className="group flex min-h-56 flex-col items-start rounded-2xl border border-border bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-[#8db9b9] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ececef] text-[#62627d]"><ScanLine className="h-6 w-6" /></span><span className="mt-6 text-lg font-semibold">I don&apos;t have an image</span><span className="mt-2 text-sm leading-6 text-muted">Enter the paper size and place the name using precise measurements.</span><span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-primary">Start with blank paper <ArrowUpRight className="h-4 w-4" /></span></button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>}
      {busy && <p role="status" className="mt-4 text-sm text-muted">Preparing your certificate…</p>}
    </div></section>
    {(resume || recent.length > 0) && <section className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8"><div className="mb-5 flex items-center justify-between"><div><span className="kicker">Your workspace</span><h2 className="mt-1 text-xl font-semibold">Pick up where you left off</h2></div><Link href="/projects" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">All projects <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-3">{recent.map(p => <Link key={p.id} href={`/editor?project=${encodeURIComponent(p.id)}`} className="card-panel flex items-center gap-3 p-4 hover:border-[#9abdbc]"><div className="rounded-xl bg-surface-2 p-3"><FolderOpen className="h-5 w-5 text-primary" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.title}</p><p className="mt-1 truncate text-xs text-muted">{p.layer.text || 'No name yet'} · {new Date(p.updatedAt).toLocaleDateString()}</p></div><MoveUpRight className="h-4 w-4 shrink-0 text-muted" /></Link>)}</div></section>}
    <section className="mx-auto max-w-[1320px] px-5 pb-16 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border bg-surface-2 px-6 py-6"><div><h3 className="font-semibold">Moving from phone to computer?</h3><p className="mt-1 text-sm text-muted">Open an exported .certalign project file to continue on another device.</p></div><Button variant="secondary" onPress={() => bundleInput.current?.click()}><FolderOpen className="h-4 w-4" /> Import project</Button></div></section>
    <input ref={digitalInput} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={e => { void fromFile(e.target.files?.[0], 'digital'); e.currentTarget.value = '' }} />
    <input ref={physicalInput} type="file" className="hidden" accept="image/jpeg,image/png,.png,.jpg,.jpeg" onChange={e => { void fromFile(e.target.files?.[0], 'physical'); e.currentTarget.value = '' }} />
    <input ref={bundleInput} type="file" className="hidden" accept=".certalign" onChange={e => { void fromBundle(e.target.files?.[0]); e.currentTarget.value = '' }} />
  </div>
}
