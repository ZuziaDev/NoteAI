import * as DiscordRPC from 'discord-rpc'
import { DISCORD_RPC_DEFAULTS } from '../../../../shared/constants/discord'
import { getRuntimeConfigValue } from '../../config/runtimeConfig'
import type {
  DiscordPresencePayload,
  DiscordSection,
  DiscordStatus,
} from '../../../../shared/types/discord'

export type DiscordRpcService = {
  start: () => Promise<void>
  stop: () => Promise<void>
  getStatus: () => DiscordStatus
  setPresence: (payload: DiscordPresencePayload) => Promise<void>
  clearPresence: () => Promise<void>
}

type RuntimeConfig = {
  clientId: string
  largeImageKey: string
  smallImageKey: string
  largeImageText: string
  smallImageText: string
}

type DiscordRpcRemoteConfig = {
  clientId?: string
  largeImageKey?: string
  smallImageKey?: string
  largeImageText?: string
  smallImageText?: string
}

const SECTION_LABELS: Record<DiscordSection, string> = {
  todos: 'To-Do',
  timemap: 'TimeMap',
  notes: 'Notes',
  chat: 'AI Chat',
  focus: 'Focus',
  settings: 'Settings',
}

const MAX_RECONNECT_DELAY_MS = 30_000
const INITIAL_RECONNECT_DELAY_MS = 2_000
const CONFIG_TIMEOUT_MS = 7_000
const PRESENCE_MIN_INTERVAL_MS = 2_500

const getEnv = (name: string) => getRuntimeConfigValue(name).trim()

const isValidClientId = (value: string) => /^\d{17,20}$/.test(value)
const isLikelyUrl = (value: string) => /^https?:\/\//i.test(value)
const isValidAssetKey = (value: string) => /^[a-zA-Z0-9_:-]{1,128}$/.test(value)

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown Discord RPC error'

const readBaseConfig = (): RuntimeConfig => ({
  clientId:
    getEnv('DISCORD_CLIENT_ID') ||
    getEnv('NOTEAI_DISCORD_CLIENT_ID') ||
    DISCORD_RPC_DEFAULTS.clientId,
  largeImageKey:
    getEnv('DISCORD_LARGE_IMAGE_KEY') ||
    getEnv('NOTEAI_DISCORD_LARGE_IMAGE_KEY') ||
    DISCORD_RPC_DEFAULTS.largeImageKey,
  smallImageKey:
    getEnv('DISCORD_SMALL_IMAGE_KEY') ||
    getEnv('NOTEAI_DISCORD_SMALL_IMAGE_KEY') ||
    DISCORD_RPC_DEFAULTS.smallImageKey,
  largeImageText: 'NoteAI',
  smallImageText: '',
})

const normalizeAssetKey = (raw: string, field: string, warnings: string[]) => {
  const value = raw.trim()
  if (!value) return ''
  if (isLikelyUrl(value)) {
    warnings.push(`${field} URL olamaz; Discord asset key bekler.`)
    return ''
  }
  if (!isValidAssetKey(value)) {
    warnings.push(`${field} gecersiz formatta.`)
    return ''
  }
  return value
}

const parseRemoteConfig = (payload: unknown): DiscordRpcRemoteConfig | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const direct = payload as DiscordRpcRemoteConfig
  if (
    'clientId' in direct ||
    'largeImageKey' in direct ||
    'smallImageKey' in direct
  ) {
    return direct
  }

  const nestedDiscordRpc = (payload as { discordRpc?: unknown }).discordRpc
  if (nestedDiscordRpc && typeof nestedDiscordRpc === 'object') {
    return nestedDiscordRpc as DiscordRpcRemoteConfig
  }

  const nestedDiscord = (payload as { discord?: unknown }).discord
  if (nestedDiscord && typeof nestedDiscord === 'object') {
    return nestedDiscord as DiscordRpcRemoteConfig
  }

  return null
}

export const createDiscordRpcService = (): DiscordRpcService => {
  const configUrl =
    getEnv('DISCORD_RPC_CONFIG_URL') || getEnv('NOTEAI_DISCORD_RPC_CONFIG_URL')
  const rpcDisabled =
    getEnv('DISCORD_RPC_DISABLED') === '1' ||
    getEnv('NOTEAI_DISCORD_RPC_DISABLED') === '1'
  const startedAt = new Date()

  let runtimeConfig = readBaseConfig()
  let client: DiscordRPC.Client | null = null
  let startInFlight: Promise<void> | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  let presenceTimer: NodeJS.Timeout | null = null
  let reconnectAttempt = 0
  let isStopping = false

  let pendingPresence: DiscordPresencePayload | null = null
  let lastAppliedSection: DiscordSection | null = null
  let lastPresenceUpdatedAt = 0
  let warnings: string[] = []

  let status: DiscordStatus = {
    enabled: !rpcDisabled,
    connected: false,
    clientIdConfigured: isValidClientId(runtimeConfig.clientId),
    message: rpcDisabled ? 'Discord RPC devre disi.' : 'Discord RPC hazirlaniyor...',
    reconnectAttempt: 0,
    usingRemoteConfig: false,
    warnings: [],
  }

  const updateStatus = (patch: Partial<DiscordStatus>) => {
    status = {
      ...status,
      ...patch,
      reconnectAttempt,
      warnings: [...warnings],
    }
  }

  const clearReconnectTimer = () => {
    if (!reconnectTimer) return
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  const clearPresenceTimer = () => {
    if (!presenceTimer) return
    clearTimeout(presenceTimer)
    presenceTimer = null
  }

  const destroyClient = async () => {
    if (!client) return
    const current = client
    client = null
    try {
      await current.destroy()
    } catch {
      // ignore
    }
  }

  const scheduleReconnect = (reason: string) => {
    if (!status.enabled || isStopping) {
      return
    }
    if (reconnectTimer) {
      return
    }

    const power = Math.min(reconnectAttempt, 4)
    const delay = Math.min(
      MAX_RECONNECT_DELAY_MS,
      INITIAL_RECONNECT_DELAY_MS * 2 ** power,
    )
    updateStatus({
      connected: false,
      message: `${reason} Yeniden denenecek (${Math.round(delay / 1000)}s).`,
    })

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      reconnectAttempt += 1
      void start()
    }, delay)
  }

  const refreshRuntimeConfig = async () => {
    warnings = []
    runtimeConfig = readBaseConfig()
    let usingRemoteConfig = false

    if (configUrl) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS)
      try {
        const response = await fetch(configUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) {
          warnings.push(`Config API HTTP ${response.status}`)
        } else {
          let payload: unknown = null
          const contentType = response.headers.get('content-type') ?? ''

          if (contentType.includes('application/json')) {
            payload = await response.json().catch(() => null)
          } else {
            const text = await response.text().catch(() => '')
            try {
              payload = JSON.parse(text)
            } catch {
              warnings.push('Config API JSON donmeli.')
            }
          }

          const parsed = parseRemoteConfig(payload)
          if (parsed) {
            usingRemoteConfig = true
            if (typeof parsed.clientId === 'string' && parsed.clientId.trim()) {
              runtimeConfig.clientId = parsed.clientId.trim()
            }
            if (typeof parsed.largeImageKey === 'string') {
              runtimeConfig.largeImageKey = parsed.largeImageKey.trim()
            }
            if (typeof parsed.smallImageKey === 'string') {
              runtimeConfig.smallImageKey = parsed.smallImageKey.trim()
            }
            if (typeof parsed.largeImageText === 'string' && parsed.largeImageText.trim()) {
              runtimeConfig.largeImageText = parsed.largeImageText.trim()
            }
            if (typeof parsed.smallImageText === 'string') {
              runtimeConfig.smallImageText = parsed.smallImageText.trim()
            }
          } else if (payload !== null) {
            warnings.push('Config API icerigi desteklenmiyor.')
          }
        }
      } catch (error) {
        warnings.push(`Config API okunamadi: ${toErrorMessage(error)}`)
      } finally {
        clearTimeout(timeout)
      }
    }

    runtimeConfig.largeImageKey = normalizeAssetKey(
      runtimeConfig.largeImageKey,
      'DISCORD_LARGE_IMAGE_KEY',
      warnings,
    )
    runtimeConfig.smallImageKey = normalizeAssetKey(
      runtimeConfig.smallImageKey,
      'DISCORD_SMALL_IMAGE_KEY',
      warnings,
    )
  const clientIdValid = isValidClientId(runtimeConfig.clientId)
    updateStatus({
      clientIdConfigured: clientIdValid,
      usingRemoteConfig,
    })
  }

  const applyPresenceNow = async () => {
    if (!client || !status.connected || !pendingPresence) {
      return
    }

    if (pendingPresence.section === lastAppliedSection) {
      return
    }

    const activity: DiscordRPC.Presence = {
      details: 'Using NoteAI',
      state: `Browsing ${SECTION_LABELS[pendingPresence.section]}`,
      startTimestamp: startedAt,
      instance: false,
    }

    if (runtimeConfig.largeImageKey) {
      activity.largeImageKey = runtimeConfig.largeImageKey
      activity.largeImageText = runtimeConfig.largeImageText || 'NoteAI'
    }
    if (runtimeConfig.smallImageKey) {
      activity.smallImageKey = runtimeConfig.smallImageKey
      activity.smallImageText =
        runtimeConfig.smallImageText || SECTION_LABELS[pendingPresence.section]
    }

    await client.setActivity(activity)
    lastAppliedSection = pendingPresence.section
    lastPresenceUpdatedAt = Date.now()
    updateStatus({
      connected: true,
      message: 'Discord presence guncellendi.',
    })
  }

  const applyPresence = async () => {
    clearPresenceTimer()
    if (!client || !status.connected || !pendingPresence) {
      return
    }

    const elapsed = Date.now() - lastPresenceUpdatedAt
    if (elapsed < PRESENCE_MIN_INTERVAL_MS && lastAppliedSection !== null) {
      const wait = PRESENCE_MIN_INTERVAL_MS - elapsed
      presenceTimer = setTimeout(() => {
        presenceTimer = null
        void applyPresenceNow().catch((error) => {
          updateStatus({
            connected: false,
            message: `Presence tekrar denenirken hata: ${toErrorMessage(error)}`,
          })
          scheduleReconnect('Presence guncellemesi hatasi.')
        })
      }, wait)
      return
    }

    await applyPresenceNow()
  }

  const start = async () => {
    if (!status.enabled || isStopping) return
    if (startInFlight) return startInFlight
    if (client && status.connected) return

    startInFlight = (async () => {
      clearReconnectTimer()
      await refreshRuntimeConfig()

      if (!isValidClientId(runtimeConfig.clientId)) {
        updateStatus({
          connected: false,
          clientIdConfigured: false,
          message: 'Discord Client ID gecersiz veya eksik.',
        })
        return
      }

      if (client) {
        await destroyClient()
      }

      DiscordRPC.register(runtimeConfig.clientId)
      const rpcClient = new DiscordRPC.Client({ transport: 'ipc' })
      client = rpcClient

      rpcClient.on('ready', () => {
        reconnectAttempt = 0
        updateStatus({
          connected: true,
          message: 'Discord RPC baglandi.',
        })
        if (pendingPresence) {
          void applyPresence()
        }
      })

      rpcClient.on('disconnected', () => {
        updateStatus({
          connected: false,
          message: 'Discord baglantisi kesildi.',
        })
        lastAppliedSection = null
        scheduleReconnect('Discord baglantisi kesildi.')
      })

      rpcClient.on('error', (error: unknown) => {
        updateStatus({
          connected: false,
          message: `Discord RPC hata: ${toErrorMessage(error)}`,
        })
        lastAppliedSection = null
        scheduleReconnect('Discord RPC hata verdi.')
      })

      try {
        updateStatus({
          connected: false,
          message: 'Discord RPC baglaniyor...',
        })
        await rpcClient.login({ clientId: runtimeConfig.clientId })
      } catch (error) {
        updateStatus({
          connected: false,
          message: `Discord RPC baglanamadi: ${toErrorMessage(error)}`,
        })
        lastAppliedSection = null
        await destroyClient()
        scheduleReconnect('Discord acik degil veya baglanti reddedildi.')
      }
    })()

    try {
      await startInFlight
    } finally {
      startInFlight = null
    }
  }

  const clearPresence = async () => {
    pendingPresence = null
    lastAppliedSection = null
    clearPresenceTimer()

    if (!client || !status.connected) {
      return
    }

    try {
      await client.clearActivity()
      updateStatus({
        connected: true,
        message: 'Discord presence temizlendi.',
      })
    } catch (error) {
      updateStatus({
        connected: false,
        message: `Discord presence temizlenemedi: ${toErrorMessage(error)}`,
      })
      scheduleReconnect('Presence temizleme hatasi.')
    }
  }

  const stop = async () => {
    isStopping = true
    clearReconnectTimer()
    clearPresenceTimer()
    pendingPresence = null
    lastAppliedSection = null

    if (client) {
      try {
        await client.clearActivity()
      } catch {
        // ignore
      }
    }

    await destroyClient()
    reconnectAttempt = 0
    updateStatus({
      connected: false,
      message: 'Discord RPC durduruldu.',
    })
  }

  const setPresence = async (payload: DiscordPresencePayload) => {
    pendingPresence = payload
    if (!status.enabled) {
      return
    }

    if (!status.connected || !client) {
      await start()
      return
    }

    try {
      await applyPresence()
    } catch (error) {
      updateStatus({
        connected: false,
        message: `Discord presence guncellenemedi: ${toErrorMessage(error)}`,
      })
      scheduleReconnect('Presence guncelleme hatasi.')
    }
  }

  const getStatus = () => ({
    ...status,
    warnings: [...warnings],
    reconnectAttempt,
  })

  return {
    start,
    stop,
    getStatus,
    setPresence,
    clearPresence,
  }
}
