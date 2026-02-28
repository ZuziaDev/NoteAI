import { useI18n } from '../../lib/i18n'

type TopBarProps = {
  activeSectionLabel: string
  searchQuery: string
  onSearchChange: (value: string) => void
  onNewTodo: () => void
  onAISummary: () => void
}

export const TopBar = ({
  activeSectionLabel,
  searchQuery,
  onSearchChange,
  onNewTodo,
  onAISummary,
}: TopBarProps) => {
  const { t } = useI18n()

  return (
    <header className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="accent-soft rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
          {activeSectionLabel}
        </div>
        <label className="flex min-w-0 flex-1 items-center rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
          <input
            type="text"
            placeholder={t('Ara...', 'Search...')}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
          Ctrl+K
        </span>
        <button
          onClick={onNewTodo}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
        >
          {t('Yeni Gorev', 'New Task')}
        </button>
        <button
          onClick={onAISummary}
          className="accent-strong rounded-xl border px-3 py-2 text-xs font-medium transition hover:brightness-110"
        >
          {t('AI Ozet', 'AI Summary')}
        </button>
      </div>
    </header>
  )
}
