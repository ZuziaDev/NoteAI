import { app, BrowserWindow, Menu } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerAIIpcHandlers } from './ipc/aiIpc'
import { registerAuthIpcHandlers } from './ipc/authIpc'
import { registerDiscordIpcHandlers } from './ipc/discordIpc'
import { registerStorageIpcHandlers } from './ipc/storageIpc'
import { createDiscordRpcService } from './services/discord/discordRpcService'
import { createTodoReminderService } from './services/notifications/todoReminderService'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_USER_MODEL_ID = 'com.noteai.app'
const discordRpc = createDiscordRpcService()
const todoReminder = createTodoReminderService()

const resolveAppIconPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.ico')
  }
  return path.join(process.cwd(), 'build', 'icon.ico')
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'NoteAI',
    icon: resolveAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    return
  }

  mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
}

app.whenReady().then(() => {
  app.setName('NoteAI')
  app.setAppUserModelId(APP_USER_MODEL_ID)
  Menu.setApplicationMenu(null)
  registerStorageIpcHandlers()
  registerAIIpcHandlers()
  registerAuthIpcHandlers()
  registerDiscordIpcHandlers(discordRpc)
  void discordRpc.start()
  todoReminder.start()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  void discordRpc.stop()
  todoReminder.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
