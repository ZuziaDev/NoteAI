import type { AISettings, ChatMessage } from './ai'

export type TodoPriority = 'Low' | 'Medium' | 'High'
export type TodoRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'
export type ThemePreset =
  | 'aurora'
  | 'sunset'
  | 'forest'
  | 'midnight'
  | 'sand'
  | 'neon'
  | 'ocean'
  | 'copper'
  | 'mono'
export type UiStylePreset = 'glass' | 'solid' | 'outline' | 'neon' | 'minimal'
export type SyncConflictStrategy = 'latest' | 'merge'
export type AppLanguage = 'tr' | 'en'

export type TodoItem = {
  id: string
  title: string
  priority: TodoPriority
  done: boolean
  dueAt: string | null
  recurrence: TodoRecurrence
  tags: string[]
  project: string
  linkedNoteId: string | null
  createdAt: string
  updatedAt: string
}

export type LocalSettings = {
  cloudBackupEnabled: boolean
  syncConflictStrategy: SyncConflictStrategy
  themePreset: ThemePreset
  uiStylePreset: UiStylePreset
  language: AppLanguage
  dailyBriefingEnabled: boolean
  lastDailyBriefingDate: string | null
}

export type AppConsents = {
  tosAcceptedAt: string | null
  privacyAcceptedAt: string | null
  cloudBackupConsentAt: string | null
}

export type AccountCloudMode = 'unset' | 'local' | 'cloud'

export type AccountCloudPreference = {
  uid: string
  mode: AccountCloudMode
  decidedAt: string | null
}

export type RestoreDecision = 'restore' | 'empty'

export type CloudBackupStatus = {
  ok: boolean
  hasBackup: boolean
  hasLocalData: boolean
  updatedAt: string | null
  error?: string
}

export type NoteKind = 'local' | 'external'
export type NoteFormat = 'markdown' | 'plain'

export type NoteFileRecord = {
  id: string
  title: string
  fileName: string
  path: string
  kind: NoteKind
  format: NoteFormat
  tags: string[]
  project: string
  createdAt: string
  updatedAt: string
}

export type NoteDocument = NoteFileRecord & {
  content: string
}

export type TimeMapNote = {
  id: string
  date: string
  title: string
  content: string
  tags: string[]
  project: string
  createdAt: string
  updatedAt: string
}

export type CreateNoteInput = {
  fileName: string
  content?: string
  title?: string
}

export type CreateTimeMapNoteInput = {
  date: string
  title: string
  content?: string
  tags?: string[]
  project?: string
}

export type UpdateTimeMapNoteInput = {
  id: string
  date: string
  title: string
  content: string
  tags?: string[]
  project?: string
}

export type SaveNoteResult = {
  path: string
  updatedAt: string
}

export type NoteVersion = {
  id: string
  noteId: string
  content: string
  createdAt: string
}

export type OpenExternalFilesResult = {
  cancelled: boolean
  notes: NoteFileRecord[]
}

export type ExportJsonResult = {
  ok: boolean
  cancelled: boolean
  path?: string
  error?: string
}

export type ImportJsonResult = {
  ok: boolean
  cancelled: boolean
  path?: string
  error?: string
}

export type LocalBackupPayload = {
  version: 1
  exportedAt: string
  todos: TodoItem[]
  settings: LocalSettings
  consents?: AppConsents
  noteText?: string
  notes?: NoteDocument[]
  timeMapNotes?: TimeMapNote[]
  noteVersions?: NoteVersion[]
  aiSettings?: AISettings
  chats?: ChatMessage[]
}

export type NoteAIStorageApi = {
  getTodos: () => Promise<TodoItem[]>
  saveTodos: (todos: TodoItem[]) => Promise<void>
  getLocalSettings: () => Promise<LocalSettings>
  saveLocalSettings: (settings: LocalSettings) => Promise<LocalSettings>
  getConsents: () => Promise<AppConsents>
  acceptMandatoryConsents: () => Promise<AppConsents>
  grantCloudBackupConsent: () => Promise<AppConsents>
  getAccountCloudPreference: (uid: string) => Promise<AccountCloudPreference>
  setAccountCloudPreference: (
    uid: string,
    mode: Exclude<AccountCloudMode, 'unset'>,
  ) => Promise<AccountCloudPreference>
  hasRestoreDecision: (uid: string) => Promise<boolean>
  markRestoreDecision: (uid: string, choice: RestoreDecision) => Promise<void>
  getCloudBackupStatus: () => Promise<CloudBackupStatus>
  resetLocalData: () => Promise<void>
  getNotes: () => Promise<NoteFileRecord[]>
  createNote: (input: CreateNoteInput) => Promise<NoteDocument>
  loadNote: (noteId: string) => Promise<NoteDocument>
  saveNote: (noteId: string, text: string) => Promise<SaveNoteResult>
  renameNote: (
    noteId: string,
    nextFileName: string,
    nextTitle?: string,
  ) => Promise<NoteDocument>
  deleteNote: (noteId: string) => Promise<void>
  openExternalFiles: () => Promise<OpenExternalFilesResult>
  getTimeMapNotes: () => Promise<TimeMapNote[]>
  createTimeMapNote: (input: CreateTimeMapNoteInput) => Promise<TimeMapNote>
  updateTimeMapNote: (input: UpdateTimeMapNoteInput) => Promise<TimeMapNote>
  deleteTimeMapNote: (id: string) => Promise<void>
  getNoteVersions: (noteId: string) => Promise<NoteVersion[]>
  restoreNoteVersion: (noteId: string, versionId: string) => Promise<NoteDocument>
  syncFromCloud: () => Promise<{ ok: boolean; error?: string }>
  exportJson: () => Promise<ExportJsonResult>
  importJson: () => Promise<ImportJsonResult>
}
