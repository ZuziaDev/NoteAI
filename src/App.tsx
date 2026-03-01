import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import {
  MandatoryConsentModal,
  RestoreBackupModal,
} from './components/ui/ComplianceModals'
import { DailyBriefingModal } from './components/ui/DailyBriefingModal'
import { CommandPalette } from './components/ui/CommandPalette'
import {
  createDailyBriefing,
  getTodayKey,
  type DailyBriefing,
} from './lib/dailyBriefing'
import { useI18n } from './lib/i18n'
import { discordApi } from './lib/discordApi'
import { storageApi } from './lib/storageApi'
import { ChatPanel } from './modules/chat/ChatPanel'
import { NotesPanel } from './modules/notes/NotesPanel'
import { FocusPanel } from './modules/focus/FocusPanel'
import { SettingsPanel } from './modules/settings/SettingsPanel'
import { TimeMapPanel } from './modules/timemap/TimeMapPanel'
import { TodoPanel } from './modules/todos/TodoPanel'
import { useAppearanceStore } from './stores/appearanceStore'
import { useAuthStore } from './stores/authStore'
import { type AppSection, useUIStore } from './stores/uiStore'
import type { AppConsents } from '../shared/types/storage'

const renderPanel = (
  section: AppSection,
  query: string,
  summaryTick: number,
  summaryHandledTick: number,
  onSummaryHandled: (tick: number) => void,
) => {
  if (section === 'todos') return <TodoPanel query={query} />
  if (section === 'timemap') return <TimeMapPanel query={query} />
  if (section === 'notes') return <NotesPanel query={query} />
  if (section === 'chat') {
    return (
      <ChatPanel
        query={query}
        summaryTick={summaryTick}
        summaryHandledTick={summaryHandledTick}
        onSummaryHandled={onSummaryHandled}
      />
    )
  }
  if (section === 'focus') return <FocusPanel query={query} />
  return <SettingsPanel />
}

function App() {
  const { t, language } = useI18n()
  const activeSection = useUIStore((state) => state.activeSection)
  const searchQuery = useUIStore((state) => state.searchQuery)
  const chatSummaryTick = useUIStore((state) => state.chatSummaryTick)
  const chatSummaryHandledTick = useUIStore((state) => state.chatSummaryHandledTick)
  const setActiveSection = useUIStore((state) => state.setActiveSection)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const triggerChatSummary = useUIStore((state) => state.triggerChatSummary)
  const markChatSummaryHandled = useUIStore((state) => state.markChatSummaryHandled)
  const localSettings = useAppearanceStore((state) => state.settings)
  const loadAppearance = useAppearanceStore((state) => state.loadSettings)
  const appearanceLoaded = useAppearanceStore((state) => state.loaded)
  const patchAppearanceSettings = useAppearanceStore((state) => state.patchSettings)
  const loadAuth = useAuthStore((state) => state.load)
  const authState = useAuthStore((state) => state.state)
  const authLoaded = useAuthStore((state) => state.loaded)
  const authLoading = useAuthStore((state) => state.loading)
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [consents, setConsents] = useState<AppConsents>({
    tosAcceptedAt: null,
    privacyAcceptedAt: null,
    cloudBackupConsentAt: null,
  })
  const [consentBusy, setConsentBusy] = useState(false)
  const [flowBusy, setFlowBusy] = useState(false)
  const [restorePrompt, setRestorePrompt] = useState<{
    uid: string
    updatedAt: string | null
  } | null>(null)
  const latestAuthUid = useRef<string | null>(null)
  const sectionLabels: Record<AppSection, string> = {
    todos: t('To-Do', 'To-Do'),
    timemap: t('TimeMap', 'TimeMap'),
    notes: t('Notlar', 'Notes'),
    chat: t('AI Sohbet', 'AI Chat'),
    focus: t('Odak', 'Focus'),
    settings: t('Ayarlar', 'Settings'),
  }

  useEffect(() => {
    if (!appearanceLoaded) {
      void loadAppearance()
    }
  }, [appearanceLoaded, loadAppearance])

  useEffect(() => {
    if (!authLoaded && !authLoading) {
      void loadAuth()
    }
  }, [authLoaded, authLoading, loadAuth])

  useEffect(() => {
    const loadConsents = async () => {
      try {
        const loaded = await storageApi.getConsents()
        setConsents(loaded)
      } catch {
        // Keep default non-accepted consent state.
      }
    }
    void loadConsents()
  }, [])

  useEffect(() => {
    document.body.dataset.theme = localSettings.themePreset
    document.body.dataset.uiStyle = localSettings.uiStylePreset
  }, [localSettings.themePreset, localSettings.uiStylePreset])

  useEffect(() => {
    void discordApi.setPresence({ section: activeSection })
  }, [activeSection])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k'
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!appearanceLoaded || !localSettings.dailyBriefingEnabled) return

    const todayKey = getTodayKey()
    if (localSettings.lastDailyBriefingDate === todayKey) return

    const loadBriefing = async () => {
      const todos = await storageApi.getTodos()
      setBriefing(createDailyBriefing(todos, language))
      await patchAppearanceSettings({ lastDailyBriefingDate: todayKey })
    }

    void loadBriefing()
  }, [
    appearanceLoaded,
    localSettings.dailyBriefingEnabled,
    localSettings.lastDailyBriefingDate,
    patchAppearanceSettings,
    language,
  ])

  const hasMandatoryConsent = Boolean(consents.tosAcceptedAt && consents.privacyAcceptedAt)
  const requiresMandatoryConsent = !hasMandatoryConsent

  const maybePromptRestore = useCallback(async (uid: string) => {
    const hasDecision = await storageApi.hasRestoreDecision(uid)
    if (hasDecision) return
    const status = await storageApi.getCloudBackupStatus()
    if (!status.ok || !status.hasBackup || status.hasLocalData) return
    setRestorePrompt({
      uid,
      updatedAt: status.updatedAt,
    })
  }, [])

  useEffect(() => {
    if (!hasMandatoryConsent) return
    const uid = authState.user?.uid ?? null
    if (!uid) {
      latestAuthUid.current = null
      setRestorePrompt(null)
      return
    }
    if (latestAuthUid.current === uid) return
    latestAuthUid.current = uid

    const runAuthComplianceFlow = async () => {
      const preference = await storageApi.getAccountCloudPreference(uid)
      if (preference.mode === 'unset') {
        await storageApi.grantCloudBackupConsent().catch(() => {})
        await storageApi.setAccountCloudPreference(uid, 'cloud').catch(() => {})
      }
      await maybePromptRestore(uid)
    }

    void runAuthComplianceFlow()
  }, [authState.user?.uid, hasMandatoryConsent, maybePromptRestore])

  const acceptMandatoryConsents = async () => {
    setConsentBusy(true)
    try {
      const next = await storageApi.acceptMandatoryConsents()
      setConsents(next)
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : t('Onay kaydedilemedi.', 'Consent could not be saved.'),
      )
    } finally {
      setConsentBusy(false)
    }
  }

  const restoreFromCloud = async () => {
    if (!restorePrompt) return
    setFlowBusy(true)
    try {
      const result = await storageApi.syncFromCloud()
      if (!result.ok) {
        window.alert(
          result.error ??
            t('Cloud geri yukleme basarisiz.', 'Cloud restore failed.'),
        )
        return
      }
      await storageApi.markRestoreDecision(restorePrompt.uid, 'restore')
      await loadAppearance()
      setRestorePrompt(null)
    } finally {
      setFlowBusy(false)
    }
  }

  const startEmptyFromRestorePrompt = async () => {
    if (!restorePrompt) return
    setFlowBusy(true)
    try {
      await storageApi.resetLocalData()
      await storageApi.markRestoreDecision(restorePrompt.uid, 'empty')
      setRestorePrompt(null)
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : t('Bos baslatma basarisiz.', 'Starting empty failed.'),
      )
    } finally {
      setFlowBusy(false)
    }
  }

  return (
    <div
      className={`app-shell relative min-h-screen overflow-hidden p-3 sm:p-4 lg:p-6 ${
        localSettings.uiStylePreset === 'v02' ? 'ui-v02-layout' : ''
      }`}
    >
      <div className="aurora-spot aurora-spot-a" />
      <div className="aurora-spot aurora-spot-b" />

      <motion.div
        className="relative mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1600px] flex-col gap-4 lg:h-[calc(100vh-3rem)] lg:flex-row"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sectionLabels={sectionLabels}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <TopBar
            activeSectionLabel={sectionLabels[activeSection]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewTodo={() => {
              setActiveSection('todos')
              setSearchQuery('')
            }}
            onAISummary={() => {
              setActiveSection('chat')
              triggerChatSummary()
            }}
          />

          <main className="glass-panel flex min-h-0 flex-1 overflow-hidden p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                className="h-full w-full overflow-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderPanel(
                  activeSection,
                  searchQuery,
                  chatSummaryTick,
                  chatSummaryHandledTick,
                  markChatSummaryHandled,
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      {briefing ? (
        <DailyBriefingModal
          briefing={briefing}
          onClose={() => setBriefing(null)}
        />
      ) : null}

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onGoSection={(section) => setActiveSection(section)}
        onTriggerSummary={() => {
          setActiveSection('chat')
          triggerChatSummary()
        }}
      />

      {requiresMandatoryConsent ? (
        <MandatoryConsentModal busy={consentBusy} onAccept={acceptMandatoryConsents} />
      ) : null}

      {hasMandatoryConsent && restorePrompt ? (
        <RestoreBackupModal
          updatedAt={restorePrompt.updatedAt}
          busy={flowBusy}
          onRestore={restoreFromCloud}
          onStartEmpty={startEmptyFromRestorePrompt}
        />
      ) : null}
    </div>
  )
}

export default App
