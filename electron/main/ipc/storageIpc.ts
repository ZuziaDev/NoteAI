import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { STORAGE_CHANNELS } from '../../../shared/constants/ipc'
import {
  acceptMandatoryConsents,
  getAccountCloudPreference,
  getCloudBackupStatus,
  getConsents,
  grantCloudBackupConsent,
  hasRestoreDecision,
  markRestoreDecision,
  resetLocalData,
  setAccountCloudPreference,
  createTimeMapNote,
  getNoteVersions,
  applyBackupPayload,
  createNote,
  createBackupPayload,
  deleteTimeMapNote,
  deleteNote,
  getLocalSettings,
  getNotes,
  getTimeMapNotes,
  getTodos,
  isLocalBackupPayload,
  loadNote,
  registerExternalFiles,
  renameNote,
  saveLocalSettings,
  saveNote,
  saveTodos,
  restoreNoteVersion,
  syncFromCloudToLocal,
  updateTimeMapNote,
} from '../services/storage/localStorage'
import type {
  AccountCloudMode,
  AccountCloudPreference,
  AppConsents,
  CloudBackupStatus,
  CreateTimeMapNoteInput,
  CreateNoteInput,
  ExportJsonResult,
  ImportJsonResult,
  LocalSettings,
  NoteVersion,
  NoteDocument,
  OpenExternalFilesResult,
  SaveNoteResult,
  TimeMapNote,
  TodoItem,
  RestoreDecision,
  UpdateTimeMapNoteInput,
} from '../../../shared/types/storage'

const handle = <TArgs extends unknown[], TResult>(
  channel: string,
  listener: (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => TResult,
) => {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, listener)
}

const getActiveWindow = () => BrowserWindow.getFocusedWindow() ?? undefined

const showSaveDialog = (options: Electron.SaveDialogOptions) => {
  const activeWindow = getActiveWindow()
  if (activeWindow) {
    return dialog.showSaveDialog(activeWindow, options)
  }
  return dialog.showSaveDialog(options)
}

const showOpenDialog = (options: Electron.OpenDialogOptions) => {
  const activeWindow = getActiveWindow()
  if (activeWindow) {
    return dialog.showOpenDialog(activeWindow, options)
  }
  return dialog.showOpenDialog(options)
}

export const registerStorageIpcHandlers = () => {
  handle(STORAGE_CHANNELS.GET_TODOS, async () => getTodos())

  handle(STORAGE_CHANNELS.SAVE_TODOS, async (_event, todos: TodoItem[]) => {
    saveTodos(todos)
  })

  handle(STORAGE_CHANNELS.GET_LOCAL_SETTINGS, async () => getLocalSettings())

  handle(
    STORAGE_CHANNELS.SAVE_LOCAL_SETTINGS,
    async (_event, settings: LocalSettings) => saveLocalSettings(settings),
  )

  handle(STORAGE_CHANNELS.GET_CONSENTS, async (): Promise<AppConsents> => getConsents())

  handle(
    STORAGE_CHANNELS.ACCEPT_MANDATORY_CONSENTS,
    async (): Promise<AppConsents> => acceptMandatoryConsents(),
  )

  handle(
    STORAGE_CHANNELS.GRANT_CLOUD_BACKUP_CONSENT,
    async (): Promise<AppConsents> => grantCloudBackupConsent(),
  )

  handle(
    STORAGE_CHANNELS.GET_ACCOUNT_CLOUD_PREFERENCE,
    async (_event, uid: string): Promise<AccountCloudPreference> => getAccountCloudPreference(uid),
  )

  handle(
    STORAGE_CHANNELS.SET_ACCOUNT_CLOUD_PREFERENCE,
    async (
      _event,
      uid: string,
      mode: Exclude<AccountCloudMode, 'unset'>,
    ): Promise<AccountCloudPreference> => setAccountCloudPreference(uid, mode),
  )

  handle(
    STORAGE_CHANNELS.HAS_RESTORE_DECISION,
    async (_event, uid: string): Promise<boolean> => hasRestoreDecision(uid),
  )

  handle(
    STORAGE_CHANNELS.MARK_RESTORE_DECISION,
    async (_event, uid: string, choice: RestoreDecision): Promise<void> => {
      markRestoreDecision(uid, choice)
    },
  )

  handle(
    STORAGE_CHANNELS.GET_CLOUD_BACKUP_STATUS,
    async (): Promise<CloudBackupStatus> => getCloudBackupStatus(),
  )

  handle(STORAGE_CHANNELS.RESET_LOCAL_DATA, async (): Promise<void> => {
    await resetLocalData()
  })

  handle(STORAGE_CHANNELS.GET_NOTES, async () => getNotes())

  handle(
    STORAGE_CHANNELS.CREATE_NOTE,
    async (_event, input: CreateNoteInput): Promise<NoteDocument> => {
      return createNote(input)
    },
  )

  handle(STORAGE_CHANNELS.LOAD_NOTE, async (_event, noteId: string) => {
    return loadNote(noteId)
  })

  handle(
    STORAGE_CHANNELS.SAVE_NOTE,
    async (_event, noteId: string, text: string): Promise<SaveNoteResult> => {
      return saveNote(noteId, text)
    },
  )

  handle(
    STORAGE_CHANNELS.RENAME_NOTE,
    async (
      _event,
      noteId: string,
      nextFileName: string,
      nextTitle?: string,
    ): Promise<NoteDocument> => {
      return renameNote(noteId, nextFileName, nextTitle)
    },
  )

  handle(STORAGE_CHANNELS.DELETE_NOTE, async (_event, noteId: string) => {
    await deleteNote(noteId)
  })

  handle(STORAGE_CHANNELS.OPEN_EXTERNAL_FILES, async (): Promise<OpenExternalFilesResult> => {
    const result = await showOpenDialog({
      title: 'Open Files in Notes',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Text and Code',
          extensions: [
            'txt',
            'md',
            'markdown',
            'js',
            'ts',
            'tsx',
            'jsx',
            'json',
            'css',
            'html',
            'yml',
            'yaml',
            'log',
            'csv',
          ],
        },
        {
          name: 'All Files',
          extensions: ['*'],
        },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        cancelled: true,
        notes: [],
      }
    }

    const notes = await registerExternalFiles(result.filePaths)
    return {
      cancelled: false,
      notes,
    }
  })

  handle(STORAGE_CHANNELS.GET_TIMEMAP_NOTES, async () => getTimeMapNotes())

  handle(
    STORAGE_CHANNELS.CREATE_TIMEMAP_NOTE,
    async (_event, input: CreateTimeMapNoteInput): Promise<TimeMapNote> =>
      createTimeMapNote(input),
  )

  handle(
    STORAGE_CHANNELS.UPDATE_TIMEMAP_NOTE,
    async (_event, input: UpdateTimeMapNoteInput): Promise<TimeMapNote> =>
      updateTimeMapNote(input),
  )

  handle(STORAGE_CHANNELS.DELETE_TIMEMAP_NOTE, async (_event, id: string) => {
    deleteTimeMapNote(id)
  })

  handle(STORAGE_CHANNELS.GET_NOTE_VERSIONS, async (_event, noteId: string): Promise<NoteVersion[]> => {
    return getNoteVersions(noteId)
  })

  handle(
    STORAGE_CHANNELS.RESTORE_NOTE_VERSION,
    async (_event, noteId: string, versionId: string): Promise<NoteDocument> => {
      return restoreNoteVersion(noteId, versionId)
    },
  )

  handle(STORAGE_CHANNELS.SYNC_FROM_CLOUD, async () => syncFromCloudToLocal())

  handle(STORAGE_CHANNELS.EXPORT_JSON, async (): Promise<ExportJsonResult> => {
    try {
      const result = await showSaveDialog({
        title: 'Export NoteAI Data',
        defaultPath: path.join(app.getPath('documents'), 'noteai-backup.json'),
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

      if (result.canceled || !result.filePath) {
        return { ok: false, cancelled: true }
      }

      const payload = await createBackupPayload()
      await fs.writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')

      return {
        ok: true,
        cancelled: false,
        path: result.filePath,
      }
    } catch (error) {
      return {
        ok: false,
        cancelled: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
      }
    }
  })

  handle(STORAGE_CHANNELS.IMPORT_JSON, async (): Promise<ImportJsonResult> => {
    try {
      const result = await showOpenDialog({
        title: 'Import NoteAI Data',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, cancelled: true }
      }

      const filePath = result.filePaths[0]
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed: unknown = JSON.parse(content)

      if (!isLocalBackupPayload(parsed)) {
        return {
          ok: false,
          cancelled: false,
          error: 'Invalid backup format',
        }
      }

      await applyBackupPayload(parsed)

      return {
        ok: true,
        cancelled: false,
        path: filePath,
      }
    } catch (error) {
      return {
        ok: false,
        cancelled: false,
        error: error instanceof Error ? error.message : 'Unknown import error',
      }
    }
  })
}
