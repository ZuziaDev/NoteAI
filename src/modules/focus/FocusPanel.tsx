import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../lib/i18n'

type FocusPanelProps = {
  query: string
}

type FocusMode = 'work' | 'break'
type FocusTab = 'timer' | 'stopwatch'

type FocusSettings = {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakEvery: number
  alarmEnabled: boolean
  alarmVolume: number
}

type FocusSessionLog = {
  id: string
  kind: 'timer' | 'stopwatch'
  mode: FocusMode | 'stopwatch'
  seconds: number
  completedAt: string
}

const SETTINGS_KEY = 'noteai.focus.settings'
const LOG_KEY = 'noteai.focus.logs'

const defaultSettings: FocusSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  alarmEnabled: true,
  alarmVolume: 70,
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const loadSettings = (): FocusSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return defaultSettings
  try {
    const parsed = JSON.parse(raw) as Partial<FocusSettings>
    return {
      workMinutes: clamp(parsed.workMinutes ?? defaultSettings.workMinutes, 10, 120),
      breakMinutes: clamp(parsed.breakMinutes ?? defaultSettings.breakMinutes, 3, 45),
      longBreakMinutes: clamp(
        parsed.longBreakMinutes ?? defaultSettings.longBreakMinutes,
        5,
        90,
      ),
      longBreakEvery: clamp(
        parsed.longBreakEvery ?? defaultSettings.longBreakEvery,
        2,
        8,
      ),
      alarmEnabled:
        typeof parsed.alarmEnabled === 'boolean'
          ? parsed.alarmEnabled
          : defaultSettings.alarmEnabled,
      alarmVolume: clamp(parsed.alarmVolume ?? defaultSettings.alarmVolume, 0, 100),
    }
  } catch {
    return defaultSettings
  }
}

const saveSettings = (settings: FocusSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

const loadLogs = (): FocusSessionLog[] => {
  const raw = localStorage.getItem(LOG_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<
      Partial<FocusSessionLog> & { minutes?: number }
    >
    if (!Array.isArray(parsed)) return []
    const normalized: FocusSessionLog[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const id = typeof item.id === 'string' ? item.id : crypto.randomUUID()
      const completedAt =
        typeof item.completedAt === 'string'
          ? item.completedAt
          : new Date().toISOString()
      if (
        item.kind === 'stopwatch' &&
        item.mode === 'stopwatch' &&
        typeof item.seconds === 'number'
      ) {
        normalized.push({
          id,
          kind: 'stopwatch',
          mode: 'stopwatch',
          seconds: Math.max(1, Math.round(item.seconds)),
          completedAt,
        })
        continue
      }
      if ((item.mode === 'work' || item.mode === 'break') && typeof item.seconds === 'number') {
        normalized.push({
          id,
          kind: 'timer',
          mode: item.mode,
          seconds: Math.max(1, Math.round(item.seconds)),
          completedAt,
        })
        continue
      }
      if (
        (item.mode === 'work' || item.mode === 'break') &&
        typeof item.minutes === 'number'
      ) {
        normalized.push({
          id,
          kind: 'timer',
          mode: item.mode,
          seconds: Math.max(60, Math.round(item.minutes * 60)),
          completedAt,
        })
      }
    }
    return normalized
  } catch {
    return []
  }
}

const saveLogs = (logs: FocusSessionLog[]) => {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 300)))
}

const toTodayKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const secondsToTimerClock = (seconds: number) => {
  const safe = Math.max(0, seconds)
  const mins = String(Math.floor(safe / 60)).padStart(2, '0')
  const secs = String(safe % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

const secondsToLongClock = (seconds: number) => {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
      secs,
    ).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatDurationLabel = (seconds: number) => {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

const getBreakSeconds = (settings: FocusSettings, completedWorkCycles: number) => {
  const longBreak = completedWorkCycles > 0 && completedWorkCycles % settings.longBreakEvery === 0
  return {
    seconds: (longBreak ? settings.longBreakMinutes : settings.breakMinutes) * 60,
    longBreak,
  }
}

export const FocusPanel = ({ query }: FocusPanelProps) => {
  const { t, locale } = useI18n()
  const [tab, setTab] = useState<FocusTab>('timer')
  const [settings, setSettings] = useState<FocusSettings>(() => loadSettings())
  const [logs, setLogs] = useState<FocusSessionLog[]>(() => loadLogs())
  const [mode, setMode] = useState<FocusMode>('work')
  const [timerRunning, setTimerRunning] = useState(false)
  const [workCycles, setWorkCycles] = useState(0)
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(
    () => loadSettings().workMinutes * 60,
  )
  const [secondsLeft, setSecondsLeft] = useState(() => loadSettings().workMinutes * 60)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const settingsRef = useRef(settings)
  const modeRef = useRef(mode)
  const workCyclesRef = useRef(workCycles)
  const timerInitialRef = useRef(timerInitialSeconds)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveLogs(logs)
  }, [logs])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    workCyclesRef.current = workCycles
  }, [workCycles])

  useEffect(() => {
    timerInitialRef.current = timerInitialSeconds
  }, [timerInitialSeconds])

  const pushLog = useCallback(
    (entry: Omit<FocusSessionLog, 'id' | 'completedAt'>) => {
      setLogs((existing) => [
        {
          id: crypto.randomUUID(),
          completedAt: new Date().toISOString(),
          ...entry,
        },
        ...existing,
      ])
    },
    [setLogs],
  )

  const playAlarm = useCallback(() => {
    const activeSettings = settingsRef.current
    if (!activeSettings.alarmEnabled) return
    try {
      const WindowAudio = window as Window & { webkitAudioContext?: typeof AudioContext }
      const AudioCtor = window.AudioContext ?? WindowAudio.webkitAudioContext
      if (!AudioCtor) return
      const context = new AudioCtor()
      const volume = clamp(activeSettings.alarmVolume, 0, 100) / 100
      const now = context.currentTime
      const sequence = [880, 988, 1174]

      sequence.forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = now + index * 0.22
        const stop = start + 0.18

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, start)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, stop)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(stop)
      })

      window.setTimeout(() => {
        void context.close().catch(() => {})
      }, 1200)
    } catch {
      // Ignore audio API failures and continue UX without sound.
    }
  }, [])

  const setTimerState = useCallback((seconds: number) => {
    const safe = Math.max(1, Math.round(seconds))
    setTimerInitialSeconds(safe)
    timerInitialRef.current = safe
    setSecondsLeft(safe)
  }, [])

  useEffect(() => {
    if (!timerRunning) return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  const completeTimerSession = useCallback(() => {
    const activeSettings = settingsRef.current
    const activeMode = modeRef.current
    const completedSeconds = timerInitialRef.current

    setTimerRunning(false)
    pushLog({
      kind: 'timer',
      mode: activeMode,
      seconds: completedSeconds,
    })
    playAlarm()

    if (activeMode === 'work') {
      const nextCycles = workCyclesRef.current + 1
      workCyclesRef.current = nextCycles
      setWorkCycles(nextCycles)
      const { seconds, longBreak } = getBreakSeconds(activeSettings, nextCycles)
      setMode('break')
      modeRef.current = 'break'
      setTimerState(seconds)
      setMessage(
        longBreak
          ? t(
              'Odak tamamlandi. Uzun mola hazir, baslatmak icin Baslat\'a bas.',
              'Focus session completed. Long break is ready. Press Start to begin.',
            )
          : t(
              'Odak tamamlandi. Kisa mola hazir, baslatmak icin Baslat\'a bas.',
              'Focus session completed. Short break is ready. Press Start to begin.',
            ),
      )
      return
    }

    setMode('work')
    modeRef.current = 'work'
    setTimerState(activeSettings.workMinutes * 60)
    setMessage(
      t(
        'Mola tamamlandi. Yeni odak seansi hazir, baslatmak icin Baslat\'a bas.',
        'Break completed. New focus session is ready. Press Start to begin.',
      ),
    )
  }, [playAlarm, pushLog, setTimerState, t])

  useEffect(() => {
    if (!timerRunning) return
    if (secondsLeft > 0) return
    completeTimerSession()
  }, [secondsLeft, timerRunning, completeTimerSession])

  useEffect(() => {
    if (!stopwatchRunning) return
    const timer = window.setInterval(() => {
      setStopwatchSeconds((current) => current + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [stopwatchRunning])

  const todaySummary = useMemo(() => {
    const todayKey = toTodayKey()
    const todayLogs = logs.filter((log) => log.completedAt.slice(0, 10) === todayKey)
    const completedWork = todayLogs.filter(
      (log) => log.kind === 'timer' && log.mode === 'work',
    )
    const totalSeconds = completedWork.reduce((sum, item) => sum + item.seconds, 0)
    return {
      count: completedWork.length,
      totalMinutes: Math.round(totalSeconds / 60),
    }
  }, [logs])

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const source = !needle
      ? logs
      : logs.filter((log) =>
          `${log.kind} ${log.mode} ${log.seconds} ${log.completedAt}`
            .toLowerCase()
            .includes(needle),
        )
    return source.slice(0, 20)
  }, [logs, query])

  const applySettings = useCallback(
    (patch: Partial<FocusSettings>) => {
      setSettings((current) => {
        const next = {
          ...current,
          ...patch,
        }
        const normalized: FocusSettings = {
          workMinutes: clamp(next.workMinutes, 10, 120),
          breakMinutes: clamp(next.breakMinutes, 3, 45),
          longBreakMinutes: clamp(next.longBreakMinutes, 5, 90),
          longBreakEvery: clamp(next.longBreakEvery, 2, 8),
          alarmEnabled: next.alarmEnabled,
          alarmVolume: clamp(next.alarmVolume, 0, 100),
        }
        if (!timerRunning) {
          if (modeRef.current === 'work') {
            setTimerState(normalized.workMinutes * 60)
          } else {
            const { seconds } = getBreakSeconds(normalized, workCyclesRef.current)
            setTimerState(seconds)
          }
        }
        return normalized
      })
    },
    [setTimerState, timerRunning],
  )

  const resetTimer = () => {
    setTimerRunning(false)
    setMode('work')
    modeRef.current = 'work'
    setTimerState(settings.workMinutes * 60)
    setMessage(
      t(
        'Odak zamanlayici sifirlandi.',
        'Focus timer has been reset.',
      ),
    )
  }

  const switchTimerMode = () => {
    setTimerRunning(false)
    setMode((current) => {
      const nextMode: FocusMode = current === 'work' ? 'break' : 'work'
      modeRef.current = nextMode
      if (nextMode === 'work') {
        setTimerState(settings.workMinutes * 60)
      } else {
        const { seconds } = getBreakSeconds(settings, workCyclesRef.current)
        setTimerState(seconds)
      }
      return nextMode
    })
  }

  const saveStopwatchSession = () => {
    if (stopwatchSeconds <= 0) return
    pushLog({
      kind: 'stopwatch',
      mode: 'stopwatch',
      seconds: stopwatchSeconds,
    })
    setMessage(t('Kronometre seansi kaydedildi.', 'Stopwatch session saved.'))
  }

  const resetStopwatch = () => {
    setStopwatchRunning(false)
    setStopwatchSeconds(0)
    setLaps([])
  }

  const timerProgress = useMemo(() => {
    if (timerInitialSeconds <= 0) return 0
    const elapsed = timerInitialSeconds - secondsLeft
    return clamp((elapsed / timerInitialSeconds) * 100, 0, 100)
  }, [secondsLeft, timerInitialSeconds])

  const targetLabel = mode === 'work' ? t('Odak', 'Focus') : t('Mola', 'Break')

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">Focus Mode</h2>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            {t('Bugun Odak Seansi', 'Today Focus Sessions')}: {todaySummary.count}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            {t('Bugun Odak Dakikasi', 'Today Focus Minutes')}: {todaySummary.totalMinutes}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('timer')}
          className={`rounded-xl border px-3 py-2 text-xs transition ${
            tab === 'timer'
              ? 'accent-soft'
              : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
          }`}
        >
          {t('Geri Sayim', 'Countdown')}
        </button>
        <button
          onClick={() => setTab('stopwatch')}
          className={`rounded-xl border px-3 py-2 text-xs transition ${
            tab === 'stopwatch'
              ? 'accent-soft'
              : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
          }`}
        >
          {t('Kronometre', 'Stopwatch')}
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          {tab === 'timer' ? (
            <>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Pomodoro</p>
              <p className="mt-2 text-sm text-slate-300">
                {t(`${targetLabel} zamani`, `${targetLabel} time`)}
              </p>

              <div className="mt-4 flex flex-col items-center gap-4">
                <div
                  className="relative h-52 w-52 rounded-full p-[10px]"
                  style={{
                    background: `conic-gradient(rgb(var(--accent-rgb)) ${
                      timerProgress * 3.6
                    }deg, rgba(255, 255, 255, 0.08) 0deg)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-black/40">
                    <p className="font-display text-5xl text-cyan-100">
                      {secondsToTimerClock(secondsLeft)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {t('Tamamlanma', 'Progress')}: {Math.round(timerProgress)}%
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setTimerRunning((current) => !current)}
                  className="accent-strong rounded-xl border px-4 py-2 text-sm transition hover:brightness-110"
                >
                  {timerRunning ? t('Duraklat', 'Pause') : t('Baslat', 'Start')}
                </button>
                <button
                  onClick={resetTimer}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20"
                >
                  {t('Sifirla', 'Reset')}
                </button>
                <button
                  onClick={switchTimerMode}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/15"
                >
                  {t('Mod Degistir', 'Switch Mode')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t('Kronometre', 'Stopwatch')}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {t('Serbest takip modu', 'Free tracking mode')}
              </p>
              <p className="mt-4 font-display text-5xl text-cyan-100">
                {secondsToLongClock(stopwatchSeconds)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setStopwatchRunning((current) => !current)}
                  className="accent-strong rounded-xl border px-4 py-2 text-sm transition hover:brightness-110"
                >
                  {stopwatchRunning ? t('Duraklat', 'Pause') : t('Baslat', 'Start')}
                </button>
                <button
                  onClick={() => {
                    if (stopwatchSeconds <= 0) return
                    setLaps((existing) => [stopwatchSeconds, ...existing].slice(0, 20))
                  }}
                  disabled={stopwatchSeconds <= 0}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('Tur', 'Lap')}
                </button>
                <button
                  onClick={saveStopwatchSession}
                  disabled={stopwatchSeconds <= 0}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('Seansi Kaydet', 'Save Session')}
                </button>
                <button
                  onClick={resetStopwatch}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/15"
                >
                  {t('Sifirla', 'Reset')}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  {t('Tur Gecmisi', 'Lap History')}
                </p>
                <div className="mt-2 max-h-40 space-y-1 overflow-auto">
                  {laps.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      {t('Henuz tur kaydi yok.', 'No lap records yet.')}
                    </p>
                  ) : (
                    laps.map((lap, index) => (
                      <div
                        key={`${lap}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200"
                      >
                        <span>
                          {t('Tur', 'Lap')} #{laps.length - index}
                        </span>
                        <span>{secondsToLongClock(lap)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          {message ? <p className="mt-3 text-xs text-cyan-100">{message}</p> : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
            {t('Ayarlar', 'Settings')}
          </p>
          <div className="mt-2 grid gap-2">
            <label className="text-xs text-slate-300">
              {t('Odak (dk)', 'Focus (min)')}
              <input
                type="number"
                value={settings.workMinutes}
                min={10}
                max={120}
                onChange={(event) => applySettings({ workMinutes: Number(event.target.value) })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="text-xs text-slate-300">
              {t('Kisa mola (dk)', 'Short break (min)')}
              <input
                type="number"
                value={settings.breakMinutes}
                min={3}
                max={45}
                onChange={(event) => applySettings({ breakMinutes: Number(event.target.value) })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="text-xs text-slate-300">
              {t('Uzun mola (dk)', 'Long break (min)')}
              <input
                type="number"
                value={settings.longBreakMinutes}
                min={5}
                max={90}
                onChange={(event) =>
                  applySettings({ longBreakMinutes: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="text-xs text-slate-300">
              {t('Uzun mola dongusu', 'Long break cycle')}
              <input
                type="number"
                value={settings.longBreakEvery}
                min={2}
                max={8}
                onChange={(event) =>
                  applySettings({ longBreakEvery: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <span>{t('Alarm sesi', 'Alarm sound')}</span>
              <input
                type="checkbox"
                checked={settings.alarmEnabled}
                onChange={(event) => applySettings({ alarmEnabled: event.target.checked })}
                className="h-4 w-4 rounded border-white/30 bg-black/30"
              />
            </label>
            <label className="text-xs text-slate-300">
              {t('Alarm seviyesi', 'Alarm volume')} ({settings.alarmVolume}%)
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.alarmVolume}
                onChange={(event) =>
                  applySettings({ alarmVolume: Number(event.target.value) })
                }
                className="mt-1 w-full"
              />
            </label>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
          {t('Seans Gecmisi', 'Session History')}
        </p>
        <div className="mt-2 space-y-2">
          {filteredLogs.length === 0 ? (
            <p className="text-xs text-slate-500">{t('Kayitli seans yok.', 'No session logs.')}</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <p>
                  {log.kind === 'stopwatch'
                    ? t('Kronometre', 'Stopwatch')
                    : log.mode === 'work'
                      ? t('Odak', 'Focus')
                      : t('Mola', 'Break')}{' '}
                  • {formatDurationLabel(log.seconds)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {new Date(log.completedAt).toLocaleString(locale)}
                </p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  )
}
