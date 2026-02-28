import { motion } from 'framer-motion'
import { useI18n } from '../../lib/i18n'
import { useAuthStore } from '../../stores/authStore'
import { type AppSection } from '../../stores/uiStore'

type SidebarProps = {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
  sectionLabels: Record<AppSection, string>
}

const sections: AppSection[] = ['todos', 'timemap', 'notes', 'chat', 'focus', 'settings']

export const Sidebar = ({
  activeSection,
  onSectionChange,
  sectionLabels,
}: SidebarProps) => {
  const { t } = useI18n()
  const authState = useAuthStore((state) => state.state)

  return (
    <aside className="glass-panel w-full p-4 lg:w-72 lg:p-5">
      <div className="flex items-center justify-between lg:block">
        <div className="space-y-1">
          <p className="font-display text-xl font-semibold tracking-wide text-white">
            NoteAI
          </p>
          <p className="text-xs text-slate-300/90">
            {authState.isAuthenticated
              ? t(`Hesap: ${authState.user?.email ?? ''}`, `Account: ${authState.user?.email ?? ''}`)
              : t('Local-first calisma alani', 'Local-first workspace')}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-right text-[11px] leading-tight text-slate-200">
          <p>{t('Masaustu Surumu', 'Desktop Edition')}</p>
          <p className="text-slate-300/90">Powered by Zuzia Inc.</p>
        </div>
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-7 lg:flex-col lg:overflow-visible lg:pb-0">
        {sections.map((section, index) => {
          const isActive = activeSection === section
          return (
            <motion.button
              key={section}
              className={`relative min-w-0 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'accent-soft'
                  : 'border-white/10 bg-black/20 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectionChange(section)}
            >
              <span className="text-sm font-medium">{sectionLabels[section]}</span>
            </motion.button>
          )
        })}
      </nav>
    </aside>
  )
}
