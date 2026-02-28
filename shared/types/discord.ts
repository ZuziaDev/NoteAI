export type DiscordSection = 'todos' | 'timemap' | 'notes' | 'chat' | 'focus' | 'settings'

export type DiscordPresencePayload = {
  section: DiscordSection
}

export type DiscordStatus = {
  enabled: boolean
  connected: boolean
  clientIdConfigured: boolean
  message: string
  usingRemoteConfig?: boolean
  reconnectAttempt?: number
  warnings?: string[]
}

export type NoteAIDiscordApi = {
  getStatus: () => Promise<DiscordStatus>
  setPresence: (payload: DiscordPresencePayload) => Promise<void>
  clearPresence: () => Promise<void>
}
