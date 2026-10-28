'use client'
import { useEffect, useMemo, useState } from 'react'
import { ComboBox, Input, Popover, ListBox, ListBoxItem, Label, Button as AriaButton } from 'react-aria-components'
import { Check, ChevronDown } from 'lucide-react'
import type { FontChoice } from '@/lib/fonts'
export function FontComboBox({ fonts, selected, onSelect }: { fonts: FontChoice[]; selected: string; onSelect: (value: string) => void }) {
  const [query, setQuery] = useState('')
  const selectedLabel = useMemo(() => fonts.find(f => f.id === selected)?.label || '', [fonts, selected])
  useEffect(() => { setQuery(selectedLabel) }, [selectedLabel])
  const matches = useMemo(() => {
    if (query === selectedLabel) return fonts
    const needle = query.toLowerCase()
    return fonts.filter(f => `${f.label} ${f.category}`.toLowerCase().includes(needle))
  }, [fonts, query, selectedLabel])
  return <ComboBox selectedKey={selected} onSelectionChange={key => { if (key) { onSelect(String(key)); setQuery(fonts.find(f => f.id === String(key))?.label || '') } }} inputValue={query} onInputChange={setQuery} items={matches} menuTrigger="focus" className="w-full">
    <Label className="mb-1.5 block text-xs font-medium text-muted">Font family</Label>
    <div className="flex h-10 items-center rounded-[10px] border border-border bg-white focus-within:ring-[3px] focus-within:ring-focus/25">
      <Input className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" aria-label="Search fonts" placeholder="Search fonts…" onFocus={e => e.currentTarget.select()} />
      <AriaButton className="p-2 text-muted" aria-label="Show font list" onPress={() => setQuery('')}><ChevronDown className="h-4 w-4" /></AriaButton>
    </div>
    <Popover className="z-50 w-[var(--trigger-width)] rounded-xl border border-border bg-white p-1 shadow-xl outline-none">
      <ListBox items={matches} className="max-h-72 overflow-auto outline-none" renderEmptyState={() => <p className="p-3 text-sm text-muted">No matching fonts</p>}>
        {font => <ListBoxItem id={font.id} textValue={font.label} className="group flex cursor-default items-center justify-between rounded-lg px-3 py-2 outline-none data-[focused]:bg-surface-2 data-[selected]:bg-primary/10">
          <span className="flex min-w-0 flex-col gap-0.5"><span className="truncate text-base" style={{ fontFamily: font.css }}>{font.label}</span><span className="text-[11px] text-muted">{font.category}</span></span>
          <Check className="h-4 w-4 shrink-0 text-primary opacity-0 group-data-[selected]:opacity-100" />
        </ListBoxItem>}
      </ListBox>
    </Popover>
  </ComboBox>
}
