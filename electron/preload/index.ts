import { contextBridge, ipcRenderer } from 'electron'
import {
  AI_CHANNELS,
  AUTH_CHANNELS,
  DISCORD_CHANNELS,
  STORAGE_CHANNELS,
} from '../../shared/constants/ipc'
import type { AISettings, NoteAIApi } from '../../shared/types/ai'
import type {
  DiscordPresencePayload,
  NoteAIDiscordApi,
} from '../../shared/types/discord'
import type { NoteAuthApi } from '../../shared/types/auth'
import type {
  AccountCloudMode,
  CreateTimeMapNoteInput,
  CreateNoteInput,
  LocalSettings,
  NoteAIStorageApi,
  OpenExternalFilesResult,
  RestoreDecision,
  UpdateTimeMapNoteInput,
  TodoItem,
} from '../../shared/types/storage'

contextBridge.exposeInMainWorld('noteai', {
  ping: () => 'pong',
  storage: {
    getTodos: () => ipcRenderer.invoke(STORAGE_CHANNELS.GET_TODOS),
    saveTodos: (todos: TodoItem[]) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.SAVE_TODOS, todos),
    getLocalSettings: () =>
      ipcRenderer.invoke(STORAGE_CHANNELS.GET_LOCAL_SETTINGS),
    saveLocalSettings: (settings: LocalSettings) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.SAVE_LOCAL_SETTINGS, settings),
    getConsents: () => ipcRenderer.invoke(STORAGE_CHANNELS.GET_CONSENTS),
    acceptMandatoryConsents: () =>
      ipcRenderer.invoke(STORAGE_CHANNELS.ACCEPT_MANDATORY_CONSENTS),
    grantCloudBackupConsent: () =>
      ipcRenderer.invoke(STORAGE_CHANNELS.GRANT_CLOUD_BACKUP_CONSENT),
    getAccountCloudPreference: (uid: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.GET_ACCOUNT_CLOUD_PREFERENCE, uid),
    setAccountCloudPreference: (
      uid: string,
      mode: Exclude<AccountCloudMode, 'unset'>,
    ) => ipcRenderer.invoke(STORAGE_CHANNELS.SET_ACCOUNT_CLOUD_PREFERENCE, uid, mode),
    hasRestoreDecision: (uid: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.HAS_RESTORE_DECISION, uid),
    markRestoreDecision: (uid: string, choice: RestoreDecision) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.MARK_RESTORE_DECISION, uid, choice),
    getCloudBackupStatus: () =>
      ipcRenderer.invoke(STORAGE_CHANNELS.GET_CLOUD_BACKUP_STATUS),
    resetLocalData: () => ipcRenderer.invoke(STORAGE_CHANNELS.RESET_LOCAL_DATA),
    getNotes: () => ipcRenderer.invoke(STORAGE_CHANNELS.GET_NOTES),
    createNote: (input: CreateNoteInput) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.CREATE_NOTE, input),
    loadNote: (noteId: string) => ipcRenderer.invoke(STORAGE_CHANNELS.LOAD_NOTE, noteId),
    saveNote: (noteId: string, text: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.SAVE_NOTE, noteId, text),
    renameNote: (
      noteId: string,
      nextFileName: string,
      nextTitle?: string,
    ) => ipcRenderer.invoke(STORAGE_CHANNELS.RENAME_NOTE, noteId, nextFileName, nextTitle),
    deleteNote: (noteId: string) => ipcRenderer.invoke(STORAGE_CHANNELS.DELETE_NOTE, noteId),
    openExternalFiles: () =>
      ipcRenderer.invoke(STORAGE_CHANNELS.OPEN_EXTERNAL_FILES) as Promise<OpenExternalFilesResult>,
    getTimeMapNotes: () => ipcRenderer.invoke(STORAGE_CHANNELS.GET_TIMEMAP_NOTES),
    createTimeMapNote: (input: CreateTimeMapNoteInput) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.CREATE_TIMEMAP_NOTE, input),
    updateTimeMapNote: (input: UpdateTimeMapNoteInput) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.UPDATE_TIMEMAP_NOTE, input),
    deleteTimeMapNote: (id: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.DELETE_TIMEMAP_NOTE, id),
    getNoteVersions: (noteId: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.GET_NOTE_VERSIONS, noteId),
    restoreNoteVersion: (noteId: string, versionId: string) =>
      ipcRenderer.invoke(STORAGE_CHANNELS.RESTORE_NOTE_VERSION, noteId, versionId),
    syncFromCloud: () => ipcRenderer.invoke(STORAGE_CHANNELS.SYNC_FROM_CLOUD),
    exportJson: () => ipcRenderer.invoke(STORAGE_CHANNELS.EXPORT_JSON),
    importJson: () => ipcRenderer.invoke(STORAGE_CHANNELS.IMPORT_JSON),
  } satisfies NoteAIStorageApi,
  ai: {
    getSettings: () => ipcRenderer.invoke(AI_CHANNELS.GET_SETTINGS),
    saveSettings: (settings: AISettings) =>
      ipcRenderer.invoke(AI_CHANNELS.SAVE_SETTINGS, settings),
    testConnection: (settings: AISettings) =>
      ipcRenderer.invoke(AI_CHANNELS.TEST_CONNECTION, settings),
    suggestNoteFileName: (input: string) =>
      ipcRenderer.invoke(AI_CHANNELS.SUGGEST_NOTE_FILENAME, input),
    getChatHistory: () => ipcRenderer.invoke(AI_CHANNELS.GET_CHAT_HISTORY),
    clearChatHistory: () => ipcRenderer.invoke(AI_CHANNELS.CLEAR_CHAT_HISTORY),
    sendChatMessage: (input: string) =>
      ipcRenderer.invoke(AI_CHANNELS.SEND_CHAT_MESSAGE, input),
  } satisfies NoteAIApi,
  auth: {
    getState: () => ipcRenderer.invoke(AUTH_CHANNELS.GET_STATE),
    signInWithPassword: (email: string, password: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.SIGN_IN_PASSWORD, email, password),
    signUpWithPassword: (email: string, password: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.SIGN_UP_PASSWORD, email, password),
    signOut: () => ipcRenderer.invoke(AUTH_CHANNELS.SIGN_OUT),
  } satisfies NoteAuthApi,
  discord: {
    getStatus: () => ipcRenderer.invoke(DISCORD_CHANNELS.GET_STATUS),
    setPresence: (payload: DiscordPresencePayload) =>
      ipcRenderer.invoke(DISCORD_CHANNELS.SET_PRESENCE, payload),
    clearPresence: () => ipcRenderer.invoke(DISCORD_CHANNELS.CLEAR_PRESENCE),
  } satisfies NoteAIDiscordApi,
})
