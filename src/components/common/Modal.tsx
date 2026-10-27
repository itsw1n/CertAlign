'use client'
import { ModalOverlay, Modal as AriaModal, Dialog, Heading, Button as AriaButton } from 'react-aria-components'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
type Props = { title: string; isOpen: boolean; onOpenChange: (open: boolean) => void; children: ReactNode; className?: string }
export function Modal({ title, isOpen, onOpenChange, children, className }: Props) {
  return <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-3 py-4 backdrop-blur-[2px] data-[entering]:animate-in">
    <AriaModal className={cn('w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl outline-none', className)}>
      <Dialog className="flex max-h-[min(88vh,850px)] flex-col outline-none">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <Heading slot="title" className="text-base font-semibold">{title}</Heading>
          <AriaButton aria-label="Close" className="rounded-lg p-2 text-muted outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus" onPress={() => onOpenChange(false)}><X className="h-4 w-4" /></AriaButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </Dialog>
    </AriaModal>
  </ModalOverlay>
}
