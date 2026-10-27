'use client'
import { useState } from 'react'
import { Select as AriaSelect, Button as AriaButton, SelectValue, Popover, ListBox, ListBoxItem, Label } from 'react-aria-components'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'
export type Option = { id: string; label: string; isDisabled?: boolean }
type Props = { options: Option[]; value: string; onChange: (value: string) => void; label?: string; className?: string; disabled?: boolean; placeholder?: string }
export function Select({ options, value, onChange, label, className, disabled, placeholder = 'Select option' }: Props) {
  const [isOpen, setOpen] = useState(false)
  return <AriaSelect className={cn('min-w-0', className)} selectedKey={value} onSelectionChange={key => key != null && onChange(String(key))} isDisabled={disabled} isOpen={isOpen} onOpenChange={setOpen} placeholder={placeholder}>
    {label && <Label className="mb-1.5 block text-xs font-medium text-muted">{label}</Label>}
    <AriaButton className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border border-border bg-white px-3 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-focus/30 data-[disabled]:opacity-50">
      <SelectValue className="min-w-0 truncate" />{isOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
    </AriaButton>
    <Popover className="z-50 w-[var(--trigger-width)] overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg outline-none">
      <ListBox items={options} className="max-h-60 overflow-auto outline-none" selectionMode="single">
        {item => <ListBoxItem id={item.id} textValue={item.label} isDisabled={item.isDisabled} className="group flex min-h-10 cursor-default items-center justify-between rounded-lg px-3 text-sm outline-none data-[focused]:bg-surface-2 data-[selected]:bg-primary/10 data-[disabled]:opacity-40">
          {item.label}<Check className="h-4 w-4 text-primary opacity-0 group-data-[selected]:opacity-100" />
        </ListBoxItem>}
      </ListBox>
    </Popover>
  </AriaSelect>
}
