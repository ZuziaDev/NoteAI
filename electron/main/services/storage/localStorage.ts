import { app } from 'electron'
import Store from 'electron-store'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_AI_SETTINGS } from '../../../../shared/constants/ai'
import { DEFAULT_LOCAL_SETTINGS } from '../../../../shared/constants/appearance'
import { getSessionForSync } from '../auth/authService'
import {
  isFirebaseAdminConfigured,
  readDbPath,
  setDbPath,
} from '../firebase/firebaseAdminService'
import type {
  AISettings,
  ChatMessage,
} from '../../../../shared/types/ai'
import type {
  AccountCloudMode,
  AccountCloudPreference,
  AppConsents,
  CloudBackupStatus,
  CreateTimeMapNoteInput,
  CreateNoteInput,
  LocalBackupPayload,
  LocalSettings,
  NoteVersion,
  NoteDocument,
  NoteFileRecord,
  NoteFormat,
  TodoRecurrence,
  SaveNoteResult,
  TimeMapNote,
  TodoItem,
  RestoreDecision,
  UpdateTimeMapNoteInput,
} from '../../../../shared/types/storage'

type LocalStoreSchema = {
  todos: TodoItem[]
  settings: LocalSettings
  aiSettings: AISettings
  chats: ChatMessage[]
  notes: NoteFileRecord[]
  timeMapNotes: TimeMapNote[]
  noteVersions: NoteVersion[]
}

type ComplianceStoreSchema = {
  consents: AppConsents
  accountPreferences: Record<string, { mode: Exclude<AccountCloudMode, 'unset'>; decidedAt: string }>
  restoreDecisions: Record<string, { choice: RestoreDecision; decidedAt: string }>
}

type CloudUserPayloadV2 = {
  schemaVersion: 2
  updatedAt: string
  todos: Record<string, TodoItem>
  notes: Record<string, NoteDocument>
  chats: Record<string, ChatMessage>
  timeMapNotes: Record<string, TimeMapNote>
  noteVersions: Record<string, NoteVersion>
  settings: {
    local: LocalSettings
    ai: AISettings
  }
  consents: AppConsents
}

const NOTE_DIR_NAME = 'notes'
const LEGACY_NOTE_FILE = 'not.txt'
const MAX_FILE_NAME_LENGTH = 80
const ALLOWED_EXTERNAL_EXTENSIONS = new Set([
  '',
  '.txt',
  '.md',
  '.markdown',
  '.json',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.css',
  '.html',
  '.yml',
  '.yaml',
  '.log',
  '.csv',
])

const store = new Store<LocalStoreSchema>({
  name: 'noteai-local',
  defaults: {
    todos: [],
    settings: DEFAULT_LOCAL_SETTINGS,
    aiSettings: DEFAULT_AI_SETTINGS,
    chats: [],
    notes: [],
    timeMapNotes: [],
    noteVersions: [],
  },
})

const complianceStore = new Store<ComplianceStoreSchema>({
  name: 'noteai-compliance',
  defaults: {
    consents: {
      tosAcceptedAt: null,
      privacyAcceptedAt: null,
      cloudBackupConsentAt: null,
    },
    accountPreferences: {},
    restoreDecisions: {},
  },
})

const getUserDataPath = () => app.getPath('userData')
const getLegacyNotePath = () => path.join(getUserDataPath(), LEGACY_NOTE_FILE)
const getNotesDirectoryPath = () => path.join(getUserDataPath(), NOTE_DIR_NAME)
const VALID_THEME_PRESETS = new Set([
  'aurora',
  'sunset',
  'forest',
  'midnight',
  'sand',
  'neon',
  'ocean',
  'copper',
  'mono',
  'dawn',
  'ember',
  'glacier',
  'royal',
])
const VALID_UI_STYLES = new Set([
  'glass',
  'solid',
  'outline',
  'neon',
  'minimal',
  'v02',
])
const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i

const sanitizeHexColor = (value: unknown, fallback: string) =>
  typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim())
    ? value.trim()
    : fallback

const normalizeTimeMapColors = (value: LocalSettings['timeMapColors'] | undefined) => ({
  todo: sanitizeHexColor(value?.todo, DEFAULT_LOCAL_SETTINGS.timeMapColors.todo),
  notes: sanitizeHexColor(value?.notes, DEFAULT_LOCAL_SETTINGS.timeMapColors.notes),
  important: sanitizeHexColor(
    value?.important,
    DEFAULT_LOCAL_SETTINGS.timeMapColors.important,
  ),
})

const normalizeLocalSettings = (
  settings: Partial<LocalSettings> | undefined,
): LocalSettings => {
  const merged = {
    ...DEFAULT_LOCAL_SETTINGS,
    ...(settings ?? {}),
  }

  return {
    ...merged,
    themePreset: VALID_THEME_PRESETS.has(merged.themePreset)
      ? merged.themePreset
      : DEFAULT_LOCAL_SETTINGS.themePreset,
    uiStylePreset: VALID_UI_STYLES.has(merged.uiStylePreset)
      ? merged.uiStylePreset
      : DEFAULT_LOCAL_SETTINGS.uiStylePreset,
    language: merged.language === 'en' ? 'en' : 'tr',
    syncConflictStrategy:
      merged.syncConflictStrategy === 'latest' ? 'latest' : 'merge',
    timeMapColors: normalizeTimeMapColors(merged.timeMapColors),
  }
}

const normalizeConsents = (value: Partial<AppConsents> | undefined): AppConsents => ({
  tosAcceptedAt: value?.tosAcceptedAt ?? null,
  privacyAcceptedAt: value?.privacyAcceptedAt ?? null,
  cloudBackupConsentAt: value?.cloudBackupConsentAt ?? null,
})

const getConsentsMeta = (): AppConsents =>
  normalizeConsents(complianceStore.get('consents'))

const saveConsentsMeta = (value: AppConsents) => {
  complianceStore.set('consents', normalizeConsents(value))
}

const getAccountPreferencesMeta = () => complianceStore.get('accountPreferences')

const saveAccountPreferencesMeta = (
  value: Record<string, { mode: Exclude<AccountCloudMode, 'unset'>; decidedAt: string }>,
) => {
  complianceStore.set('accountPreferences', value)
}

const getRestoreDecisionsMeta = () => complianceStore.get('restoreDecisions')

const saveRestoreDecisionsMeta = (
  value: Record<string, { choice: RestoreDecision; decidedAt: string }>,
) => {
  complianceStore.set('restoreDecisions', value)
}

const pickFormat = (fileName: string): NoteFormat => {
  const extension = path.extname(fileName).toLowerCase()
  return extension === '.md' || extension === '.markdown' ? 'markdown' : 'plain'
}

const titleFromFileName = (fileName: string) => {
  return (
    fileName
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'New Note'
  )
}

const sanitizeBase = (input: string) => {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._ -]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')

  if (!normalized) return 'note'
  if (normalized.length > MAX_FILE_NAME_LENGTH) {
    return normalized.slice(0, MAX_FILE_NAME_LENGTH).replace(/[.-]+$/g, '')
  }
  return normalized
}

const sanitizeFileName = (raw: string, fallbackExtension = '.md') => {
  const ext = path.extname(raw)
  const base = path.basename(raw, ext)
  const safeBase = sanitizeBase(base)
  const safeExt = sanitizeBase(ext.replace('.', '')).replace(/-/g, '')
  const normalizedExt = safeExt ? `.${safeExt}` : fallbackExtension
  return `${safeBase}${normalizedExt}`
}

const ensureNotesDirectory = async (): Promise<string> => {
  const notesDir = getNotesDirectoryPath()
  await fs.mkdir(notesDir, { recursive: true })
  return notesDir
}

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const ensureUniqueLocalFileName = async (
  rawFileName: string,
  exceptPath?: string,
): Promise<string> => {
  const notesDir = await ensureNotesDirectory()
  const normalized = sanitizeFileName(rawFileName)
  const extension = path.extname(normalized)
  const baseName = path.basename(normalized, extension)

  let counter = 0
  while (counter < 500) {
    const candidate =
      counter === 0 ? normalized : `${baseName}-${counter}${extension}`
    const candidatePath = path.join(notesDir, candidate)

    if (exceptPath && path.normalize(candidatePath) === path.normalize(exceptPath)) {
      return candidate
    }

    if (!(await fileExists(candidatePath))) {
      return candidate
    }

    counter += 1
  }

  return `${baseName}-${Date.now()}${extension}`
}

const readTextOrEmpty = async (filePath: string) => {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return ''
  }
}

const getNotesMeta = () => store.get('notes')

const setNotesMeta = (notes: NoteFileRecord[]) => {
  store.set('notes', notes)
}

const getNoteVersionsMeta = () => store.get('noteVersions')

const setNoteVersionsMeta = (versions: NoteVersion[]) => {
  store.set('noteVersions', versions)
}

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const tag = item.trim().toLowerCase()
    if (!tag) continue
    seen.add(tag.slice(0, 24))
  }
  return Array.from(seen)
}

const normalizeProject = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, 40) : ''

const normalizeRecurrence = (value: unknown): TodoRecurrence => {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') {
    return value
  }
  return 'none'
}

const normalizeTodoItem = (todo: TodoItem): TodoItem => ({
  ...todo,
  dueAt: todo.dueAt ?? null,
  recurrence: normalizeRecurrence((todo as { recurrence?: unknown }).recurrence),
  tags: normalizeTags((todo as { tags?: unknown }).tags),
  project: normalizeProject((todo as { project?: unknown }).project),
  linkedNoteId:
    typeof (todo as { linkedNoteId?: unknown }).linkedNoteId === 'string'
      ? ((todo as { linkedNoteId?: string }).linkedNoteId ?? null)
      : null,
})

const normalizeNoteMeta = (note: NoteFileRecord): NoteFileRecord => ({
  ...note,
  tags: normalizeTags((note as { tags?: unknown }).tags),
  project: normalizeProject((note as { project?: unknown }).project),
})

const normalizeTimeMap = (note: TimeMapNote): TimeMapNote => ({
  ...note,
  date: toDayKey(note.date),
  tags: normalizeTags((note as { tags?: unknown }).tags),
  project: normalizeProject((note as { project?: unknown }).project),
})

const CLOUD_SYNC_DEBOUNCE_MS = 750
const CLOUD_SYNC_RETRY_MS = 12_000
const NOTE_VERSIONS_LIMIT = 25

let cloudSyncTimer: NodeJS.Timeout | null = null
let cloudSyncRetryTimer: NodeJS.Timeout | null = null
let cloudSyncInFlight = false
let cloudSyncPending = false

const mapById = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]))

const hasAnyLocalUserContent = () => {
  return (
    store.get('todos').length > 0 ||
    store.get('notes').length > 0 ||
    store.get('timeMapNotes').length > 0 ||
    store.get('noteVersions').length > 0 ||
    store.get('chats').length > 0
  )
}

const toDayKey = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Gecersiz tarih.')
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const sortTimeMapNotes = (notes: TimeMapNote[]) =>
  [...notes].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1
    }
    return b.updatedAt.localeCompare(a.updatedAt)
  })

const normalizeTimeMapNote = (note: TimeMapNote): TimeMapNote => ({
  ...normalizeTimeMap(note),
})

const sortByUpdatedAtDesc = (notes: NoteFileRecord[]) =>
  [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

const toDocument = async (meta: NoteFileRecord): Promise<NoteDocument> => {
  const content = await readTextOrEmpty(meta.path)
  return {
    ...meta,
    content,
  }
}

const upsertNotes = (incoming: NoteFileRecord[]) => {
  const map = new Map(getNotesMeta().map((note) => [note.id, normalizeNoteMeta(note)]))
  for (const note of incoming) {
    map.set(note.id, normalizeNoteMeta(note))
  }
  setNotesMeta(Array.from(map.values()))
}

const removeMissingFilesFromMeta = async () => {
  const notes = getNotesMeta()
  const validated: NoteFileRecord[] = []

  for (const note of notes) {
    const normalizedNote = normalizeNoteMeta(note)
    if (note.kind === 'external') {
      validated.push(normalizedNote)
      continue
    }

    if (await fileExists(note.path)) {
      validated.push(normalizedNote)
    }
  }

  if (validated.length !== notes.length) {
    setNotesMeta(validated)
  }
}

const ensureNotesMigrated = async () => {
  await ensureNotesDirectory()
  await removeMissingFilesFromMeta()

  const existing = getNotesMeta()
  if (existing.length > 0) {
    return
  }

  const legacyPath = getLegacyNotePath()
  const legacyText = await readTextOrEmpty(legacyPath)
  if (!legacyText.trim()) {
    return
  }

  const now = new Date().toISOString()
  const fileName = await ensureUniqueLocalFileName('imported-note.md')
  const notePath = path.join(getNotesDirectoryPath(), fileName)
  await fs.writeFile(notePath, legacyText, 'utf-8')

  const migrated: NoteFileRecord = {
    id: crypto.randomUUID(),
    title: 'Imported Note',
    fileName,
    path: notePath,
    kind: 'local',
    format: pickFormat(fileName),
    tags: [],
    project: '',
    createdAt: now,
    updatedAt: now,
  }

  setNotesMeta([migrated])
}

export const getTodos = (): TodoItem[] => {
  const todos = store.get('todos')
  const normalized = todos.map(normalizeTodoItem)

  if (JSON.stringify(todos) !== JSON.stringify(normalized)) {
    store.set('todos', normalized)
  }

  return normalized
}

export const saveTodos = (todos: TodoItem[]): void => {
  const normalized = todos.map(normalizeTodoItem)
  store.set('todos', normalized)
  scheduleCloudSync()
}

export const getLocalSettings = (): LocalSettings => {
  return normalizeLocalSettings(store.get('settings'))
}

export const saveLocalSettings = (settings: LocalSettings): LocalSettings => {
  const normalized = normalizeLocalSettings(settings)
  store.set('settings', normalized)
  if (!normalized.cloudBackupEnabled) {
    cloudSyncPending = false
    if (cloudSyncRetryTimer) {
      clearTimeout(cloudSyncRetryTimer)
      cloudSyncRetryTimer = null
    }
  }
  scheduleCloudSync()
  return normalized
}

export const getConsents = (): AppConsents => {
  return getConsentsMeta()
}

export const acceptMandatoryConsents = (): AppConsents => {
  const now = new Date().toISOString()
  const current = getConsentsMeta()
  const next: AppConsents = {
    tosAcceptedAt: current.tosAcceptedAt ?? now,
    privacyAcceptedAt: current.privacyAcceptedAt ?? now,
    cloudBackupConsentAt: current.cloudBackupConsentAt,
  }
  saveConsentsMeta(next)
  scheduleCloudSync()
  return next
}

export const grantCloudBackupConsent = (): AppConsents => {
  const now = new Date().toISOString()
  const current = getConsentsMeta()
  const next: AppConsents = {
    ...current,
    cloudBackupConsentAt: current.cloudBackupConsentAt ?? now,
  }
  saveConsentsMeta(next)
  scheduleCloudSync()
  return next
}

export const getAccountCloudPreference = (uid: string): AccountCloudPreference => {
  const cleanUid = uid.trim()
  if (!cleanUid) {
    return {
      uid: '',
      mode: 'unset',
      decidedAt: null,
    }
  }
  const preference = getAccountPreferencesMeta()[cleanUid]
  if (!preference) {
    return {
      uid: cleanUid,
      mode: 'unset',
      decidedAt: null,
    }
  }
  return {
    uid: cleanUid,
    mode: preference.mode,
    decidedAt: preference.decidedAt,
  }
}

export const setAccountCloudPreference = (
  uid: string,
  mode: Exclude<AccountCloudMode, 'unset'>,
): AccountCloudPreference => {
  const cleanUid = uid.trim()
  if (!cleanUid) {
    throw new Error('Gecersiz uid.')
  }
  const now = new Date().toISOString()
  const preferences = getAccountPreferencesMeta()
  preferences[cleanUid] = {
    mode,
    decidedAt: now,
  }
  saveAccountPreferencesMeta(preferences)
  saveLocalSettings({
    ...getLocalSettings(),
    cloudBackupEnabled: mode === 'cloud',
  })
  return {
    uid: cleanUid,
    mode,
    decidedAt: now,
  }
}

export const hasRestoreDecision = (uid: string): boolean => {
  const cleanUid = uid.trim()
  if (!cleanUid) return false
  return Boolean(getRestoreDecisionsMeta()[cleanUid])
}

export const markRestoreDecision = (uid: string, choice: RestoreDecision): void => {
  const cleanUid = uid.trim()
  if (!cleanUid) return
  const next = getRestoreDecisionsMeta()
  next[cleanUid] = {
    choice,
    decidedAt: new Date().toISOString(),
  }
  saveRestoreDecisionsMeta(next)
}

export const getNotes = async (): Promise<NoteFileRecord[]> => {
  await ensureNotesMigrated()
  const notes = getNotesMeta().map(normalizeNoteMeta)
  if (JSON.stringify(notes) !== JSON.stringify(getNotesMeta())) {
    setNotesMeta(notes)
  }
  return sortByUpdatedAtDesc(notes)
}

export const createNote = async (input: CreateNoteInput): Promise<NoteDocument> => {
  await ensureNotesMigrated()
  const now = new Date().toISOString()
  const uniqueFileName = await ensureUniqueLocalFileName(input.fileName || 'note.md')
  const notePath = path.join(getNotesDirectoryPath(), uniqueFileName)
  const content = input.content ?? ''

  await fs.writeFile(notePath, content, 'utf-8')

  const meta: NoteFileRecord = {
    id: crypto.randomUUID(),
    title: input.title?.trim() || titleFromFileName(uniqueFileName),
    fileName: uniqueFileName,
    path: notePath,
    kind: 'local',
    format: pickFormat(uniqueFileName),
    tags: [],
    project: '',
    createdAt: now,
    updatedAt: now,
  }

  upsertNotes([meta])
  scheduleCloudSync()
  return {
    ...meta,
    content,
  }
}

export const loadNote = async (noteId: string): Promise<NoteDocument> => {
  await ensureNotesMigrated()
  const note = getNotesMeta().find((item) => item.id === noteId)
  if (!note) {
    throw new Error('Not bulunamadi.')
  }
  return toDocument(note)
}

export const saveNote = async (noteId: string, text: string): Promise<SaveNoteResult> => {
  await ensureNotesMigrated()
  const notes = getNotesMeta()
  const index = notes.findIndex((item) => item.id === noteId)
  if (index < 0) {
    throw new Error('Not bulunamadi.')
  }

  const current = notes[index]
  saveNoteVersion(current.id, await readTextOrEmpty(current.path))
  await fs.writeFile(current.path, text, 'utf-8')
  const updatedAt = new Date().toISOString()
  const updated: NoteFileRecord = normalizeNoteMeta({
    ...current,
    updatedAt,
  })

  const next = [...notes]
  next[index] = updated
  setNotesMeta(next)
  scheduleCloudSync()

  return {
    path: updated.path,
    updatedAt,
  }
}

export const renameNote = async (
  noteId: string,
  nextFileNameRaw: string,
  nextTitle?: string,
): Promise<NoteDocument> => {
  await ensureNotesMigrated()
  const notes = getNotesMeta()
  const index = notes.findIndex((item) => item.id === noteId)
  if (index < 0) {
    throw new Error('Not bulunamadi.')
  }

  const current = notes[index]
  if (current.kind !== 'local') {
    throw new Error('Dis dosya yeniden adlandirilamaz.')
  }

  const uniqueFileName = await ensureUniqueLocalFileName(nextFileNameRaw, current.path)
  const nextPath = path.join(getNotesDirectoryPath(), uniqueFileName)

  if (path.normalize(current.path) !== path.normalize(nextPath)) {
    await fs.rename(current.path, nextPath)
  }

  const updatedAt = new Date().toISOString()
  const updated: NoteFileRecord = normalizeNoteMeta({
    ...current,
    fileName: uniqueFileName,
    title: nextTitle?.trim() || titleFromFileName(uniqueFileName),
    path: nextPath,
    format: pickFormat(uniqueFileName),
    updatedAt,
  })

  const next = [...notes]
  next[index] = updated
  setNotesMeta(next)
  scheduleCloudSync()
  return toDocument(updated)
}

export const deleteNote = async (noteId: string): Promise<void> => {
  await ensureNotesMigrated()
  const notes = getNotesMeta()
  const target = notes.find((item) => item.id === noteId)
  if (!target) return

  const next = notes.filter((item) => item.id !== noteId)
  setNotesMeta(next)
  setNoteVersionsMeta(getNoteVersionsMeta().filter((version) => version.noteId !== noteId))

  if (target.kind === 'local') {
    try {
      await fs.unlink(target.path)
    } catch {
      // The file might already be deleted manually. Metadata was removed above.
    }
  }
  scheduleCloudSync()
}

export const registerExternalFiles = async (
  filePaths: string[],
): Promise<NoteFileRecord[]> => {
  await ensureNotesMigrated()
  const now = new Date().toISOString()
  const existing = getNotesMeta()
  const addedOrFound: NoteFileRecord[] = []
  const next = [...existing]

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase()
    if (!ALLOWED_EXTERNAL_EXTENSIONS.has(ext)) {
      continue
    }

    const byPath = next.find(
      (note) => path.normalize(note.path) === path.normalize(filePath),
    )
    if (byPath) {
      const refreshed: NoteFileRecord = normalizeNoteMeta({
        ...byPath,
        updatedAt: now,
      })
      const idx = next.findIndex((note) => note.id === byPath.id)
      next[idx] = refreshed
      addedOrFound.push(refreshed)
      continue
    }

    const fileName = path.basename(filePath)
    const record: NoteFileRecord = {
      id: crypto.randomUUID(),
      title: titleFromFileName(fileName),
      fileName,
      path: filePath,
      kind: 'external',
      format: pickFormat(fileName),
      tags: [],
      project: '',
      createdAt: now,
      updatedAt: now,
    }
    next.push(record)
    addedOrFound.push(record)
  }

  setNotesMeta(next)
  scheduleCloudSync()
  return sortByUpdatedAtDesc(addedOrFound)
}

export const getTimeMapNotes = (): TimeMapNote[] => {
  const notes = store.get('timeMapNotes')
  const normalized = notes.map(normalizeTimeMapNote)
  if (JSON.stringify(normalized) !== JSON.stringify(notes)) {
    store.set('timeMapNotes', normalized)
  }
  return sortTimeMapNotes(normalized)
}

export const createTimeMapNote = (input: CreateTimeMapNoteInput): TimeMapNote => {
  const title = input.title.trim()
  if (!title) {
    throw new Error('Not basligi bos olamaz.')
  }

  const now = new Date().toISOString()
  const created: TimeMapNote = {
    id: crypto.randomUUID(),
    date: toDayKey(input.date),
    title,
    content: (input.content ?? '').trim(),
    tags: normalizeTags(input.tags),
    project: normalizeProject(input.project),
    createdAt: now,
    updatedAt: now,
  }

  const next = [created, ...getTimeMapNotes()]
  store.set('timeMapNotes', next)
  scheduleCloudSync()
  return created
}

export const updateTimeMapNote = (input: UpdateTimeMapNoteInput): TimeMapNote => {
  const title = input.title.trim()
  if (!title) {
    throw new Error('Not basligi bos olamaz.')
  }

  const notes = getTimeMapNotes()
  const index = notes.findIndex((note) => note.id === input.id)
  if (index < 0) {
    throw new Error('TimeMap notu bulunamadi.')
  }

  const updated: TimeMapNote = {
    ...notes[index],
    date: toDayKey(input.date),
    title,
    content: input.content.trim(),
    tags: normalizeTags(input.tags ?? notes[index].tags),
    project: normalizeProject(input.project ?? notes[index].project),
    updatedAt: new Date().toISOString(),
  }
  const next = [...notes]
  next[index] = normalizeTimeMapNote(updated)
  store.set('timeMapNotes', next)
  scheduleCloudSync()
  return updated
}

export const deleteTimeMapNote = (id: string): void => {
  const notes = getTimeMapNotes()
  const next = notes.filter((note) => note.id !== id)
  store.set('timeMapNotes', next)
  scheduleCloudSync()
}

export const getAISettings = (): AISettings => {
  return {
    ...DEFAULT_AI_SETTINGS,
    ...store.get('aiSettings'),
  }
}

export const saveAISettings = (settings: AISettings): AISettings => {
  const normalized = {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
  }
  store.set('aiSettings', normalized)
  scheduleCloudSync()
  return normalized
}

export const getChatHistory = (): ChatMessage[] => {
  return store.get('chats')
}

export const saveChatHistory = (messages: ChatMessage[]): void => {
  store.set('chats', messages)
  scheduleCloudSync()
}

export const clearChatHistory = (): void => {
  store.set('chats', [])
  scheduleCloudSync()
}

const shouldAllowCloudWrite = (uid: string): boolean => {
  if (!uid.trim()) {
    return false
  }
  const settings = getLocalSettings()
  if (!settings.cloudBackupEnabled) {
    return false
  }
  const consents = getConsentsMeta()
  return Boolean(
    consents.tosAcceptedAt &&
      consents.privacyAcceptedAt &&
      consents.cloudBackupConsentAt,
  )
}

const clearCloudRetryTimer = () => {
  if (!cloudSyncRetryTimer) {
    return
  }
  clearTimeout(cloudSyncRetryTimer)
  cloudSyncRetryTimer = null
}

const scheduleCloudRetry = () => {
  if (cloudSyncRetryTimer) {
    return
  }
  cloudSyncRetryTimer = setTimeout(() => {
    cloudSyncRetryTimer = null
    if (!cloudSyncPending) {
      return
    }
    void pushCloudSnapshotNow()
  }, CLOUD_SYNC_RETRY_MS)
}

const createCloudPayloadV2 = async (): Promise<CloudUserPayloadV2> => {
  const notes = await collectNotesForBackup()
  return {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    todos: mapById(getTodos()),
    notes: mapById(notes),
    chats: mapById(getChatHistory()),
    timeMapNotes: mapById(getTimeMapNotes()),
    noteVersions: mapById(getNoteVersionsMeta()),
    settings: {
      local: getLocalSettings(),
      ai: getAISettings(),
    },
    consents: getConsentsMeta(),
  }
}

const toTimestamp = (value: unknown): number => {
  if (typeof value !== 'string') {
    return 0
  }
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

const getRecordFreshness = <T>(record: Record<string, T>): number => {
  let freshness = 0
  for (const item of Object.values(record)) {
    if (!item || typeof item !== 'object') continue
    const candidate = item as { updatedAt?: unknown; createdAt?: unknown }
    freshness = Math.max(
      freshness,
      toTimestamp(candidate.updatedAt),
      toTimestamp(candidate.createdAt),
    )
  }
  return freshness
}

const getPayloadFreshness = (payload: CloudUserPayloadV2): number =>
  Math.max(
    toTimestamp(payload.updatedAt),
    getRecordFreshness(payload.todos),
    getRecordFreshness(payload.notes),
    getRecordFreshness(payload.chats),
    getRecordFreshness(payload.timeMapNotes),
    getRecordFreshness(payload.noteVersions),
  )

const pickNewerItem = <T extends { updatedAt?: string; createdAt?: string }>(
  localItem: T,
  remoteItem: T,
): T => {
  const localTime = toTimestamp(localItem.updatedAt ?? localItem.createdAt)
  const remoteTime = toTimestamp(remoteItem.updatedAt ?? remoteItem.createdAt)
  return localTime >= remoteTime ? localItem : remoteItem
}

const mergeByUpdatedAt = <T extends { updatedAt?: string; createdAt?: string }>(
  localRecord: Record<string, T>,
  remoteRecord: Record<string, T>,
): Record<string, T> => {
  const merged: Record<string, T> = { ...remoteRecord }
  for (const [id, localItem] of Object.entries(localRecord)) {
    const remoteItem = remoteRecord[id]
    if (!remoteItem) {
      merged[id] = localItem
      continue
    }
    merged[id] = pickNewerItem(localItem, remoteItem)
  }
  return merged
}

const mergeConsentTimestamp = (localValue: string | null, remoteValue: string | null) => {
  if (!localValue) return remoteValue
  if (!remoteValue) return localValue
  return toTimestamp(localValue) >= toTimestamp(remoteValue) ? localValue : remoteValue
}

const mergeCloudPayload = (
  localPayload: CloudUserPayloadV2,
  remotePayload: CloudUserPayloadV2,
): CloudUserPayloadV2 => {
  const merged: CloudUserPayloadV2 = {
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
    todos: mergeByUpdatedAt(localPayload.todos, remotePayload.todos),
    notes: mergeByUpdatedAt(localPayload.notes, remotePayload.notes),
    chats: mergeByUpdatedAt(localPayload.chats, remotePayload.chats),
    timeMapNotes: mergeByUpdatedAt(localPayload.timeMapNotes, remotePayload.timeMapNotes),
    noteVersions: mergeByUpdatedAt(localPayload.noteVersions, remotePayload.noteVersions),
    settings: {
      local: {
        ...remotePayload.settings.local,
        ...localPayload.settings.local,
      },
      ai: {
        ...remotePayload.settings.ai,
        ...localPayload.settings.ai,
      },
    },
    consents: {
      tosAcceptedAt: mergeConsentTimestamp(
        localPayload.consents.tosAcceptedAt,
        remotePayload.consents.tosAcceptedAt,
      ),
      privacyAcceptedAt: mergeConsentTimestamp(
        localPayload.consents.privacyAcceptedAt,
        remotePayload.consents.privacyAcceptedAt,
      ),
      cloudBackupConsentAt: mergeConsentTimestamp(
        localPayload.consents.cloudBackupConsentAt,
        remotePayload.consents.cloudBackupConsentAt,
      ),
    },
  }
  return merged
}

const isCloudPayloadV2 = (value: unknown): value is CloudUserPayloadV2 => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<CloudUserPayloadV2>
  return (
    candidate.schemaVersion === 2 &&
    !!candidate.todos &&
    !!candidate.notes &&
    !!candidate.chats &&
    !!candidate.timeMapNotes &&
    !!candidate.noteVersions &&
    !!candidate.settings
  )
}

const hasCloudUserData = (payload: unknown): { hasBackup: boolean; updatedAt: string | null } => {
  if (!payload || typeof payload !== 'object') {
    return { hasBackup: false, updatedAt: null }
  }

  const candidate = payload as Record<string, unknown>

  if (
    typeof candidate.schemaVersion === 'number' &&
    candidate.schemaVersion >= 2
  ) {
    const todos = candidate.todos
    const notes = candidate.notes
    const chats = candidate.chats
    const timeMapNotes = candidate.timeMapNotes
    const noteVersions = candidate.noteVersions
    const hasBackup = Boolean(
      (todos && typeof todos === 'object' && Object.keys(todos).length > 0) ||
      (notes && typeof notes === 'object' && Object.keys(notes).length > 0) ||
      (chats && typeof chats === 'object' && Object.keys(chats).length > 0) ||
      (timeMapNotes && typeof timeMapNotes === 'object' && Object.keys(timeMapNotes).length > 0) ||
      (noteVersions &&
        typeof noteVersions === 'object' &&
        Object.keys(noteVersions).length > 0),
    )
    return {
      hasBackup,
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
    }
  }

  const legacy = candidate as Partial<LocalBackupPayload>
  if (isLocalBackupPayload(legacy)) {
    const hasBackup = Boolean(
      legacy.todos.length > 0 ||
      (legacy.notes?.length ?? 0) > 0 ||
      (legacy.chats?.length ?? 0) > 0 ||
      (legacy.timeMapNotes?.length ?? 0) > 0 ||
      (legacy.noteVersions?.length ?? 0) > 0,
    )
    return {
      hasBackup,
      updatedAt: legacy.exportedAt,
    }
  }

  return { hasBackup: false, updatedAt: null }
}

const toArrayFromMap = <T>(
  value: unknown,
  guard: (candidate: unknown) => candidate is T,
): T[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(guard)
  }
  if (typeof value !== 'object') return []
  return Object.values(value).filter(guard)
}

const toBackupFromCloudPayload = (payload: unknown): LocalBackupPayload | null => {
  if (!payload || typeof payload !== 'object') return null

  const legacy = payload as Partial<LocalBackupPayload>
  if (isLocalBackupPayload(legacy)) {
    return legacy
  }

  const cloud = payload as Partial<CloudUserPayloadV2>
  if (cloud.schemaVersion !== 2) {
    return null
  }

  const todos = toArrayFromMap(cloud.todos, isTodoItem)
  const notes = toArrayFromMap(cloud.notes, isNoteDocument)
  const chats = toArrayFromMap(cloud.chats, isChatMessage)
  const timeMapNotes = toArrayFromMap(cloud.timeMapNotes, isTimeMapNote)
  const noteVersions = toArrayFromMap(cloud.noteVersions, isNoteVersion)
  const localSettings = normalizeLocalSettings(cloud.settings?.local)
  const aiSettings = isAISettings(cloud.settings?.ai) ? cloud.settings?.ai : getAISettings()

  return {
    version: 1,
    exportedAt:
      typeof cloud.updatedAt === 'string' ? cloud.updatedAt : new Date().toISOString(),
    todos,
    settings: localSettings,
    consents: normalizeConsents(cloud.consents),
    noteText: notes[0]?.content ?? '',
    notes,
    timeMapNotes,
    noteVersions,
    aiSettings,
    chats,
  }
}

const pushCloudSnapshotNow = async () => {
  if (cloudSyncInFlight) {
    return
  }

  const firebaseStatus = isFirebaseAdminConfigured()
  if (!firebaseStatus.ok) {
    cloudSyncPending = false
    clearCloudRetryTimer()
    return
  }

  const session = await getSessionForSync()
  if (!session?.user?.uid) {
    cloudSyncPending = false
    clearCloudRetryTimer()
    return
  }
  if (!shouldAllowCloudWrite(session.user.uid)) {
    cloudSyncPending = false
    clearCloudRetryTimer()
    return
  }

  cloudSyncInFlight = true
  try {
    const localPayload = await createCloudPayloadV2()
    const strategy = getLocalSettings().syncConflictStrategy
    const remoteRaw = await readDbPath<unknown>(`users/${session.user.uid}`)

    let payloadToWrite = localPayload
    if (isCloudPayloadV2(remoteRaw)) {
      if (strategy === 'merge') {
        payloadToWrite = mergeCloudPayload(localPayload, remoteRaw)
      } else {
        const localFreshness = getPayloadFreshness(localPayload)
        const remoteFreshness = getPayloadFreshness(remoteRaw)
        if (remoteFreshness > localFreshness) {
          cloudSyncPending = false
          clearCloudRetryTimer()
          return
        }
      }
    }

    await setDbPath(`users/${session.user.uid}`, payloadToWrite)
    cloudSyncPending = false
    clearCloudRetryTimer()
  } catch {
    cloudSyncPending = true
    scheduleCloudRetry()
  } finally {
    cloudSyncInFlight = false
  }
}

const scheduleCloudSync = () => {
  cloudSyncPending = true
  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer)
  }
  cloudSyncTimer = setTimeout(() => {
    cloudSyncTimer = null
    void pushCloudSnapshotNow()
  }, CLOUD_SYNC_DEBOUNCE_MS)
}

const saveNoteVersion = (noteId: string, content: string) => {
  const versions = getNoteVersionsMeta()
  const next = [
    {
      id: crypto.randomUUID(),
      noteId,
      content,
      createdAt: new Date().toISOString(),
    },
    ...versions.filter((version) => version.noteId === noteId),
  ].slice(0, NOTE_VERSIONS_LIMIT)

  const keepOther = versions.filter((version) => version.noteId !== noteId)
  setNoteVersionsMeta([...next, ...keepOther])
}

export const getNoteVersions = (noteId: string): NoteVersion[] => {
  return getNoteVersionsMeta()
    .filter((version) => version.noteId === noteId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const restoreNoteVersion = async (
  noteId: string,
  versionId: string,
): Promise<NoteDocument> => {
  const version = getNoteVersionsMeta().find(
    (item) => item.noteId === noteId && item.id === versionId,
  )
  if (!version) {
    throw new Error('Versiyon bulunamadi.')
  }
  await saveNote(noteId, version.content)
  return loadNote(noteId)
}

export const syncFromCloudToLocal = async (): Promise<{ ok: boolean; error?: string }> => {
  const firebaseStatus = isFirebaseAdminConfigured()
  if (!firebaseStatus.ok) {
    return { ok: false, error: firebaseStatus.error }
  }

  const session = await getSessionForSync()
  if (!session?.user?.uid) {
    return { ok: false, error: 'Aktif oturum yok.' }
  }

  try {
    const payload = await readDbPath<unknown>(`users/${session.user.uid}`)
    if (!payload || typeof payload !== 'object') {
      return { ok: true }
    }

    const converted = toBackupFromCloudPayload(payload)
    if (!converted) {
      return { ok: false, error: 'Cloud verisi gecersiz formatta.' }
    }

    const cloudConsents = (payload as { consents?: Partial<AppConsents> }).consents
    if (cloudConsents) {
      saveConsentsMeta(normalizeConsents(cloudConsents))
    }

    await applyBackupPayload(converted)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Cloud sync basarisiz.',
    }
  }
}

export const getCloudBackupStatus = async (): Promise<CloudBackupStatus> => {
  const hasLocalData = hasAnyLocalUserContent()
  const firebaseStatus = isFirebaseAdminConfigured()
  if (!firebaseStatus.ok) {
    return {
      ok: false,
      hasBackup: false,
      hasLocalData,
      updatedAt: null,
      error: firebaseStatus.error,
    }
  }

  const session = await getSessionForSync()
  if (!session?.user?.uid) {
    return {
      ok: false,
      hasBackup: false,
      hasLocalData,
      updatedAt: null,
      error: 'Aktif oturum yok.',
    }
  }

  try {
    const payload = await readDbPath<unknown>(`users/${session.user.uid}`)
    const parsed = hasCloudUserData(payload)
    return {
      ok: true,
      hasBackup: parsed.hasBackup,
      hasLocalData,
      updatedAt: parsed.updatedAt,
    }
  } catch (error) {
    return {
      ok: false,
      hasBackup: false,
      hasLocalData,
      updatedAt: null,
      error: error instanceof Error ? error.message : 'Cloud status basarisiz.',
    }
  }
}

export const resetLocalData = async (): Promise<void> => {
  const notes = getNotesMeta()
  for (const note of notes) {
    if (note.kind !== 'local') continue
    try {
      await fs.unlink(note.path)
    } catch {
      // Ignore missing file errors.
    }
  }

  store.set('todos', [])
  store.set('notes', [])
  store.set('timeMapNotes', [])
  store.set('noteVersions', [])
  store.set('chats', [])
}

const isTodoItem = (value: unknown): value is TodoItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const todo = value as Partial<TodoItem>
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    (todo.priority === 'Low' || todo.priority === 'Medium' || todo.priority === 'High') &&
    typeof todo.done === 'boolean' &&
    (todo.dueAt === undefined || todo.dueAt === null || typeof todo.dueAt === 'string') &&
    (todo.recurrence === undefined ||
      todo.recurrence === 'none' ||
      todo.recurrence === 'daily' ||
      todo.recurrence === 'weekly' ||
      todo.recurrence === 'monthly') &&
    (todo.tags === undefined ||
      (Array.isArray(todo.tags) && todo.tags.every((tag) => typeof tag === 'string'))) &&
    (todo.project === undefined || typeof todo.project === 'string') &&
    (todo.linkedNoteId === undefined ||
      todo.linkedNoteId === null ||
      typeof todo.linkedNoteId === 'string') &&
    typeof todo.createdAt === 'string' &&
    typeof todo.updatedAt === 'string'
  )
}

const isAISettings = (value: unknown): value is AISettings => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const settings = value as Partial<AISettings>
  const validProvider =
    settings.provider === 'openai' ||
    settings.provider === 'claude' ||
    settings.provider === 'gemini' ||
    settings.provider === 'other'

  return (
    validProvider &&
    typeof settings.apiKey === 'string' &&
    typeof settings.baseUrl === 'string' &&
    typeof settings.model === 'string' &&
    (settings.systemPrompt === undefined || typeof settings.systemPrompt === 'string')
  )
}

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const message = value as Partial<ChatMessage>
  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.text === 'string' &&
    typeof message.createdAt === 'string'
  )
}

const isNoteRecord = (value: unknown): value is NoteFileRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const note = value as Partial<NoteFileRecord>
  return (
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.fileName === 'string' &&
    typeof note.path === 'string' &&
    (note.kind === 'local' || note.kind === 'external') &&
    (note.format === 'markdown' || note.format === 'plain') &&
    (note.tags === undefined ||
      (Array.isArray(note.tags) && note.tags.every((tag) => typeof tag === 'string'))) &&
    (note.project === undefined || typeof note.project === 'string') &&
    typeof note.createdAt === 'string' &&
    typeof note.updatedAt === 'string'
  )
}

const isNoteDocument = (value: unknown): value is NoteDocument => {
  if (!isNoteRecord(value)) return false
  return typeof (value as { content?: unknown }).content === 'string'
}

const isTimeMapNote = (value: unknown): value is TimeMapNote => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const note = value as Partial<TimeMapNote>
  return (
    typeof note.id === 'string' &&
    typeof note.date === 'string' &&
    !Number.isNaN(new Date(note.date).getTime()) &&
    typeof note.title === 'string' &&
    typeof note.content === 'string' &&
    (note.tags === undefined ||
      (Array.isArray(note.tags) && note.tags.every((tag) => typeof tag === 'string'))) &&
    (note.project === undefined || typeof note.project === 'string') &&
    typeof note.createdAt === 'string' &&
    typeof note.updatedAt === 'string'
  )
}

const isNoteVersion = (value: unknown): value is NoteVersion => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const version = value as Partial<NoteVersion>
  return (
    typeof version.id === 'string' &&
    typeof version.noteId === 'string' &&
    typeof version.content === 'string' &&
    typeof version.createdAt === 'string'
  )
}

const collectNotesForBackup = async (): Promise<NoteDocument[]> => {
  const notes = await getNotes()
  const result: NoteDocument[] = []
  for (const note of notes) {
    const content = await readTextOrEmpty(note.path)
    result.push({
      ...note,
      content,
    })
  }
  return result
}

export const createBackupPayload = async (): Promise<LocalBackupPayload> => {
  const notes = await collectNotesForBackup()
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos: getTodos(),
    settings: getLocalSettings(),
    consents: getConsentsMeta(),
    noteText: notes[0]?.content ?? '',
    notes,
    timeMapNotes: getTimeMapNotes(),
    noteVersions: getNoteVersionsMeta(),
    aiSettings: store.get('aiSettings'),
    chats: store.get('chats'),
  }
}

export const isLocalBackupPayload = (
  value: unknown,
): value is LocalBackupPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<LocalBackupPayload>
  if (payload.version !== 1 || typeof payload.exportedAt !== 'string') {
    return false
  }

  if (!Array.isArray(payload.todos) || !payload.todos.every(isTodoItem)) {
    return false
  }

  if (!payload.settings || typeof payload.settings !== 'object') {
    return false
  }

  const settings = payload.settings as Partial<LocalSettings>
  const validTheme =
    settings.themePreset === undefined ||
    settings.themePreset === 'aurora' ||
    settings.themePreset === 'sunset' ||
    settings.themePreset === 'forest' ||
    settings.themePreset === 'midnight' ||
    settings.themePreset === 'sand' ||
    settings.themePreset === 'neon' ||
    settings.themePreset === 'ocean' ||
    settings.themePreset === 'copper' ||
    settings.themePreset === 'mono' ||
    settings.themePreset === 'dawn' ||
    settings.themePreset === 'ember' ||
    settings.themePreset === 'glacier' ||
    settings.themePreset === 'royal'
  const validUiStyle =
    settings.uiStylePreset === undefined ||
    settings.uiStylePreset === 'glass' ||
    settings.uiStylePreset === 'solid' ||
    settings.uiStylePreset === 'outline' ||
    settings.uiStylePreset === 'neon' ||
    settings.uiStylePreset === 'minimal' ||
    settings.uiStylePreset === 'v02'
  const validConflictStrategy =
    settings.syncConflictStrategy === undefined ||
    settings.syncConflictStrategy === 'latest' ||
    settings.syncConflictStrategy === 'merge'
  const validLanguage =
    settings.language === undefined ||
    settings.language === 'tr' ||
    settings.language === 'en'
  const validTimeMapColors =
    settings.timeMapColors === undefined ||
    (typeof settings.timeMapColors === 'object' &&
      settings.timeMapColors !== null &&
      (settings.timeMapColors.todo === undefined ||
        (typeof settings.timeMapColors.todo === 'string' &&
          HEX_COLOR_PATTERN.test(settings.timeMapColors.todo))) &&
      (settings.timeMapColors.notes === undefined ||
        (typeof settings.timeMapColors.notes === 'string' &&
          HEX_COLOR_PATTERN.test(settings.timeMapColors.notes))) &&
      (settings.timeMapColors.important === undefined ||
        (typeof settings.timeMapColors.important === 'string' &&
          HEX_COLOR_PATTERN.test(settings.timeMapColors.important))))
  const validBriefingDate =
    settings.lastDailyBriefingDate === undefined ||
    settings.lastDailyBriefingDate === null ||
    typeof settings.lastDailyBriefingDate === 'string'

  if (
    typeof settings.cloudBackupEnabled !== 'boolean' ||
    (settings.dailyBriefingEnabled !== undefined &&
      typeof settings.dailyBriefingEnabled !== 'boolean') ||
    !validTheme ||
    !validUiStyle ||
    !validConflictStrategy ||
    !validLanguage ||
    !validTimeMapColors ||
    !validBriefingDate
  ) {
    return false
  }

  if (payload.consents !== undefined) {
    if (!payload.consents || typeof payload.consents !== 'object') {
      return false
    }
    const consents = payload.consents as Partial<AppConsents>
    if (
      (consents.tosAcceptedAt !== undefined &&
        consents.tosAcceptedAt !== null &&
        typeof consents.tosAcceptedAt !== 'string') ||
      (consents.privacyAcceptedAt !== undefined &&
        consents.privacyAcceptedAt !== null &&
        typeof consents.privacyAcceptedAt !== 'string') ||
      (consents.cloudBackupConsentAt !== undefined &&
        consents.cloudBackupConsentAt !== null &&
        typeof consents.cloudBackupConsentAt !== 'string')
    ) {
      return false
    }
  }

  if (payload.noteText !== undefined && typeof payload.noteText !== 'string') {
    return false
  }

  if (payload.notes !== undefined) {
    if (!Array.isArray(payload.notes) || !payload.notes.every(isNoteDocument)) {
      return false
    }
  }

  if (payload.timeMapNotes !== undefined) {
    if (
      !Array.isArray(payload.timeMapNotes) ||
      !payload.timeMapNotes.every(isTimeMapNote)
    ) {
      return false
    }
  }

  if (payload.noteVersions !== undefined) {
    if (!Array.isArray(payload.noteVersions) || !payload.noteVersions.every(isNoteVersion)) {
      return false
    }
  }

  if (payload.aiSettings && !isAISettings(payload.aiSettings)) {
    return false
  }

  if (payload.chats && (!Array.isArray(payload.chats) || !payload.chats.every(isChatMessage))) {
    return false
  }

  return true
}

export const applyBackupPayload = async (
  payload: LocalBackupPayload,
): Promise<void> => {
  store.set('todos', payload.todos.map(normalizeTodoItem))
  saveLocalSettings(payload.settings)
  if (payload.consents) {
    saveConsentsMeta(normalizeConsents(payload.consents))
  }
  if (payload.aiSettings) {
    store.set('aiSettings', payload.aiSettings)
  }
  if (payload.chats) {
    store.set('chats', payload.chats)
  }
  store.set(
    'timeMapNotes',
    (payload.timeMapNotes ?? []).map((note) => normalizeTimeMapNote(note)),
  )
  setNoteVersionsMeta([])

  setNotesMeta([])

  const incoming = payload.notes ?? []
  const noteIdMap = new Map<string, string>()
  if (incoming.length > 0) {
    for (const note of incoming) {
      const created = await createNote({
        fileName: note.fileName || `${sanitizeBase(note.title)}.md`,
        title: note.title,
        content: note.content,
      })
      noteIdMap.set(note.id, created.id)
      if (note.updatedAt) {
        const notes = getNotesMeta()
        const idx = notes.findIndex((item) => item.id === created.id)
        if (idx >= 0) {
          notes[idx] = normalizeNoteMeta({
            ...notes[idx],
            tags: note.tags ?? [],
            project: note.project ?? '',
            updatedAt: note.updatedAt,
            createdAt: note.createdAt || note.updatedAt,
          })
          setNotesMeta(notes)
        }
      }
    }
    if (payload.noteVersions) {
      const remapped = payload.noteVersions
        .map((version) => ({
          ...version,
          noteId: noteIdMap.get(version.noteId) ?? '',
        }))
        .filter((version) => version.noteId)
      setNoteVersionsMeta(remapped)
    }
    scheduleCloudSync()
    return
  }

  if (payload.noteText && payload.noteText.trim()) {
    await createNote({
      fileName: 'imported-note.md',
      title: 'Imported Note',
      content: payload.noteText,
    })
  }
  if (payload.noteVersions) {
    setNoteVersionsMeta(payload.noteVersions)
  }
  scheduleCloudSync()
}
