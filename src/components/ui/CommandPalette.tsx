import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { semanticIncludes } from '../../lib/semanticSearch'
import type { AppSection } from '../../stores/uiStore'

type CommandItem = {
  id: string
  label: string
  hint: string
  action: () => void
}

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  onGoSection: (section: AppSection) => void
  onTriggerSummary: () => void
}

export const CommandPalette = ({
  open,
  onClose,
  onGoSection,
  onTriggerSummary,
}: CommandPaletteProps) => {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'go-todo',
        label: 'Go: To-Do',
        hint: t('Gorev listesine gec', 'Go to the task list'),
        action: () => onGoSection('todos'),
      },
      {
        id: 'go-timemap',
        label: 'Go: TimeMap',
        hint: t('Takvim gorunumunu ac', 'Open calendar view'),
        action: () => onGoSection('timemap'),
      },
      {
        id: 'go-notes',
        label: 'Go: Notes',
        hint: t('Not editorunu ac', 'Open notes editor'),
        action: () => onGoSection('notes'),
      },
      {
        id: 'go-chat',
        label: 'Go: AI Chat',
        hint: t('Sohbet ekranini ac', 'Open chat screen'),
        action: () => onGoSection('chat'),
      },
      {
        id: 'go-focus',
        label: 'Go: Focus',
        hint: t('Pomodoro odak modunu ac', 'Open Pomodoro focus mode'),
        action: () => onGoSection('focus'),
      },
      {
        id: 'go-settings',
        label: 'Go: Settings',
        hint: t('Ayarlar paneline gec', 'Go to settings panel'),
        action: () => onGoSection('settings'),
      },
      {
        id: 'ai-summary',
        label: 'AI Summary',
        hint: t('To-Do + Notes ozeti olustur', 'Create To-Do + Notes summary'),
        action: onTriggerSummary,
      },
    ],
    [onGoSection, onTriggerSummary, t],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter(
      (item) =>
        semanticIncludes(`${item.label} ${item.hint}`, needle),
    )
  }, [commands, query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const target = filtered[activeIndex]
        if (target) {
          target.action()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, filtered, onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-[12vh] w-full max-w-2xl rounded-2xl border border-white/20 bg-black/75 p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          placeholder={t('Komut ara... (Ctrl+K)', 'Search commands... (Ctrl+K)')}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
        />
        <div className="mt-2 max-h-[360px] space-y-1 overflow-auto">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
              {t('Sonuc bulunamadi.', 'No results found.')}
            </p>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left ${
                  activeIndex === index
                    ? 'accent-soft'
                    : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
                }`}
              >
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-slate-400">{item.hint}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
