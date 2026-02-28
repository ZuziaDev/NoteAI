import { ipcMain } from 'electron'
import { AUTH_CHANNELS } from '../../../shared/constants/ipc'
import {
  getAuthState,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from '../services/auth/authService'

const handle = <TArgs extends unknown[], TResult>(
  channel: string,
  listener: (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => TResult,
) => {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, listener)
}

export const registerAuthIpcHandlers = () => {
  handle(AUTH_CHANNELS.GET_STATE, async () => getAuthState())

  handle(AUTH_CHANNELS.SIGN_IN_PASSWORD, async (_event, email: string, password: string) =>
    signInWithPassword(email, password),
  )

  handle(AUTH_CHANNELS.SIGN_UP_PASSWORD, async (_event, email: string, password: string) =>
    signUpWithPassword(email, password),
  )

  handle(AUTH_CHANNELS.SIGN_OUT, async () => signOut())
}
