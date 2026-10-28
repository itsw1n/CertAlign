'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertDialog } from '@/components/common/AlertDialog'
import { Button } from '@/components/common/Button'
import { ArrowRight, Copy, Download, FileText, FolderOpen, LayoutTemplate, Plus, Trash2, Upload } from 'lucide-react'
import { type ProjectRecord } from '@/lib/model'
import { deleteProject, listProjects, saveProject } from '@/lib/storage'
import { exportProject, importProjectBundle } from '@/lib/transfer'

function ProjectCard({ project, onDuplicate, onTemplate, onDelete, onExport }: {
  project: ProjectRecord; onDuplicate: (p: ProjectRecord)=>void; onTemplate: (p: ProjectRecord)=>void; onDelete: (p: ProjectRecord)=>void; onExport:(p:ProjectRecord)=>void
}) {
  const [url,setUrl] = useState('')
  useEffect(()=>{if (!project.previewBlob) return; const u=URL.createObjectURL(project.previewBlob);setUrl(u);return()=>URL.revokeObjectURL(u)},[project.previewBlob])
  return <article className="card-panel group overflow-hidden transition-shadow hover:shadow-lg"><Link href={`/editor?project=${encodeURIComponent(project.id)}`} className="flex h-44 items-center justify-center overflow-hidden bg-[#ecf1f0] p-5"><div className="flex h-full max-w-full items-center justify-center overflow-hidden border border-[#e1e5e4] bg-white shadow-sm" style={{aspectRatio:`${project.widthMm}/${project.heightMm}`}}>{url?<img src={url} alt="Certificate thumbnail" className="h-full w-full object-fill"/>:<FileText className="h-11 w-11 text-[#aac0c0]"/>}</div></Link>
    <div className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="text-[10px] font-semibold uppercase tracking-widest text-primary">{project.isTemplate?'Reusable template':project.sourceKind==='physical'?'Printed certificate':'Certificate project'}</span><h3 className="mt-1 truncate font-semibold" title={project.title}>{project.title}</h3><p className="mt-1 truncate text-xs text-muted">{project.isTemplate ? 'Empty name template' : project.layer.text || 'No recipient yet'} · {new Date(project.updatedAt).toLocaleDateString()}</p></div><span className="rounded-lg bg-surface-2 p-2"><LayoutTemplate className="h-4 w-4 text-muted"/></span></div>
      <div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/editor?project=${encodeURIComponent(project.id)}`} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-xs font-semibold text-white">Open <ArrowRight className="h-3 w-3"/></Link><Button variant="secondary" size="small" onPress={()=>onDuplicate(project)}><Copy className="h-3.5 w-3.5"/> {project.isTemplate?'Use':'Duplicate'}</Button></div>
      <div className="mt-2 flex justify-between gap-1 border-t border-border pt-2"><button onClick={()=>onTemplate(project)} type="button" className="inline-flex items-center gap-1 p-1.5 text-[11px] font-medium text-muted hover:text-primary"><LayoutTemplate className="h-3.5 w-3.5"/> Save layout</button><button onClick={()=>onExport(project)} type="button" className="p-1.5 text-muted hover:text-primary" aria-label={`Export ${project.title}`} title="Export portable project"><Download className="h-4 w-4"/></button><button onClick={()=>onDelete(project)} type="button" className="p-1.5 text-muted hover:text-danger" aria-label={`Delete ${project.title}`} title="Delete"><Trash2 className="h-4 w-4"/></button></div>
    </div>
  </article>
}
export default function ProjectsPage() {
  const router = useRouter()
  const [projects,setProjects] = useState<ProjectRecord[]>([])
  const [tab,setTab] = useState<'projects'|'templates'>('projects')
  const [error,setError] = useState('')
  const [target,setTarget] = useState<ProjectRecord|null>(null)
  const [pending,setPending] = useState(false)
  const input=useRef<HTMLInputElement>(null)
  async function refresh() { try { setProjects(await listProjects()) } catch {setError('Could not open local projects. Check browser storage settings.')} }
  useEffect(()=>{void refresh()},[])
  async function duplicate(p:ProjectRecord) { try { const next={...p,id:crypto.randomUUID(),createdAt:Date.now(),updatedAt:Date.now(),isTemplate:false,title:(p.isTemplate?p.title.replace(/ \(template\)$/,''):p.title+' copy').slice(0,180),layer:{...p.layer,text:p.isTemplate?'':p.layer.text}};await saveProject(next);router.push(`/editor?project=${encodeURIComponent(next.id)}`)}catch{setError('Unable to duplicate this project.')} }
  async function template(p:ProjectRecord) {try{await saveProject({...p,id:crypto.randomUUID(),isTemplate:true,title:`${p.title.replace(/ \(template\)$/,'')} (template)`.slice(0,180),createdAt:Date.now(),updatedAt:Date.now(),layer:{...p.layer,text:''}});await refresh();setTab('templates')}catch{setError('Unable to save this layout.')} }
  async function remove() { if(!target)return;setPending(true);try{await deleteProject(target.id);await refresh();setTarget(null)}catch{setError('Could not delete the project.')}finally{setPending(false)} }
  async function importBundle(file?:File) {if(!file)return;try{const p=await importProjectBundle(file);router.push(`/editor?project=${encodeURIComponent(p.id)}`)}catch(e){setError(e instanceof Error?e.message:'Failed to import project.')} }
  const visible=projects.filter(p=>p.isTemplate===(tab==='templates'))
  return <div className="mx-auto max-w-[1250px] px-5 py-12 sm:px-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="kicker">Saved on this device</span><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your projects</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Return to a certificate, make a reusable layout, or export a project to continue on a different device.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onPress={()=>input.current?.click()}><Upload className="h-4 w-4"/> Import project</Button><Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4"/> New certificate</Link></div></div>
    <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-border"><div className="flex gap-7">{(['projects','templates'] as const).map(t=><button type="button" key={t} onClick={()=>setTab(t)} className={`border-b-2 pb-4 text-sm font-semibold capitalize ${tab===t?'border-primary text-primary':'border-transparent text-muted hover:text-foreground'}`}>{t} <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px]">{projects.filter(p=>p.isTemplate===(t==='templates')).length}</span></button>)}</div><span className="pb-3 text-xs text-muted">Browser storage · No cloud sync</span></div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
    {visible.length===0?<div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd8d5] bg-white text-center"><span className="mb-4 rounded-2xl bg-surface-2 p-4">{tab==='projects'?<FolderOpen className="h-8 w-8 text-primary"/>:<LayoutTemplate className="h-8 w-8 text-primary"/>}</span><h2 className="text-lg font-semibold">{tab==='projects'?'No saved projects yet':'No reusable templates yet'}</h2><p className="mt-2 max-w-sm px-6 text-sm leading-6 text-muted">{tab==='projects'?'Start by uploading, scanning, or creating a certificate. It will automatically save here.':'Open a project, then choose Save layout to create a reusable template without a recipient name.'}</p><Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Get started <ArrowRight className="h-4 w-4"/></Link></div>:<div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(p=><ProjectCard key={p.id} project={p} onDuplicate={duplicate} onTemplate={template} onDelete={setTarget} onExport={p=>{void exportProject(p).catch(()=>setError('Could not export project.'))}}/>)}</div>}
    <input ref={input} className="hidden" type="file" accept=".certalign" onChange={e=>{void importBundle(e.target.files?.[0]);e.target.value=''}}/>
    <AlertDialog isOpen={!!target} onOpenChange={open=>!open&&setTarget(null)} title="Delete this project?" description={`This removes “${target?.title||'the project'}” and its stored certificate from this browser. You cannot undo this unless you have an exported backup.`} confirmLabel="Delete project" danger pending={pending} onConfirm={remove}/>
  </div>
}
