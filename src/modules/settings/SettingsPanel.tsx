import { useEffect, useState } from 'react'
import {
  AI_DEFAULT_BASE_URLS,
  AI_DEFAULT_MODELS,
  AI_PROVIDER_LABELS,
  DEFAULT_AI_SETTINGS,
} from '../../../shared/constants/ai'
import {
  DESIGN_PACKS,
  THEME_PRESET_LABELS,
  UI_STYLE_LABELS,
} from '../../../shared/constants/appearance'
import type { AIProvider, AISettings } from '../../../shared/types/ai'
import type {
  AppLanguage,
  ThemePreset,
  UiStylePreset,
} from '../../../shared/types/storage'
import { aiApi } from '../../lib/aiApi'
import { useI18n } from '../../lib/i18n'
import { storageApi } from '../../lib/storageApi'
import { useAppearanceStore } from '../../stores/appearanceStore'
import { useAuthStore } from '../../stores/authStore'

const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'other']
const themePresets = Object.keys(THEME_PRESET_LABELS) as ThemePreset[]
const uiPresets: UiStylePreset[] = ['glass', 'solid', 'outline', 'neon', 'minimal']
const languageOptions: AppLanguage[] = ['tr', 'en']

export const SettingsPanel = () => {
  const { t } = useI18n()
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [appearanceMessage, setAppearanceMessage] = useState<string | null>(null)
  const [dataMessage, setDataMessage] = useState<string | null>(null)
  const [cloudMessage, setCloudMessage] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState<
    null | 'signin' | 'signup' | 'signout'
  >(
    null,
  )
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null)
  const localSettings = useAppearanceStore((state) => state.settings)
  const localLoaded = useAppearanceStore((state) => state.loaded)
  const loadLocalSettings = useAppearanceStore((state) => state.loadSettings)
  const patchLocalSettings = useAppearanceStore((state) => state.patchSettings)
  const authState = useAuthStore((state) => state.state)
  const authLoaded = useAuthStore((state) => state.loaded)
  const authLoading = useAuthStore((state) => state.loading)
  const loadAuth = useAuthStore((state) => state.load)
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword)
  const signUpWithPassword = useAuthStore((state) => state.signUpWithPassword)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await aiApi.getSettings()
        setAiSettings({ ...DEFAULT_AI_SETTINGS, ...saved })
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (!localLoaded) {
      void loadLocalSettings()
    }
  }, [localLoaded, loadLocalSettings])

  useEffect(() => {
    if (!authLoaded && !authLoading) {
      void loadAuth()
    }
  }, [authLoaded, authLoading, loadAuth])

  const setField = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setAiSettings((current) => ({ ...current, [key]: value }))
  }

  const handleProviderChange = (provider: AIProvider) => {
    setAiSettings((current) => ({
      ...current,
      provider,
      baseUrl:
        provider === 'other' ? current.baseUrl : AI_DEFAULT_BASE_URLS[provider],
      model: provider === 'other' ? current.model : AI_DEFAULT_MODELS[provider],
    }))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setAiMessage(null)
    try {
      const saved = await aiApi.saveSettings(aiSettings)
      setAiSettings(saved)
      setAiMessage(t('AI ayarlari kaydedildi.', 'AI settings saved.'))
    } catch (error) {
      setAiMessage(
        error instanceof Error
          ? error.message
          : t('Ayarlar kaydedilemedi.', 'Settings could not be saved.'),
      )
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSignIn = async () => {
    setAuthBusy('signin')
    setAuthMessage(null)
    try {
      const result = await signInWithPassword(authEmail, authPassword)
      if (!result.ok) {
        setAuthMessage(
          result.error ?? t('Giris basarisiz.', 'Sign in failed.'),
        )
      } else {
        setAuthMessage(t('Giris basarili.', 'Signed in.'))
      }
    } finally {
      setAuthBusy(null)
    }
  }

  const handleSignUp = async () => {
    setAuthBusy('signup')
    setAuthMessage(null)
    try {
      const result = await signUpWithPassword(authEmail, authPassword)
      if (!result.ok) {
        setAuthMessage(
          result.error ?? t('Kayit basarisiz.', 'Sign up failed.'),
        )
      } else {
        setAuthMessage(
          t('Hesap olusturuldu ve giris yapildi.', 'Account created and signed in.'),
        )
      }
    } finally {
      setAuthBusy(null)
    }
  }

  const handleSignOut = async () => {
    setAuthBusy('signout')
    setAuthMessage(null)
    try {
      const result = await signOut()
      if (!result.ok) {
        setAuthMessage(
          result.error ?? t('Cikis basarisiz.', 'Sign out failed.'),
        )
      } else {
        setAuthMessage(t('Cikis yapildi.', 'Signed out.'))
      }
    } finally {
      setAuthBusy(null)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setAiMessage(null)
    try {
      const result = await aiApi.testConnection(aiSettings)
      setAiMessage(result.message)
    } catch (error) {
      setAiMessage(
        error instanceof Error
          ? error.message
          : t('Baglanti testi basarisiz.', 'Connection test failed.'),
      )
    } finally {
      setTestingConnection(false)
    }
  }

  const handleThemeChange = async (themePreset: ThemePreset) => {
    const saved = await patchLocalSettings({ themePreset })
    setAppearanceMessage(
      saved
        ? t('Tema kaydedildi.', 'Theme saved.')
        : t('Tema kaydedilemedi.', 'Theme could not be saved.'),
    )
  }

  const handleUiStyleChange = async (uiStylePreset: UiStylePreset) => {
    const saved = await patchLocalSettings({ uiStylePreset })
    setAppearanceMessage(
      saved
        ? t('UI stili kaydedildi.', 'UI style saved.')
        : t('UI stili kaydedilemedi.', 'UI style could not be saved.'),
    )
  }

  const handleLanguageChange = async (language: AppLanguage) => {
    const saved = await patchLocalSettings({ language })
    setAppearanceMessage(
      saved
        ? t('Dil guncellendi.', 'Language updated.')
        : t('Dil guncellenemedi.', 'Language could not be updated.'),
    )
  }

  const handleApplyPack = async (
    themePreset: ThemePreset,
    uiStylePreset: UiStylePreset,
  ) => {
    const saved = await patchLocalSettings({
      themePreset,
      uiStylePreset,
    })
    setAppearanceMessage(
      saved
        ? t('Tasarim paketi uygulandi.', 'Design pack applied.')
        : t('Paket uygulanamadi.', 'Pack could not be applied.'),
    )
  }

  const handleCloudSyncToggle = async () => {
    const enableCloudSync = !localSettings.cloudBackupEnabled
    setCloudMessage(null)

    if (enableCloudSync) {
      await storageApi.grantCloudBackupConsent().catch(() => {})
    }

    const saved = await patchLocalSettings({ cloudBackupEnabled: enableCloudSync })
    if (!saved) {
      setCloudMessage(
        t(
          'Bulut senkronizasyonu ayari kaydedilemedi.',
          'Cloud sync setting could not be saved.',
        ),
      )
      return
    }

    setCloudMessage(
      saved.cloudBackupEnabled
        ? t(
            'Bulut senkronizasyonu acik. Veriler otomatik esitlemeye alindi.',
            'Cloud sync is enabled. Data will sync automatically.',
          )
        : t(
            'Bulut senkronizasyonu kapali. Veriler sadece bu cihazda tutulur.',
            'Cloud sync is disabled. Data is kept only on this device.',
          ),
    )
  }

  const handleDailyBriefingToggle = async () => {
    const saved = await patchLocalSettings({
      dailyBriefingEnabled: !localSettings.dailyBriefingEnabled,
    })
    setAppearanceMessage(
      saved
        ? t(
            `Gunluk rapor ${saved.dailyBriefingEnabled ? 'acik' : 'kapali'}.`,
            `Daily briefing is ${saved.dailyBriefingEnabled ? 'on' : 'off'}.`,
          )
        : t(
            'Gunluk rapor ayari kaydedilemedi.',
            'Daily briefing setting could not be saved.',
          ),
    )
  }

  const handleExport = async () => {
    setBusy('export')
    const result = await storageApi.exportJson()
    setBusy(null)

    if (result.cancelled) {
      setDataMessage(t('Export iptal edildi.', 'Export cancelled.'))
      return
    }

    if (!result.ok) {
      setDataMessage(
        result.error ?? t('Export basarisiz.', 'Export failed.'),
      )
      return
    }

    setDataMessage(
      t(`Export tamamlandi: ${result.path}`, `Export completed: ${result.path}`),
    )
  }

  const handleImport = async () => {
    setBusy('import')
    const result = await storageApi.importJson()
    setBusy(null)

    if (result.cancelled) {
      setDataMessage(t('Import iptal edildi.', 'Import cancelled.'))
      return
    }

    if (!result.ok) {
      setDataMessage(
        result.error ?? t('Import basarisiz.', 'Import failed.'),
      )
      return
    }

    setDataMessage(
      t(`Import tamamlandi: ${result.path}`, `Import completed: ${result.path}`),
    )
    await loadLocalSettings()
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-white">
        {t('Ayarlar', 'Settings')}
      </h2>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 xl:col-span-2">
          <p className="text-sm font-semibold text-slate-100">
            {t('Temalar', 'Themes')}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t(
              'Temayi ve panel stilini buradan aninda degistirebilirsin.',
              'You can instantly change theme and panel style here.',
            )}
          </p>

          <div className="mt-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('Dil', 'Language')}
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {languageOptions.map((option) => {
                const selected = localSettings.language === option
                return (
                  <button
                    key={option}
                    onClick={() => void handleLanguageChange(option)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? 'accent-soft'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    {option === 'tr' ? 'Turkce' : 'English'}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('Tema Onaylari', 'Theme Presets')}
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {themePresets.map((themePreset) => {
                const selected = localSettings.themePreset === themePreset
                return (
                  <button
                    key={themePreset}
                    onClick={() => void handleThemeChange(themePreset)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? 'accent-soft'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    {THEME_PRESET_LABELS[themePreset]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('UI Stili', 'UI Style')}
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {uiPresets.map((uiPreset) => {
                const selected = localSettings.uiStylePreset === uiPreset
                return (
                  <button
                    key={uiPreset}
                    onClick={() => void handleUiStyleChange(uiPreset)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? 'accent-soft'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    {UI_STYLE_LABELS[uiPreset]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">
              {t('Hazir UI Paketleri', 'Ready UI Packs')}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {DESIGN_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => void handleApplyPack(pack.themePreset, pack.uiStylePreset)}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                >
                  <p className="text-sm font-medium text-slate-100">{pack.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{pack.description}</p>
                </button>
              ))}
            </div>
          </div>
          {appearanceMessage ? (
            <p className="mt-3 text-xs text-cyan-100">{appearanceMessage}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-semibold text-slate-100">
            {t('Bulut Senkronizasyonu', 'Cloud Sync')}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {t(
              'Varsayilan olarak kapalidir. Acmadan once acik riza alinir.',
              'Disabled by default. Explicit consent is required before enabling.',
            )}
          </p>
          <button
            onClick={() => void handleCloudSyncToggle()}
            className={`mt-3 rounded-xl border px-3 py-2 text-sm transition ${
              localSettings.cloudBackupEnabled
                ? 'accent-soft'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            {localSettings.cloudBackupEnabled
              ? t('Bulut Senkronizasyonu: Acik', 'Cloud Sync: On')
              : t('Bulut Senkronizasyonu: Kapali', 'Cloud Sync: Off')}
          </button>
          <p className="mt-2 text-xs text-slate-400">
            {t(
              'Internet yoksa veriler yerelde kalir. Baglanti gelince otomatik senkronize olur.',
              'If internet is unavailable, data stays local and syncs automatically when online.',
            )}
          </p>
          <label className="mt-2 block text-xs text-slate-300">
            {t('Cakisma Cozum Stratejisi', 'Conflict Resolution Strategy')}
            <select
              value={localSettings.syncConflictStrategy}
              onChange={(event) =>
                void patchLocalSettings({
                  syncConflictStrategy: event.target.value as 'latest' | 'merge',
                })
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="merge">{t('Merge (Birlestir)', 'Merge')}</option>
              <option value="latest">{t('Latest (En yeni)', 'Latest')}</option>
            </select>
          </label>
          {cloudMessage ? <p className="mt-2 text-xs text-cyan-100">{cloudMessage}</p> : null}
          <button
            onClick={() => void handleDailyBriefingToggle()}
            className={`mt-2 rounded-xl border px-3 py-2 text-sm transition ${
              localSettings.dailyBriefingEnabled
                ? 'accent-soft'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            {localSettings.dailyBriefingEnabled
              ? t('Gunluk Rapor: Acik', 'Daily Briefing: On')
              : t('Gunluk Rapor: Kapali', 'Daily Briefing: Off')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-semibold text-slate-100">AI Provider</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {providers.map((provider) => {
              const selected = aiSettings.provider === provider
              return (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    selected
                      ? 'accent-soft'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  {AI_PROVIDER_LABELS[provider]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-semibold text-slate-100">
            {t('Baglanti', 'Connection')}
          </p>
          <div className="mt-3 space-y-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={aiSettings.apiKey}
              onChange={(event) => setField('apiKey', event.target.value)}
              placeholder="API Key"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => setShowApiKey((current) => !current)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/15"
            >
              {showApiKey ? t('API key gizle', 'Hide API key') : t('API key goster', 'Show API key')}
            </button>
            <input
              value={aiSettings.baseUrl}
              onChange={(event) => setField('baseUrl', event.target.value)}
              disabled={aiSettings.provider !== 'other'}
              placeholder="Base URL"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              value={aiSettings.model}
              onChange={(event) => setField('model', event.target.value)}
              placeholder={t('Model (opsiyonel)', 'Model (optional)')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            <textarea
              value={aiSettings.systemPrompt}
              onChange={(event) => setField('systemPrompt', event.target.value)}
              placeholder="System prompt"
              className="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void handleSaveSettings()}
              disabled={loading || savingSettings || testingConnection}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? t('Kaydediliyor...', 'Saving...') : t('Kaydet', 'Save')}
            </button>
            <button
              onClick={() => void handleTestConnection()}
              disabled={loading || savingSettings || testingConnection}
              className="accent-strong rounded-xl border px-3 py-2 text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testingConnection ? t('Test ediliyor...', 'Testing...') : 'Test Connection'}
            </button>
          </div>
          {aiMessage ? <p className="mt-2 text-xs text-cyan-100">{aiMessage}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-sm font-semibold text-slate-100">{t('Hesap', 'Account')}</p>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
          {authState.isAuthenticated
            ? t(`Giris yapildi: ${authState.user?.email ?? ''}`, `Signed in: ${authState.user?.email ?? ''}`)
            : t('Guest modundasin.', 'You are in guest mode.')}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
          <input
            type="password"
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            placeholder={t('Sifre', 'Password')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => void handleSignIn()}
            disabled={authBusy !== null}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authBusy === 'signin' ? t('Giris...', 'Signing in...') : t('Giris Yap', 'Sign In')}
          </button>
          <button
            onClick={() => void handleSignUp()}
            disabled={authBusy !== null}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authBusy === 'signup' ? t('Kayit...', 'Signing up...') : t('Hesap Olustur', 'Create Account')}
          </button>
          <button
            onClick={() => void handleSignOut()}
            disabled={authBusy !== null || !authState.isAuthenticated}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authBusy === 'signout' ? t('Cikis...', 'Signing out...') : t('Cikis Yap', 'Sign Out')}
          </button>
        </div>
        {authMessage ? <p className="mt-2 text-xs text-cyan-100">{authMessage}</p> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-sm font-semibold text-slate-100">{t('Veri', 'Data')}</p>
        <p className="mt-1 text-sm text-slate-300">
          {t(
            'Local verileri JSON olarak disa aktar veya iceri al.',
            'Export or import local data as JSON.',
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => void handleExport()}
            disabled={busy !== null}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export JSON
          </button>
          <button
            onClick={() => void handleImport()}
            disabled={busy !== null}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Import JSON
          </button>
        </div>
        {dataMessage ? <p className="mt-2 text-xs text-cyan-100">{dataMessage}</p> : null}
      </div>
    </section>
  )
}
