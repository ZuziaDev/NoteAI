import { DEFAULT_LOCAL_SETTINGS } from '../../shared/constants/appearance'
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
  NoteDocument,
  NoteFileRecord,
  NoteVersion,
  OpenExternalFilesResult,
  SaveNoteResult,
  TimeMapNote,
  TodoItem,
  RestoreDecision,
  UpdateTimeMapNoteInput,
} from '../../shared/types/storage'

const FALLBACK_TODOS_KEY = 'noteai.fallback.todos'
const FALLBACK_LOCAL_SETTINGS_KEY = 'noteai.fallback.local-settings'
const FALLBACK_CONSENTS_KEY = 'noteai.fallback.consents'
const FALLBACK_ACCOUNT_PREFERENCES_KEY = 'noteai.fallback.account-preferences'
const FALLBACK_RESTORE_DECISIONS_KEY = 'noteai.fallback.restore-decisions'
const FALLBACK_NOTES_KEY = 'noteai.fallback.notes'
const FALLBACK_TIMEMAP_NOTES_KEY = 'noteai.fallback.timemap-notes'
const FALLBACK_NOTE_VERSIONS_KEY = 'noteai.fallback.note-versions'
const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i
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

const isStorageAvailable = () => Boolean(window.noteai?.storage)
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

const fallbackLoadTodos = (): TodoItem[] => {
  const raw = localStorage.getItem(FALLBACK_TODOS_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      ...(item as TodoItem),
      dueAt:
        item && typeof item === 'object' && 'dueAt' in item
          ? ((item as { dueAt?: string | null }).dueAt ?? null)
          : null,
      recurrence:
        item && typeof item === 'object' && 'recurrence' in item
          ? ((item as { recurrence?: TodoItem['recurrence'] }).recurrence ?? 'none')
          : 'none',
      tags:
        item && typeof item === 'object' && 'tags' in item
          ? (((item as { tags?: string[] }).tags ?? []) as string[])
          : [],
      project:
        item && typeof item === 'object' && 'project' in item
          ? ((item as { project?: string }).project ?? '')
          : '',
      linkedNoteId:
        item && typeof item === 'object' && 'linkedNoteId' in item
          ? ((item as { linkedNoteId?: string | null }).linkedNoteId ?? null)
          : null,
    }))
  } catch {
    return []
  }
}

const fallbackSaveTodos = (todos: TodoItem[]) => {
  localStorage.setItem(FALLBACK_TODOS_KEY, JSON.stringify(todos))
}

const fallbackLoadLocalSettings = (): LocalSettings => {
  const raw = localStorage.getItem(FALLBACK_LOCAL_SETTINGS_KEY)
  if (!raw) return DEFAULT_LOCAL_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<LocalSettings>
    const merged = {
      ...DEFAULT_LOCAL_SETTINGS,
      ...parsed,
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
  } catch {
    return DEFAULT_LOCAL_SETTINGS
  }
}

const fallbackSaveLocalSettings = (settings: LocalSettings): LocalSettings => {
  const merged = {
    ...DEFAULT_LOCAL_SETTINGS,
    ...settings,
  }
  const normalized: LocalSettings = {
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
  localStorage.setItem(FALLBACK_LOCAL_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

const defaultConsents: AppConsents = {
  tosAcceptedAt: null,
  privacyAcceptedAt: null,
  cloudBackupConsentAt: null,
}

const fallbackLoadConsents = (): AppConsents => {
  const raw = localStorage.getItem(FALLBACK_CONSENTS_KEY)
  if (!raw) return defaultConsents
  try {
    const parsed = JSON.parse(raw) as Partial<AppConsents>
    return {
      tosAcceptedAt: parsed.tosAcceptedAt ?? null,
      privacyAcceptedAt: parsed.privacyAcceptedAt ?? null,
      cloudBackupConsentAt: parsed.cloudBackupConsentAt ?? null,
    }
  } catch {
    return defaultConsents
  }
}

const fallbackSaveConsents = (consents: AppConsents): AppConsents => {
  const normalized: AppConsents = {
    tosAcceptedAt: consents.tosAcceptedAt ?? null,
    privacyAcceptedAt: consents.privacyAcceptedAt ?? null,
    cloudBackupConsentAt: consents.cloudBackupConsentAt ?? null,
  }
  localStorage.setItem(FALLBACK_CONSENTS_KEY, JSON.stringify(normalized))
  return normalized
}

const fallbackLoadAccountPreferences = (): Record<string, AccountCloudPreference> => {
  const raw = localStorage.getItem(FALLBACK_ACCOUNT_PREFERENCES_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, AccountCloudPreference>
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

const fallbackSaveAccountPreferences = (value: Record<string, AccountCloudPreference>) => {
  localStorage.setItem(FALLBACK_ACCOUNT_PREFERENCES_KEY, JSON.stringify(value))
}

const fallbackLoadRestoreDecisions = (): Record<string, RestoreDecision> => {
  const raw = localStorage.getItem(FALLBACK_RESTORE_DECISIONS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, RestoreDecision>
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

const fallbackSaveRestoreDecisions = (value: Record<string, RestoreDecision>) => {
  localStorage.setItem(FALLBACK_RESTORE_DECISIONS_KEY, JSON.stringify(value))
}

const toTitle = (fileName: string) =>
  fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'New Note'

const fallbackLoadNotes = (): NoteDocument[] => {
  const raw = localStorage.getItem(FALLBACK_NOTES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as NoteDocument[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((note) => ({
      ...note,
      tags: note.tags ?? [],
      project: note.project ?? '',
    }))
  } catch {
    return []
  }
}

const fallbackSaveNotes = (notes: NoteDocument[]) => {
  localStorage.setItem(FALLBACK_NOTES_KEY, JSON.stringify(notes))
}

const fallbackLoadNoteVersions = (): NoteVersion[] => {
  const raw = localStorage.getItem(FALLBACK_NOTE_VERSIONS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as NoteVersion[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const fallbackSaveNoteVersions = (versions: NoteVersion[]) => {
  localStorage.setItem(FALLBACK_NOTE_VERSIONS_KEY, JSON.stringify(versions))
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

const fallbackLoadTimeMapNotes = (): TimeMapNote[] => {
  const raw = localStorage.getItem(FALLBACK_TIMEMAP_NOTES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as TimeMapNote[]
    if (!Array.isArray(parsed)) return []
    return [...parsed]
      .map((note) => ({
        ...note,
        tags: note.tags ?? [],
        project: note.project ?? '',
      }))
      .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  } catch {
    return []
  }
}

const fallbackSaveTimeMapNotes = (notes: TimeMapNote[]) => {
  localStorage.setItem(FALLBACK_TIMEMAP_NOTES_KEY, JSON.stringify(notes))
}

const pickMeta = (note: NoteDocument): NoteFileRecord => ({
  id: note.id,
  title: note.title,
  fileName: note.fileName,
  path: note.path,
  kind: note.kind,
  format: note.format,
  tags: note.tags ?? [],
  project: note.project ?? '',
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
})

export const storageApi = {
  isStorageAvailable,
  getTodos: async (): Promise<TodoItem[]> => {
    if (!isStorageAvailable()) return fallbackLoadTodos()
    const todos = await window.noteai!.storage.getTodos()
    return todos.map((todo) => ({
      ...todo,
      dueAt: todo.dueAt ?? null,
      recurrence: todo.recurrence ?? 'none',
      tags: todo.tags ?? [],
      project: todo.project ?? '',
      linkedNoteId: todo.linkedNoteId ?? null,
    }))
  },
  saveTodos: async (todos: TodoItem[]): Promise<void> => {
    if (!isStorageAvailable()) {
      fallbackSaveTodos(todos)
      return
    }
    await window.noteai!.storage.saveTodos(todos)
  },
  getLocalSettings: async (): Promise<LocalSettings> => {
    if (!isStorageAvailable()) return fallbackLoadLocalSettings()
    const settings = await window.noteai!.storage.getLocalSettings()
    const merged = {
      ...DEFAULT_LOCAL_SETTINGS,
      ...settings,
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
  },
  saveLocalSettings: async (settings: LocalSettings): Promise<LocalSettings> => {
    if (!isStorageAvailable()) return fallbackSaveLocalSettings(settings)
    return window.noteai!.storage.saveLocalSettings(settings)
  },
  getConsents: async (): Promise<AppConsents> => {
    if (!isStorageAvailable()) return fallbackLoadConsents()
    return window.noteai!.storage.getConsents()
  },
  acceptMandatoryConsents: async (): Promise<AppConsents> => {
    if (!isStorageAvailable()) {
      const now = new Date().toISOString()
      const current = fallbackLoadConsents()
      return fallbackSaveConsents({
        tosAcceptedAt: current.tosAcceptedAt ?? now,
        privacyAcceptedAt: current.privacyAcceptedAt ?? now,
        cloudBackupConsentAt: current.cloudBackupConsentAt,
      })
    }
    return window.noteai!.storage.acceptMandatoryConsents()
  },
  grantCloudBackupConsent: async (): Promise<AppConsents> => {
    if (!isStorageAvailable()) {
      const current = fallbackLoadConsents()
      return fallbackSaveConsents({
        ...current,
        cloudBackupConsentAt: current.cloudBackupConsentAt ?? new Date().toISOString(),
      })
    }
    return window.noteai!.storage.grantCloudBackupConsent()
  },
  getAccountCloudPreference: async (uid: string): Promise<AccountCloudPreference> => {
    if (!isStorageAvailable()) {
      const all = fallbackLoadAccountPreferences()
      return (
        all[uid] ?? {
          uid,
          mode: 'unset',
          decidedAt: null,
        }
      )
    }
    return window.noteai!.storage.getAccountCloudPreference(uid)
  },
  setAccountCloudPreference: async (
    uid: string,
    mode: Exclude<AccountCloudMode, 'unset'>,
  ): Promise<AccountCloudPreference> => {
    if (!isStorageAvailable()) {
      const all = fallbackLoadAccountPreferences()
      const updated: AccountCloudPreference = {
        uid,
        mode,
        decidedAt: new Date().toISOString(),
      }
      all[uid] = updated
      fallbackSaveAccountPreferences(all)
      fallbackSaveLocalSettings({
        ...fallbackLoadLocalSettings(),
        cloudBackupEnabled: mode === 'cloud',
      })
      return updated
    }
    return window.noteai!.storage.setAccountCloudPreference(uid, mode)
  },
  hasRestoreDecision: async (uid: string): Promise<boolean> => {
    if (!isStorageAvailable()) {
      const all = fallbackLoadRestoreDecisions()
      return Boolean(all[uid])
    }
    return window.noteai!.storage.hasRestoreDecision(uid)
  },
  markRestoreDecision: async (uid: string, choice: RestoreDecision): Promise<void> => {
    if (!isStorageAvailable()) {
      const all = fallbackLoadRestoreDecisions()
      all[uid] = choice
      fallbackSaveRestoreDecisions(all)
      return
    }
    await window.noteai!.storage.markRestoreDecision(uid, choice)
  },
  getCloudBackupStatus: async (): Promise<CloudBackupStatus> => {
    if (!isStorageAvailable()) {
      return {
        ok: false,
        hasBackup: false,
        hasLocalData: false,
        updatedAt: null,
        error: 'Cloud backup status only available in Electron app',
      }
    }
    return window.noteai!.storage.getCloudBackupStatus()
  },
  resetLocalData: async (): Promise<void> => {
    if (!isStorageAvailable()) {
      fallbackSaveTodos([])
      fallbackSaveNotes([])
      fallbackSaveTimeMapNotes([])
      fallbackSaveNoteVersions([])
      return
    }
    await window.noteai!.storage.resetLocalData()
  },
  getNotes: async (): Promise<NoteFileRecord[]> => {
    if (!isStorageAvailable()) {
      return fallbackLoadNotes().map(pickMeta)
    }
    const notes = await window.noteai!.storage.getNotes()
    return notes.map((note) => ({
      ...note,
      tags: note.tags ?? [],
      project: note.project ?? '',
    }))
  },
  createNote: async (input: CreateNoteInput): Promise<NoteDocument> => {
    if (!isStorageAvailable()) {
      const now = new Date().toISOString()
      const notes = fallbackLoadNotes()
      const fileName = input.fileName || `note-${Date.now()}.md`
      const created: NoteDocument = {
        id: crypto.randomUUID(),
        title: input.title?.trim() || toTitle(fileName),
        fileName,
        path: `browser-localStorage/${fileName}`,
        kind: 'local',
        format: fileName.toLowerCase().endsWith('.md') ? 'markdown' : 'plain',
        tags: [],
        project: '',
        content: input.content ?? '',
        createdAt: now,
        updatedAt: now,
      }
      fallbackSaveNotes([created, ...notes])
      return created
    }
    const created = await window.noteai!.storage.createNote(input)
    return {
      ...created,
      tags: created.tags ?? [],
      project: created.project ?? '',
    }
  },
  loadNote: async (noteId: string): Promise<NoteDocument> => {
    if (!isStorageAvailable()) {
      const found = fallbackLoadNotes().find((item) => item.id === noteId)
      if (!found) throw new Error('Note not found')
      return found
    }
    const note = await window.noteai!.storage.loadNote(noteId)
    return {
      ...note,
      tags: note.tags ?? [],
      project: note.project ?? '',
    }
  },
  saveNote: async (noteId: string, text: string): Promise<SaveNoteResult> => {
    if (!isStorageAvailable()) {
      const notes = fallbackLoadNotes()
      const previous = notes.find((note) => note.id === noteId)
      if (previous) {
        fallbackSaveNoteVersions([
          {
            id: crypto.randomUUID(),
            noteId,
            content: previous.content,
            createdAt: new Date().toISOString(),
          },
          ...fallbackLoadNoteVersions(),
        ])
      }
      const next = notes.map((note) =>
        note.id === noteId
          ? { ...note, content: text, updatedAt: new Date().toISOString() }
          : note,
      )
      fallbackSaveNotes(next)
      const updated = next.find((item) => item.id === noteId)
      return {
        path: updated?.path ?? 'browser-localStorage/note.md',
        updatedAt: updated?.updatedAt ?? new Date().toISOString(),
      }
    }
    return window.noteai!.storage.saveNote(noteId, text)
  },
  renameNote: async (
    noteId: string,
    nextFileName: string,
    nextTitle?: string,
  ): Promise<NoteDocument> => {
    if (!isStorageAvailable()) {
      const notes = fallbackLoadNotes()
      const now = new Date().toISOString()
      let renamed: NoteDocument | null = null
      const next = notes.map((note) => {
        if (note.id !== noteId) return note
        renamed = {
          ...note,
          fileName: nextFileName,
          title: nextTitle?.trim() || toTitle(nextFileName),
          path: `browser-localStorage/${nextFileName}`,
          updatedAt: now,
        }
        return renamed
      })
      fallbackSaveNotes(next)
      if (!renamed) {
        throw new Error('Note not found')
      }
      return renamed
    }
    const renamed = await window.noteai!.storage.renameNote(noteId, nextFileName, nextTitle)
    return {
      ...renamed,
      tags: renamed.tags ?? [],
      project: renamed.project ?? '',
    }
  },
  deleteNote: async (noteId: string): Promise<void> => {
    if (!isStorageAvailable()) {
      const next = fallbackLoadNotes().filter((note) => note.id !== noteId)
      fallbackSaveNotes(next)
      return
    }
    await window.noteai!.storage.deleteNote(noteId)
  },
  openExternalFiles: async (): Promise<OpenExternalFilesResult> => {
    if (!isStorageAvailable()) {
      return { cancelled: true, notes: [] }
    }
    return window.noteai!.storage.openExternalFiles()
  },
  getTimeMapNotes: async (): Promise<TimeMapNote[]> => {
    if (!isStorageAvailable()) return fallbackLoadTimeMapNotes()
    const notes = await window.noteai!.storage.getTimeMapNotes()
    return notes.map((note) => ({
      ...note,
      tags: note.tags ?? [],
      project: note.project ?? '',
    }))
  },
  createTimeMapNote: async (input: CreateTimeMapNoteInput): Promise<TimeMapNote> => {
    if (!isStorageAvailable()) {
      const title = input.title.trim()
      if (!title) {
        throw new Error('Not basligi bos olamaz.')
      }
      const now = new Date().toISOString()
      const created: TimeMapNote = {
        id: crypto.randomUUID(),
        date: toDayKey(input.date),
        title,
        content: input.content?.trim() ?? '',
        tags: input.tags ?? [],
        project: input.project?.trim() ?? '',
        createdAt: now,
        updatedAt: now,
      }
      fallbackSaveTimeMapNotes([created, ...fallbackLoadTimeMapNotes()])
      return created
    }
    return window.noteai!.storage.createTimeMapNote(input)
  },
  updateTimeMapNote: async (input: UpdateTimeMapNoteInput): Promise<TimeMapNote> => {
    if (!isStorageAvailable()) {
      const title = input.title.trim()
      if (!title) {
        throw new Error('Not basligi bos olamaz.')
      }
      const notes = fallbackLoadTimeMapNotes()
      const index = notes.findIndex((note) => note.id === input.id)
      if (index < 0) {
        throw new Error('TimeMap notu bulunamadi.')
      }
      const updated: TimeMapNote = {
        ...notes[index],
        date: toDayKey(input.date),
        title,
        content: input.content.trim(),
        tags: input.tags ?? notes[index].tags ?? [],
        project: input.project?.trim() ?? notes[index].project ?? '',
        updatedAt: new Date().toISOString(),
      }
      const next = [...notes]
      next[index] = updated
      fallbackSaveTimeMapNotes(next)
      return updated
    }
    return window.noteai!.storage.updateTimeMapNote(input)
  },
  deleteTimeMapNote: async (id: string): Promise<void> => {
    if (!isStorageAvailable()) {
      fallbackSaveTimeMapNotes(fallbackLoadTimeMapNotes().filter((note) => note.id !== id))
      return
    }
    await window.noteai!.storage.deleteTimeMapNote(id)
  },
  getNoteVersions: async (noteId: string): Promise<NoteVersion[]> => {
    if (!isStorageAvailable()) {
      return fallbackLoadNoteVersions()
        .filter((version) => version.noteId === noteId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return window.noteai!.storage.getNoteVersions(noteId)
  },
  restoreNoteVersion: async (noteId: string, versionId: string): Promise<NoteDocument> => {
    if (!isStorageAvailable()) {
      const version = fallbackLoadNoteVersions().find(
        (item) => item.noteId === noteId && item.id === versionId,
      )
      if (!version) {
        throw new Error('Versiyon bulunamadi.')
      }
      await storageApi.saveNote(noteId, version.content)
      return storageApi.loadNote(noteId)
    }
    const restored = await window.noteai!.storage.restoreNoteVersion(noteId, versionId)
    return {
      ...restored,
      tags: restored.tags ?? [],
      project: restored.project ?? '',
    }
  },
  syncFromCloud: async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isStorageAvailable()) {
      return { ok: false, error: 'Cloud sync only available in Electron app' }
    }
    return window.noteai!.storage.syncFromCloud()
  },
  exportJson: async (): Promise<ExportJsonResult> => {
    if (!isStorageAvailable()) {
      return {
        ok: false,
        cancelled: false,
        error: 'Export only available in Electron app',
      }
    }
    return window.noteai!.storage.exportJson()
  },
  importJson: async (): Promise<ImportJsonResult> => {
    if (!isStorageAvailable()) {
      return {
        ok: false,
        cancelled: false,
        error: 'Import only available in Electron app',
      }
    }
    return window.noteai!.storage.importJson()
  },
}
