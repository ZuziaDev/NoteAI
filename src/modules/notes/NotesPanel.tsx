import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { aiApi } from '../../lib/aiApi'
import { useI18n } from '../../lib/i18n'
import { semanticIncludes } from '../../lib/semanticSearch'
import { storageApi } from '../../lib/storageApi'
import type { NoteFileRecord, NoteVersion, TodoItem } from '../../../shared/types/storage'

type NotesPanelProps = {
  query: string
}

type NoteTemplate = {
  id: string
  label: string
  fileName: string
  title: string
  content: string
}

type DiffLine = {
  before: string
  after: string
  type: 'same' | 'added' | 'removed' | 'changed'
}

const genericFileNamePattern = /^note-\d+\.md$/i

const normalize = (value: string) => value.trim().toLowerCase()

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    label: 'Toplanti Notu',
    fileName: 'toplanti-notu.md',
    title: 'Toplanti Notu',
    content: `# Toplanti Notu

## Gundem
- 

## Kararlar
- 

## Aksiyonlar
- [ ] 
`,
  },
  {
    id: 'daily-plan',
    label: 'Gunluk Plan',
    fileName: 'gunluk-plan.md',
    title: 'Gunluk Plan',
    content: `# Gunluk Plan

## Oncelikler
1. 
2. 
3. 

## Notlar
- 
`,
  },
  {
    id: 'sprint',
    label: 'Sprint Plani',
    fileName: 'sprint-plani.md',
    title: 'Sprint Plani',
    content: `# Sprint Plani

## Hedefler
- 

## Backlog
- [ ] 

## Riskler
- 
`,
  },
]

const buildLineDiff = (fromText: string, toText: string): DiffLine[] => {
  const fromLines = fromText.split('\n')
  const toLines = toText.split('\n')
  const max = Math.max(fromLines.length, toLines.length)
  const lines: DiffLine[] = []
  for (let index = 0; index < max; index += 1) {
    const before = fromLines[index] ?? ''
    const after = toLines[index] ?? ''
    const type: DiffLine['type'] =
      before === after
        ? 'same'
        : !before
          ? 'added'
          : !after
            ? 'removed'
            : 'changed'
    lines.push({ before, after, type })
  }
  return lines
}

const formatDateTime = (value: string, locale: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const NotesPanel = ({ query }: NotesPanelProps) => {
  const { t, locale, language } = useI18n()
  const [notes, setNotes] = useState<NoteFileRecord[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isBusy, setIsBusy] = useState<null | 'create' | 'open' | 'rename' | 'delete'>(null)
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null)
  const [linkedTodos, setLinkedTodos] = useState<TodoItem[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const templateLabel = (template: NoteTemplate) => {
    if (language !== 'en') return template.label
    if (template.id === 'meeting') return 'Meeting Note'
    if (template.id === 'daily-plan') return 'Daily Plan'
    if (template.id === 'sprint') return 'Sprint Plan'
    return template.label
  }

  const activeMeta = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  )
  const activeText = activeNoteId ? drafts[activeNoteId] ?? '' : ''
  const selectedDiffVersion = useMemo(
    () => versions.find((version) => version.id === diffVersionId) ?? null,
    [versions, diffVersionId],
  )
  const diffLines = useMemo(
    () =>
      selectedDiffVersion
        ? buildLineDiff(selectedDiffVersion.content, activeText)
        : [],
    [selectedDiffVersion, activeText],
  )

  const visibleNotes = useMemo(() => {
    const needle = normalize(query)
    if (!needle) return notes
    return notes.filter((note) =>
      semanticIncludes(
        `${note.title} ${note.fileName} ${note.project} ${note.tags.join(' ')}`,
        needle,
      ),
    )
  }, [notes, query])

  const reloadNotes = async (nextActiveId?: string | null) => {
    const nextNotes = await storageApi.getNotes()
    setNotes(nextNotes)

    const preferred = nextActiveId ?? activeNoteId
    if (preferred && nextNotes.some((note) => note.id === preferred)) {
      setActiveNoteId(preferred)
      return
    }
    setActiveNoteId(nextNotes[0]?.id ?? null)
  }

  const loadDocumentIntoDraft = async (noteId: string) => {
    setIsLoading(true)
    try {
      const document = await storageApi.loadNote(noteId)
      setDrafts((current) => ({
        ...current,
        [document.id]: document.content,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const reloadVersions = async (noteId: string | null) => {
    if (!noteId) {
      setVersions([])
      setDiffVersionId(null)
      return
    }
    const loaded = await storageApi.getNoteVersions(noteId)
    setVersions(loaded)
    setDiffVersionId((current) =>
      current && loaded.some((version) => version.id === current) ? current : null,
    )
  }

  useEffect(() => {
    const bootstrap = async () => {
      const loaded = await storageApi.getNotes()
      setNotes(loaded)
      if (loaded.length > 0) {
        setActiveNoteId(loaded[0].id)
      }
    }

    bootstrap().catch(() => {
      setMessage(t('Notlar yuklenemedi.', 'Notes could not be loaded.'))
    })
  }, [t])

  useEffect(() => {
    if (!activeNoteId) return
    if (drafts[activeNoteId] !== undefined) return

    loadDocumentIntoDraft(activeNoteId).catch(() => {
      setMessage(t('Not icerigi okunamadi.', 'Note content could not be read.'))
    })
  }, [activeNoteId, drafts, t])

  useEffect(() => {
    void reloadVersions(activeNoteId)
  }, [activeNoteId])

  useEffect(() => {
    const loadLinkedTodos = async () => {
      if (!activeMeta) {
        setLinkedTodos([])
        return
      }
      const todos = await storageApi.getTodos()
      setLinkedTodos(todos.filter((todo) => todo.linkedNoteId === activeMeta.id))
    }
    void loadLinkedTodos()
  }, [activeMeta])

  const updateActiveDraft = (text: string) => {
    if (!activeNoteId) return
    setDrafts((current) => ({
      ...current,
      [activeNoteId]: text,
    }))
  }

  const handleCreateNote = async () => {
    setIsBusy('create')
    setMessage(null)
    try {
      const created = await storageApi.createNote({
        fileName: `note-${Date.now()}.md`,
        title: 'New Note',
        content: '',
      })
      setDrafts((current) => ({
        ...current,
        [created.id]: created.content,
      }))
      await reloadNotes(created.id)
      setMessage(`Yeni not olusturuldu: ${created.fileName}`)
    } catch {
      setMessage(t('Yeni not olusturulamadi.', 'New note could not be created.'))
    } finally {
      setIsBusy(null)
    }
  }

  const handleCreateFromTemplate = async (template: NoteTemplate) => {
    setIsBusy('create')
    setMessage(null)
    try {
      const created = await storageApi.createNote({
        fileName: `${Date.now()}-${template.fileName}`,
        title: template.title,
        content: template.content,
      })
      setDrafts((current) => ({
        ...current,
        [created.id]: created.content,
      }))
      await reloadNotes(created.id)
      setMessage(
        t(
          `Sablondan not olusturuldu: ${templateLabel(template)}`,
          `Created from template: ${templateLabel(template)}`,
        ),
      )
    } catch {
      setMessage(
        t(
          'Sablondan not olusturulamadi.',
          'Note could not be created from template.',
        ),
      )
    } finally {
      setIsBusy(null)
    }
  }

  const handleOpenExternalFiles = async () => {
    setIsBusy('open')
    setMessage(null)
    try {
      const result = await storageApi.openExternalFiles()
      if (result.cancelled) {
        setMessage(t('Dosya secimi iptal edildi.', 'File selection cancelled.'))
        return
      }
      const first = result.notes[0]
      await reloadNotes(first?.id ?? undefined)
      setMessage(
        t(
          `${result.notes.length} dosya sekme olarak acildi.`,
          `${result.notes.length} files opened as tabs.`,
        ),
      )
    } catch {
      setMessage(t('Dis dosyalar acilamadi.', 'External files could not be opened.'))
    } finally {
      setIsBusy(null)
    }
  }

  const runAiRename = async (noteId: string, text: string) => {
    const suggestion = await aiApi.suggestNoteFileName(text)
    const renamed = await storageApi.renameNote(
      noteId,
      suggestion.fileName,
      suggestion.title,
    )
    await reloadNotes(renamed.id)
    return renamed
  }

  const handleSaveNote = async () => {
    if (!activeMeta || !activeNoteId) return

    setIsSaving(true)
    setMessage(null)
    try {
      const text = activeText
      let currentMeta = activeMeta

      if (
        currentMeta.kind === 'local' &&
        genericFileNamePattern.test(currentMeta.fileName) &&
        text.trim().length > 0
      ) {
        currentMeta = await runAiRename(activeNoteId, text)
      }

      const saved = await storageApi.saveNote(currentMeta.id, text)
      await reloadNotes(currentMeta.id)
      await reloadVersions(currentMeta.id)
      setMessage(t(`Kaydedildi: ${saved.path}`, `Saved: ${saved.path}`))
    } catch {
      setMessage(t('Not kaydedilemedi.', 'Note could not be saved.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleForceAiRename = async () => {
    if (!activeMeta || !activeNoteId) return
    if (activeMeta.kind !== 'local') {
      setMessage(
        t(
          'Dis dosya AI ile yeniden adlandirilamaz.',
          'External files cannot be renamed by AI.',
        ),
      )
      return
    }

    setIsBusy('rename')
    setMessage(null)
    try {
      const text = activeText
      if (!text.trim()) {
        setMessage(
          t(
            'AI adlandirma icin not bos olamaz.',
            'Note cannot be empty for AI rename.',
          ),
        )
        return
      }
      const renamed = await runAiRename(activeMeta.id, text)
      setMessage(
        t(
          `AI dosya adini guncelledi: ${renamed.fileName}`,
          `AI renamed file: ${renamed.fileName}`,
        ),
      )
    } catch {
      setMessage(t('AI adlandirma basarisiz.', 'AI rename failed.'))
    } finally {
      setIsBusy(null)
    }
  }

  const handleDeleteNote = async () => {
    if (!activeMeta) return
    setIsBusy('delete')
    setMessage(null)
    try {
      await storageApi.deleteNote(activeMeta.id)
      setDrafts((current) => {
        const { [activeMeta.id]: removed, ...rest } = current
        void removed
        return rest
      })
      await reloadNotes(null)
      setMessage(t('Sekme kapatildi.', 'Tab closed.'))
    } catch {
      setMessage(t('Sekme kapatilamadi.', 'Tab could not be closed.'))
    } finally {
      setIsBusy(null)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!activeMeta) return
    setMessage(null)
    setIsSaving(true)
    try {
      const restored = await storageApi.restoreNoteVersion(activeMeta.id, versionId)
      setDrafts((current) => ({
        ...current,
        [restored.id]: restored.content,
      }))
      await reloadNotes(restored.id)
      await reloadVersions(restored.id)
      setMessage(
        t(
          'Secilen versiyon geri yuklendi.',
          'Selected version has been restored.',
        ),
      )
    } catch {
      setMessage(t('Versiyon geri yuklenemedi.', 'Version could not be restored.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Notes</h2>
            <p className="mt-1 text-xs text-slate-300">
              {t('Not Defteri', 'Notebook')} • {visibleNotes.length}{' '}
              {t('sekme', 'tab(s)')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void handleCreateNote()}
              disabled={isBusy !== null || isSaving}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('+ Yeni Sekme', '+ New Tab')}
            </button>
            <button
              onClick={() => void handleOpenExternalFiles()}
              disabled={isBusy !== null || isSaving}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('Dosya Ac', 'Open File')}
            </button>
            <button
              onClick={() => void handleForceAiRename()}
              disabled={!activeMeta || isBusy !== null || isSaving}
              className="rounded-xl border border-cyan-200/35 bg-cyan-300/20 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('AI Isimle', 'AI Rename')}
            </button>
            <button
              onClick={() => setShowPreview((current) => !current)}
              disabled={!activeMeta}
              className={`rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                showPreview
                  ? 'accent-soft'
                  : 'border-white/15 bg-white/10 text-slate-100 hover:bg-white/20'
              }`}
            >
              {showPreview
                ? t('Onizlemeyi Gizle', 'Hide Preview')
                : t('Onizleme', 'Preview')}
            </button>
            <button
              onClick={() => void handleSaveNote()}
              disabled={!activeMeta || isSaving || isBusy !== null}
              className="rounded-xl border border-sky-300/45 bg-sky-300/25 px-3 py-2 text-sm text-sky-100 transition hover:bg-sky-300/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? t('Kaydediliyor...', 'Saving...') : t('Kaydet', 'Save')}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {t('Sablonlar', 'Templates')}
          </p>
          {NOTE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => void handleCreateFromTemplate(template)}
              disabled={isBusy !== null || isSaving}
              className="rounded-lg border border-cyan-200/25 bg-cyan-300/15 px-2.5 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + {templateLabel(template)}
            </button>
          ))}
        </div>

        {message ? <p className="mt-3 text-xs text-cyan-100">{message}</p> : null}
      </header>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              {t('Sekmeler', 'Tabs')}
            </p>
            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
              {visibleNotes.length}
            </span>
          </div>
          <div className="max-h-[500px] space-y-1 overflow-y-auto pr-1">
            {visibleNotes.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                {t('Sekme yok', 'No tabs')}
              </p>
            ) : (
              visibleNotes.map((note) => {
                const selected = note.id === activeNoteId
                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                      selected
                        ? 'accent-soft'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
                    }`}
                    title={note.path}
                  >
                    <p className="truncate font-medium">{note.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {note.fileName}
                    </p>
                  </button>
                )
              })
            )}
          </div>
          <button
            onClick={() => void handleDeleteNote()}
            disabled={!activeMeta || isBusy !== null || isSaving}
            className="mt-3 w-full rounded-lg border border-rose-200/35 bg-rose-300/20 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-300/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('Sekmeyi Kapat', 'Close Tab')}
          </button>
        </aside>

        <div className="space-y-4">
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {activeMeta?.title ?? t('Acik not yok', 'No open note')}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {activeMeta?.fileName ??
                    t(
                      'Yeni sekme olustur veya dis dosya ac.',
                      'Create a new tab or open an external file.',
                    )}
                </p>
              </div>
              {activeMeta ? (
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                  {activeMeta.kind === 'external'
                    ? t('Dis Dosya', 'External File')
                    : t('Yerel Dosya', 'Local File')}
                </span>
              ) : null}
            </div>

            {activeMeta ? (
              <div className="bg-slate-50/95 p-3">
                <textarea
                  value={activeText}
                  onChange={(event) => updateActiveDraft(event.target.value)}
                  placeholder={t('Notunu yaz...', 'Write your note...')}
                  className="notes-editor-textarea h-[430px] w-full resize-none rounded-lg p-3 text-sm outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="max-w-full truncate">{activeMeta.path}</span>
                  <span>{formatDateTime(activeMeta.updatedAt, locale)}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-400">
                {t(
                  'Sekme yok. Yeni sekme olusturabilir veya dis dosya acabilirsin.',
                  'No tab selected. Create a new tab or open an external file.',
                )}
              </div>
            )}
          </article>

          {showPreview ? (
            <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {activeMeta?.format === 'markdown'
                    ? 'Markdown Preview'
                    : t('Metin Onizleme', 'Plain Preview')}
                </p>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/20"
                >
                  {t('Kapat', 'Close')}
                </button>
              </div>
              <div className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                {!activeMeta ? (
                  <p className="text-slate-500">(Onizleme yok)</p>
                ) : activeMeta.format === 'markdown' ? (
                  <div className="markdown-preview space-y-3">
                    <ReactMarkdown>{activeText || t('*Bos not*', '*Empty note*')}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-slate-200">
                    {activeText || t('(Bos not)', '(Empty note)')}
                  </pre>
                )}
              </div>
            </article>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                {t('Versiyon Gecmisi', 'Version History')}
              </p>
              <div className="mt-3 space-y-2">
                {!activeMeta ? (
                  <p className="text-xs text-slate-500">
                    {t('Not secili degil.', 'No note selected.')}
                  </p>
                ) : versions.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t('Henuz kayitli versiyon yok.', 'No saved versions yet.')}
                  </p>
                ) : (
                  versions.slice(0, 10).map((version) => (
                    <div
                      key={version.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{formatDateTime(version.createdAt, locale)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setDiffVersionId((current) =>
                                current === version.id ? null : version.id,
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-slate-200 transition hover:bg-white/20"
                          >
                            {diffVersionId === version.id
                              ? t('Farki Kapat', 'Hide Diff')
                              : t('Farki Gor', 'Show Diff')}
                          </button>
                          <button
                            onClick={() => void handleRestoreVersion(version.id)}
                            disabled={isSaving}
                            className="rounded-lg border border-cyan-200/30 bg-cyan-300/20 px-2 py-1 text-cyan-100 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('Geri Yukle', 'Restore')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedDiffVersion ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                    {t('Versiyon Farki', 'Version Diff')}:{' '}
                    {formatDateTime(selectedDiffVersion.createdAt, locale)}
                  </p>
                  <div className="mt-2 max-h-56 space-y-1 overflow-auto text-xs">
                    {diffLines.map((line, index) => (
                      <div
                        key={`${selectedDiffVersion.id}-${index}`}
                        className={`grid gap-2 rounded-lg border p-2 md:grid-cols-2 ${
                          line.type === 'same'
                            ? 'border-white/5 bg-white/5 text-slate-400'
                            : line.type === 'added'
                              ? 'border-emerald-200/25 bg-emerald-300/10 text-emerald-100'
                              : line.type === 'removed'
                                ? 'border-rose-200/25 bg-rose-300/10 text-rose-100'
                                : 'border-amber-200/25 bg-amber-300/10 text-amber-100'
                        }`}
                      >
                        <pre className="whitespace-pre-wrap">{line.before || ' '}</pre>
                        <pre className="whitespace-pre-wrap">{line.after || ' '}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                {t('Bagli Gorevler', 'Linked Tasks')}
              </p>
              <div className="mt-3 space-y-2">
                {!activeMeta ? (
                  <p className="text-xs text-slate-500">
                    {t('Not secili degil.', 'No note selected.')}
                  </p>
                ) : linkedTodos.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t('Bu nota bagli gorev yok.', 'No tasks linked to this note.')}
                  </p>
                ) : (
                  linkedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100"
                    >
                      <p className={todo.done ? 'line-through opacity-70' : ''}>{todo.title}</p>
                      <p className="mt-0.5 text-[11px] text-amber-200/80">
                        {todo.project || t('Proje yok', 'No project')} • {todo.priority}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-400">{t('Not yukleniyor...', 'Loading note...')}</p>
      ) : null}
    </section>
  )
}
