import type { ReactNode } from 'react'
import type { Settings } from '@shared/types'

/** Props shared by every settings-panel section. */
export interface SectionProps {
  settings: Settings
  update: (patch: Partial<Settings>) => Promise<unknown>
}

/** Base styling for text inputs in the panel; prepend width/layout classes. */
export const INPUT_BASE =
  'rounded-lg bg-neutral-800 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none ring-1 ring-white/5 focus:ring-white/20'

export function SectionTitle({ first = false, children }: { first?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mb-2 ${first ? '' : 'mt-4'} text-xs font-semibold uppercase tracking-widest text-neutral-500`}
    >
      {children}
    </div>
  )
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
