'use client'
import { Button as AriaButton } from 'react-aria-components'
import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
const styles = cva('inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-focus/35 disabled:cursor-not-allowed disabled:opacity-45 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45', {
  variants: {
    variant: {
      primary: 'bg-primary text-white hover:bg-primary-strong',
      secondary: 'border border-border bg-white text-foreground hover:bg-surface-2',
      ghost: 'text-muted hover:bg-surface-2 hover:text-foreground',
      danger: 'bg-danger text-white hover:bg-red-700',
      subtle: 'bg-surface-2 text-foreground hover:bg-surface-3',
    },
    size: { normal: 'min-h-10 px-4', small: 'min-h-9 px-3 text-xs', large: 'min-h-12 px-5 text-sm', icon: 'h-10 w-10 px-0' },
  }, defaultVariants: { variant: 'primary', size: 'normal' },
})
type Props = Omit<ComponentProps<typeof AriaButton>, 'className'> & VariantProps<typeof styles> & { className?: string }
export function Button({ variant, size, className, ...props }: Props) { return <AriaButton {...props} className={cn(styles({ variant, size }), className)} /> }
