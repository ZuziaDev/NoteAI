import { motion } from 'framer-motion'
import type { DailyBriefing } from '../../lib/dailyBriefing'
import { useI18n } from '../../lib/i18n'

type DailyBriefingModalProps = {
  briefing: DailyBriefing
  onClose: () => void
}

export const DailyBriefingModal = ({ briefing, onClose }: DailyBriefingModalProps) => {
  const { t } = useI18n()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-panel w-full max-w-2xl p-5"
      >
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
          {t('Gunluk Rapor', 'Daily Briefing')} • {briefing.dateLabel}
        </p>
        <h3 className="mt-2 font-display text-2xl text-white">
          {t('NoteAI Sabah Raporu', 'NoteAI Morning Report')}
        </h3>
        <p className="mt-2 text-sm text-slate-200">{briefing.headline}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('Ozet', 'Summary')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              {briefing.summaryLines.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('Odak Listesi', 'Focus List')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              {briefing.focusItems.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="accent-strong rounded-xl border px-4 py-2 text-sm transition hover:brightness-110"
          >
            {t('Anladim', 'Got it')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
