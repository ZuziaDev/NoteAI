import { ipcMain } from 'electron'
import { DISCORD_CHANNELS } from '../../../shared/constants/ipc'
import type { DiscordPresencePayload } from '../../../shared/types/discord'
import type { DiscordRpcService } from '../services/discord/discordRpcService'

const handle = <TArgs extends unknown[], TResult>(
  channel: string,
  listener: (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => TResult,
) => {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, listener)
}

export const registerDiscordIpcHandlers = (discordRpc: DiscordRpcService) => {
  handle(DISCORD_CHANNELS.GET_STATUS, async () => discordRpc.getStatus())

  handle(
    DISCORD_CHANNELS.SET_PRESENCE,
    async (_event, payload: DiscordPresencePayload) => {
      await discordRpc.setPresence(payload)
    },
  )

  handle(DISCORD_CHANNELS.CLEAR_PRESENCE, async () => {
    await discordRpc.clearPresence()
  })
}
