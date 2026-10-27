'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Files, CircleHelp, Settings2, Plus, AlignCenterHorizontal, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
const links = [
  { href: '/projects', label: 'My projects', Icon: Files },
  { href: '/help', label: 'Help', Icon: CircleHelp },
  { href: '/settings', label: 'Settings', Icon: Settings2 },
]
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CertAlign home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary text-white"><AlignCenterHorizontal className="h-5 w-5" strokeWidth={2.4} /></span>
          <span className="text-lg font-bold tracking-tight">Cert<span className="text-primary">Align</span><span className="ml-1 hidden align-top text-[9px] font-semibold uppercase tracking-wider text-muted sm:inline">Studio</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
          {links.map(({ href, label, Icon }) => <Link key={href} href={href} className={cn('inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium sm:px-3 sm:text-sm', pathname === href ? 'bg-surface-2 text-primary' : 'text-muted hover:bg-surface-2 hover:text-foreground')}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span></Link>)}
          <Link href="/" className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-strong sm:ml-2 sm:text-sm"><Plus className="h-4 w-4" /><span>New</span></Link>
        </nav>
      </div>
    </header>
    <main>{children}</main>
    {pathname !== '/editor' && <footer className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-7 text-xs text-muted sm:px-8"><span>© CertAlign · Built for precision, not complexity.</span><span className="inline-flex items-center gap-1">Your certificates stay in this browser <ArrowUpRight className="h-3 w-3" /></span></footer>}
  </div>
}
