import { cn } from '@/lib/utils'

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded-[5px] border border-border/80 bg-muted/60 px-1.5 font-sans text-xs font-medium leading-none text-muted-foreground shadow-xs',
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      data-slot="kbd-group"
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
