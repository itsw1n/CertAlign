'use client'
import { ModalOverlay, Modal, Dialog, Heading } from 'react-aria-components'
import { Button } from './Button'
type Props = { isOpen: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel: string; onConfirm: () => void | Promise<void>; danger?: boolean; pending?: boolean }
export function AlertDialog({ isOpen, onOpenChange, title, description, confirmLabel, onConfirm, danger = false, pending = false }: Props) {
  return <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-4">
    <Modal className="w-full max-w-md rounded-2xl bg-white shadow-2xl outline-none">
      <Dialog role="alertdialog" className="p-6 outline-none">
        <Heading slot="title" className="text-lg font-semibold">{title}</Heading>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-7 flex justify-end gap-2"><Button variant="secondary" isDisabled={pending} onPress={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} isDisabled={pending} onPress={onConfirm}>{pending ? 'Working…' : confirmLabel}</Button></div>
      </Dialog>
    </Modal>
  </ModalOverlay>
}
