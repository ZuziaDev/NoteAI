import { motion } from 'framer-motion'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../../lib/i18n'

type ModalShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

const ModalShell = ({ title, subtitle, children }: ModalShellProps) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="glass-panel w-full max-w-xl p-5"
    >
      <h3 className="font-display text-2xl text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      {children}
    </motion.div>
  </div>
)

type MandatoryConsentModalProps = {
  busy?: boolean
  onAccept: () => void
}

export const MandatoryConsentModal = ({
  busy = false,
  onAccept,
}: MandatoryConsentModalProps) => {
  const { t } = useI18n()
  const [tosChecked, setTosChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const canSubmit = tosChecked && privacyChecked && !busy

  return (
    <ModalShell
      title={t('Kullanim Onayi Gerekli', 'Usage Consent Required')}
      subtitle={t(
        'Devam etmek icin Kullanim Kosullari ve Gizlilik/KVKK metinlerini kabul etmelisin.',
        'To continue, you must accept Terms of Service and Privacy text.',
      )}
    >
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={tosChecked}
            onChange={(event) => setTosChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/30 bg-black/30"
          />
          <span>{t('Kullanim Kosullari metnini okudum ve kabul ediyorum. (zorunlu)', 'I read and accept the Terms of Service. (required)')}</span>
        </label>
        <label className="mt-2 flex items-start gap-2">
          <input
            type="checkbox"
            checked={privacyChecked}
            onChange={(event) => setPrivacyChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/30 bg-black/30"
          />
          <span>{t('Gizlilik / KVKK metnini okudum ve kabul ediyorum. (zorunlu)', 'I read and accept the Privacy policy. (required)')}</span>
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onAccept}
          disabled={!canSubmit}
          className="accent-strong rounded-xl border px-4 py-2 text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? t('Kaydediliyor...', 'Saving...')
            : t('Kabul Et ve Devam Et', 'Accept and Continue')}
        </button>
      </div>
    </ModalShell>
  )
}

type AccountStorageChoiceModalProps = {
  email: string
  busy?: boolean
  onKeepLocal: () => void
  onEnableCloud: () => void
}

export const AccountStorageChoiceModal = ({
  email,
  busy = false,
  onKeepLocal,
  onEnableCloud,
}: AccountStorageChoiceModalProps) => {
  const { t } = useI18n()
  return (
    <ModalShell
      title={t('Hesap Depolama Secimi', 'Account Storage Choice')}
      subtitle={t(
        `${email} hesabi icin veri stratejisini sec.`,
        `Choose data strategy for ${email}.`,
      )}
    >
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          onClick={onKeepLocal}
          disabled={busy}
          className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-sm font-semibold text-slate-100">
            {t('Sadece Bu Cihazda Tut', 'Keep Only On This Device')}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t(
              'Veriler local kalir, cloud yazma/restore yapilmaz.',
              'Data stays local. No cloud write/restore.',
            )}
          </p>
        </button>
        <button
          onClick={onEnableCloud}
          disabled={busy}
          className="rounded-2xl border border-cyan-200/35 bg-cyan-300/15 p-4 text-left transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-sm font-semibold text-cyan-100">
            {t('Buluta Yedekle', 'Back Up To Cloud')}
          </p>
          <p className="mt-1 text-xs text-cyan-100/80">
            {t(
              'Bulut yedekleme icin acik riza ver ve hesabinla senkron kullan.',
              'Give explicit consent and sync with your account.',
            )}
          </p>
        </button>
      </div>
    </ModalShell>
  )
}

type RestoreBackupModalProps = {
  updatedAt: string | null
  busy?: boolean
  onRestore: () => void
  onStartEmpty: () => void
}

export const RestoreBackupModal = ({
  updatedAt,
  busy = false,
  onRestore,
  onStartEmpty,
}: RestoreBackupModalProps) => {
  const { t, locale } = useI18n()
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString(locale)
    : t('Bilinmiyor', 'Unknown')

  return (
    <ModalShell
      title={t('Yedek Bulundu', 'Backup Found')}
      subtitle={t(
        'Cloud kaydin bulundu. Bu cihaza geri yuklemek ister misin?',
        'A cloud backup was found. Restore it to this device?',
      )}
    >
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
        <p>{t('Son yedek tarihi', 'Last backup date')}: {updatedLabel}</p>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          onClick={onStartEmpty}
          disabled={busy}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t('Bekleyin...', 'Please wait...') : t('Bos Basla', 'Start Empty')}
        </button>
        <button
          onClick={onRestore}
          disabled={busy}
          className="accent-strong rounded-xl border px-4 py-2 text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t('Yukleniyor...', 'Loading...') : t('Geri Yukle', 'Restore')}
        </button>
      </div>
    </ModalShell>
  )
}
