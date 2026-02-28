import type {
  DiscordPresencePayload,
  DiscordStatus,
} from '../../shared/types/discord'

const isAvailable = () => Boolean(window.noteai?.discord)

const disabledStatus: DiscordStatus = {
  enabled: false,
  connected: false,
  clientIdConfigured: false,
  message: 'Discord RPC devre disi.',
}

export const discordApi = {
  isAvailable,
  getStatus: async (): Promise<DiscordStatus> => {
    if (!isAvailable()) return disabledStatus
    return window.noteai!.discord.getStatus()
  },
  setPresence: async (payload: DiscordPresencePayload): Promise<void> => {
    if (!isAvailable()) return
    await window.noteai!.discord.setPresence(payload)
  },
  clearPresence: async (): Promise<void> => {
    if (!isAvailable()) return
    await window.noteai!.discord.clearPresence()
  },
}
