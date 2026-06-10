import type { ReactNode } from 'react'

interface WidgetCardProps {
  title?: string
  /** When false, render the children edge-to-edge (e.g. the camera feed). */
  padded?: boolean
  className?: string
  children: ReactNode
}

/**
 * Shared chrome for every dashboard widget. An error in one widget's content
 * should never blank the whole board, so widgets are wrapped individually
 * (see ErrorBoundary) rather than the dashboard as a whole.
 */
export function WidgetCard({ title, padded = true, className = '', children }: WidgetCardProps) {
  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-neutral-900/70 ring-1 ring-white/5 ${className}`}
    >
      {title && (
        <header className="shrink-0 px-5 pt-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          {title}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${padded ? 'p-5' : ''}`}>{children}</div>
    </section>
  )
}
