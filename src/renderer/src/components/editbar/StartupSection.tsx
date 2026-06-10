import { SectionTitle, type SectionProps } from './common'

export function StartupSection({ settings, update }: SectionProps) {
  return (
    <>
      <SectionTitle>Startup</SectionTitle>
      <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-800">
        <span className="text-neutral-200">Launch on login</span>
        <input
          type="checkbox"
          checked={settings.autoStart}
          onChange={(e) => void update({ autoStart: e.target.checked })}
          className="h-4 w-4 accent-white"
        />
      </label>
    </>
  )
}
