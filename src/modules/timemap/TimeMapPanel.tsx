import { useEffect, useMemo, useState } from 'react'
import type { NoteFileRecord, TimeMapNote, TodoItem } from '../../../shared/types/storage'
import { useI18n } from '../../lib/i18n'
import { semanticIncludes } from '../../lib/semanticSearch'
import { storageApi } from '../../lib/storageApi'
import { useAppearanceStore } from '../../stores/appearanceStore'

type TimeMapPanelProps = {
  query: string
}

type DayCounters = {
  todos: number
  notes: number
  mapNotes: number
  topItem: {
    kind: 'todo' | 'note' | 'map'
    label: string
    score: number
  } | null
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toLocalDayKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDayKeyFromIso = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return toLocalDayKey(date)
}

const toDisplayDate = (dayKey: string, locale: string) => {
  const date = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dayKey
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

const toDueTime = (isoValue: string | null, locale: string) => {
  if (!isoValue) return locale === 'en-US' ? 'No time' : 'Saat yok'
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return locale === 'en-US' ? 'Invalid' : 'Gecersiz'
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const buildMonthCells = (baseMonth: Date) => {
  const monthStart = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())
  const todayKey = toLocalDayKey(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const key = toLocalDayKey(date)
    return {
      key,
      date,
      inCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: key === todayKey,
    }
  })
}

const normalize = (value: string) => value.trim().toLowerCase()
const IMPORTANT_TODO_KEYWORDS = ['acil', 'urgent', 'kritik', 'critical', 'bug']
const IMPORTANT_NOTE_KEYWORDS = ['acil', 'urgent', 'onemli', 'important', 'kritik']

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const clampLabel = (label: string, max = 18) =>
  label.length > max ? `${label.slice(0, Math.max(0, max - 1)).trimEnd()}…` : label

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag, index, arr) => tag && arr.indexOf(tag) === index)
    .slice(0, 10)

export const TimeMapPanel = ({ query }: TimeMapPanelProps) => {
  const { t, locale, language } = useI18n()
  const localSettings = useAppearanceStore((state) => state.settings)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [notes, setNotes] = useState<NoteFileRecord[]>([])
  const [timeMapNotes, setTimeMapNotes] = useState<TimeMapNote[]>([])
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toLocalDayKey(new Date()))
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTags, setNoteTags] = useState('')
  const [noteProject, setNoteProject] = useState('')
  const [dragTodoId, setDragTodoId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'save' | 'delete'>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = async () => {
    const [loadedTodos, loadedNotes, loadedMapNotes] = await Promise.all([
      storageApi.getTodos(),
      storageApi.getNotes(),
      storageApi.getTimeMapNotes(),
    ])
    setTodos(loadedTodos)
    setNotes(loadedNotes)
    setTimeMapNotes(loadedMapNotes)
  }

  useEffect(() => {
    loadData().catch(() => setMessage(t('TimeMap verisi yuklenemedi.', 'TimeMap data could not be loaded.')))
  }, [t])

  const needle = normalize(query)

  const filteredTodos = useMemo(() => {
    if (!needle) return todos
    return todos.filter((todo) =>
      semanticIncludes(
        `${todo.title} ${todo.priority} ${todo.project} ${todo.tags.join(' ')}`,
        needle,
      ),
    )
  }, [needle, todos])

  const filteredNotes = useMemo(() => {
    if (!needle) return notes
    return notes.filter((note) =>
      semanticIncludes(
        `${note.title} ${note.fileName} ${note.project} ${note.tags.join(' ')}`,
        needle,
      ),
    )
  }, [needle, notes])

  const filteredTimeMapNotes = useMemo(() => {
    if (!needle) return timeMapNotes
    return timeMapNotes.filter((note) =>
      semanticIncludes(
        `${note.title} ${note.content} ${note.project} ${note.tags.join(' ')}`,
        needle,
      ),
    )
  }, [needle, timeMapNotes])

  const monthCells = useMemo(() => buildMonthCells(monthCursor), [monthCursor])

  const counters = useMemo(() => {
    const map = new Map<string, DayCounters>()
    const ensure = (dayKey: string) => {
      const existing = map.get(dayKey)
      if (existing) return existing
      const created: DayCounters = {
        todos: 0,
        notes: 0,
        mapNotes: 0,
        topItem: null,
      }
      map.set(dayKey, created)
      return created
    }

    const setTopItem = (
      dayKey: string,
      candidate: DayCounters['topItem'],
    ) => {
      if (!candidate) return
      const bucket = ensure(dayKey)
      if (!bucket.topItem || candidate.score > bucket.topItem.score) {
        bucket.topItem = candidate
      }
    }

    for (const todo of filteredTodos) {
      const dayKey = toDayKeyFromIso(todo.dueAt)
      if (!dayKey) continue
      const bucket = ensure(dayKey)
      bucket.todos += 1

      const lowered = `${todo.title} ${todo.tags.join(' ')}`.toLowerCase()
      const keywordBoost = IMPORTANT_TODO_KEYWORDS.some((keyword) =>
        lowered.includes(keyword),
      )
      const overdueBoost =
        !todo.done && todo.dueAt && new Date(todo.dueAt).getTime() < Date.now() ? 25 : 0
      const priorityScore =
        todo.priority === 'High' ? 300 : todo.priority === 'Medium' ? 220 : 160
      const donePenalty = todo.done ? -100 : 0
      const score = priorityScore + overdueBoost + (keywordBoost ? 30 : 0) + donePenalty

      setTopItem(dayKey, {
        kind: 'todo',
        label: clampLabel(todo.title),
        score,
      })
    }

    for (const note of filteredNotes) {
      const dayKey = toDayKeyFromIso(note.updatedAt)
      if (!dayKey) continue
      ensure(dayKey).notes += 1

      setTopItem(dayKey, {
        kind: 'note',
        label: clampLabel(note.title),
        score: 90,
      })
    }

    for (const mapNote of filteredTimeMapNotes) {
      const bucket = ensure(mapNote.date)
      bucket.mapNotes += 1
      const lowered = `${mapNote.title} ${mapNote.tags.join(' ')} ${mapNote.content}`.toLowerCase()
      const keywordBoost = IMPORTANT_NOTE_KEYWORDS.some((keyword) =>
        lowered.includes(keyword),
      )
      setTopItem(mapNote.date, {
        kind: 'map',
        label: clampLabel(mapNote.title),
        score: keywordBoost ? 200 : 120,
      })
    }

    return map
  }, [filteredNotes, filteredTimeMapNotes, filteredTodos])

  const dayTodos = useMemo(
    () =>
      filteredTodos.filter((todo) => toDayKeyFromIso(todo.dueAt) === selectedDate),
    [filteredTodos, selectedDate],
  )

  const unscheduledTodos = useMemo(
    () => filteredTodos.filter((todo) => !todo.done && !todo.dueAt),
    [filteredTodos],
  )

  const dayNotes = useMemo(
    () => filteredNotes.filter((note) => toDayKeyFromIso(note.updatedAt) === selectedDate),
    [filteredNotes, selectedDate],
  )

  const dayTimeMapNotes = useMemo(
    () => filteredTimeMapNotes.filter((note) => note.date === selectedDate),
    [filteredTimeMapNotes, selectedDate],
  )
  const selectedDayCounters = counters.get(selectedDate)

  const clearEditor = () => {
    setEditingNoteId(null)
    setNoteTitle('')
    setNoteContent('')
    setNoteTags('')
    setNoteProject('')
  }

  const handleSaveTimeMapNote = async () => {
    const title = noteTitle.trim()
    if (!title) {
      setMessage(t('Takvim notu icin baslik gir.', 'Enter a title for calendar note.'))
      return
    }

    setBusy('save')
    setMessage(null)
    try {
      if (editingNoteId) {
        await storageApi.updateTimeMapNote({
          id: editingNoteId,
          date: selectedDate,
          title,
          content: noteContent,
          tags: parseTags(noteTags),
          project: noteProject.trim(),
        })
        setMessage(t('Takvim notu guncellendi.', 'Calendar note updated.'))
      } else {
        await storageApi.createTimeMapNote({
          date: selectedDate,
          title,
          content: noteContent,
          tags: parseTags(noteTags),
          project: noteProject.trim(),
        })
        setMessage(t('Takvim notu eklendi.', 'Calendar note added.'))
      }
      clearEditor()
      await loadData()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : t('Takvim notu kaydedilemedi.', 'Calendar note could not be saved.'),
      )
    } finally {
      setBusy(null)
    }
  }

  const handleEdit = (note: TimeMapNote) => {
    setEditingNoteId(note.id)
    setSelectedDate(note.date)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setNoteTags(note.tags.join(', '))
    setNoteProject(note.project)
  }

  const handleDelete = async (id: string) => {
    setBusy('delete')
    setMessage(null)
    try {
      await storageApi.deleteTimeMapNote(id)
      if (editingNoteId === id) {
        clearEditor()
      }
      await loadData()
      setMessage(t('Takvim notu silindi.', 'Calendar note deleted.'))
    } catch {
      setMessage(t('Takvim notu silinemedi.', 'Calendar note could not be deleted.'))
    } finally {
      setBusy(null)
    }
  }

  const shiftMonth = (offset: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const moveTodoToDay = async (todoId: string, dayKey: string) => {
    const targetTodo = todos.find((todo) => todo.id === todoId)
    if (!targetTodo) return
    const base = new Date(`${dayKey}T09:00:00`)
    if (targetTodo.dueAt) {
      const old = new Date(targetTodo.dueAt)
      if (!Number.isNaN(old.getTime())) {
        base.setHours(old.getHours(), old.getMinutes(), 0, 0)
      }
    }
    const nextTodos = todos.map((todo) =>
      todo.id === todoId
        ? { ...todo, dueAt: base.toISOString(), updatedAt: new Date().toISOString() }
        : todo,
    )
    setTodos(nextTodos)
    await storageApi.saveTodos(nextTodos)
    setMessage(
      t(
        'Gorev tarihi TimeMap uzerinden guncellendi.',
        'Task date updated via TimeMap.',
      ),
    )
  }

  const goToToday = () => {
    const today = new Date()
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(toLocalDayKey(today))
  }

  const monthTitle = monthCursor.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
  const todoBadgeStyle = {
    borderColor: hexToRgba(localSettings.timeMapColors.todo, 0.55),
    backgroundColor: hexToRgba(localSettings.timeMapColors.todo, 0.2),
    color: localSettings.timeMapColors.todo,
  }
  const notesBadgeStyle = {
    borderColor: hexToRgba(localSettings.timeMapColors.notes, 0.5),
    backgroundColor: hexToRgba(localSettings.timeMapColors.notes, 0.18),
    color: localSettings.timeMapColors.notes,
  }
  const importantBadgeStyle = {
    borderColor: hexToRgba(localSettings.timeMapColors.important, 0.6),
    backgroundColor: hexToRgba(localSettings.timeMapColors.important, 0.22),
    color: localSettings.timeMapColors.important,
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">TimeMap</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/20"
          >
            {t('Onceki', 'Previous')}
          </button>
          <button
            onClick={goToToday}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10"
          >
            {t('Bugun', 'Today')}
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/20"
          >
            {t('Sonraki', 'Next')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-lg text-slate-100">{monthTitle}</p>
          <p className="text-xs text-slate-400">
            {t(
              'To-Do deadline + note guncelleme tarihi + takvim notlari',
              'To-Do deadlines + note update dates + calendar notes',
            )}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <p key={label} className="px-1 py-1 text-center">
              {language === 'en'
                ? label
                : ({ Sun: 'Paz', Mon: 'Pzt', Tue: 'Sal', Wed: 'Car', Thu: 'Per', Fri: 'Cum', Sat: 'Cmt' }[label] ?? label)}
            </p>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            const selected = selectedDate === cell.key
            const day = counters.get(cell.key)
            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(cell.key)}
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const todoId = event.dataTransfer.getData('application/x-noteai-todo')
                  if (todoId) {
                    void moveTodoToDay(todoId, cell.key)
                  }
                  setDragTodoId(null)
                }}
                className={`min-h-[92px] rounded-xl border p-2 text-left transition ${
                  selected
                    ? 'accent-soft'
                    : cell.inCurrentMonth
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-white/5 bg-black/15 text-slate-500 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      cell.isToday && !selected
                        ? 'rounded-md border border-cyan-200/40 px-1.5 py-0.5 text-cyan-100'
                        : ''
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dragTodoId ? (
                    <span className="text-[10px] text-cyan-100/70">Drop</span>
                  ) : null}
                </div>
                <div className="mt-2 space-y-1">
                  {day?.todos ? (
                    <p
                      className="rounded-lg border px-1.5 py-1 text-[11px]"
                      style={todoBadgeStyle}
                    >
                      To-Do: {day.todos}
                    </p>
                  ) : null}
                  {day?.notes ? (
                    <p
                      className="rounded-lg border px-1.5 py-1 text-[11px]"
                      style={notesBadgeStyle}
                    >
                      Notes: {day.notes}
                    </p>
                  ) : null}
                  {day?.topItem ? (
                    <p
                      className="rounded-lg border px-1.5 py-1 text-[11px]"
                      style={importantBadgeStyle}
                      title={day.topItem.label}
                    >
                      {t('Onemli', 'Top')}: {day.topItem.label}
                    </p>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {t('Secili Gun', 'Selected Day')}
          </p>
          <h3 className="mt-2 font-display text-lg text-slate-100">
            {toDisplayDate(selectedDate, locale)}
          </h3>
          {selectedDayCounters?.topItem ? (
            <div
              className="mt-3 inline-flex max-w-full items-center rounded-xl border px-2.5 py-1.5 text-xs"
              style={importantBadgeStyle}
              title={selectedDayCounters.topItem.label}
            >
              <span className="truncate">
                {t('Gunun En Onemlisi', 'Top Item of the Day')}: {selectedDayCounters.topItem.label}
              </span>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-cyan-200/20 bg-cyan-300/10 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">
                {t(
                  'Plansiz Gorevler (TimeMap icin surukle birak)',
                  'Unscheduled Tasks (drag onto TimeMap)',
                )}
              </p>
              <div className="mt-2 space-y-1.5">
                {unscheduledTodos.length === 0 ? (
                  <p className="text-xs text-cyan-100/70">
                    {t('Plansiz acik gorev yok.', 'No unscheduled open tasks.')}
                  </p>
                ) : (
                  unscheduledTodos.slice(0, 10).map((todo) => (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/x-noteai-todo', todo.id)
                        setDragTodoId(todo.id)
                      }}
                      onDragEnd={() => setDragTodoId(null)}
                      className="cursor-grab rounded-lg border border-cyan-200/30 bg-cyan-300/15 px-2 py-1.5 text-xs text-cyan-100 active:cursor-grabbing"
                    >
                      <p>{todo.title}</p>
                      <p className="mt-0.5 text-[11px] text-cyan-100/80">{todo.priority}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-amber-100">To-Do</p>
              <div className="mt-2 space-y-1.5">
                {dayTodos.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t('Bu gunde deadline yok.', 'No deadline on this day.')}
                  </p>
                ) : (
                  dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/x-noteai-todo', todo.id)
                        setDragTodoId(todo.id)
                      }}
                      onDragEnd={() => setDragTodoId(null)}
                      className="rounded-lg border border-amber-200/20 bg-amber-300/10 px-2 py-1.5 text-xs text-amber-100"
                    >
                      <p className={todo.done ? 'line-through opacity-70' : ''}>{todo.title}</p>
                      <p className="mt-0.5 text-[11px] text-amber-200/80">
                        {todo.priority} • {toDueTime(todo.dueAt, locale)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-200">Notes</p>
              <div className="mt-2 space-y-1.5">
                {dayNotes.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t('Bu tarihte note hareketi yok.', 'No note activity on this date.')}
                  </p>
                ) : (
                  dayNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-slate-200"
                    >
                      <p>{note.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{note.fileName}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {t('Takvim Ustu Not', 'Calendar Overlay Note')}
          </p>
          <p className="mt-2 text-sm text-slate-200">{toDisplayDate(selectedDate, locale)}</p>

          <div className="mt-3 space-y-2">
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder={t('Baslik', 'Title')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            <textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder={t('Bu gun icin not...', 'Note for this day...')}
              className="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <input
              value={noteProject}
              onChange={(event) => setNoteProject(event.target.value)}
              placeholder={t('Proje', 'Project')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            <input
              value={noteTags}
              onChange={(event) => setNoteTags(event.target.value)}
              placeholder="Tag1, tag2"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void handleSaveTimeMapNote()}
              disabled={busy !== null}
              className="accent-strong rounded-xl border px-3 py-2 text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'save'
                ? t('Kaydediliyor...', 'Saving...')
                : editingNoteId
                  ? t('Notu Guncelle', 'Update Note')
                  : t('Not Ekle', 'Add Note')}
            </button>
            {editingNoteId ? (
              <button
                onClick={clearEditor}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/15"
              >
                {t('Iptal', 'Cancel')}
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {dayTimeMapNotes.length === 0 ? (
              <p className="text-xs text-slate-500">
                {t('Bu gun icin takvim notu yok.', 'No calendar note for this day.')}
              </p>
            ) : (
              dayTimeMapNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-cyan-200/20 bg-cyan-300/10 p-3 text-xs text-cyan-100"
                >
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-cyan-50/90">{note.content}</p>
                  <p className="mt-1 text-[11px] text-cyan-100/80">
                    {note.project
                      ? t(`Proje: ${note.project}`, `Project: ${note.project}`)
                      : t('Proje yok', 'No project')}
                  </p>
                  {note.tags.length > 0 ? (
                    <p className="mt-1 text-[11px] text-cyan-50/90">#{note.tags.join(' #')}</p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-cyan-100/70">
                    <span>{new Date(note.updatedAt).toLocaleString(locale)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(note)}
                        className="rounded-md border border-cyan-200/30 bg-cyan-300/20 px-2 py-1 transition hover:bg-cyan-300/30"
                      >
                        {t('Duzenle', 'Edit')}
                      </button>
                      <button
                        onClick={() => void handleDelete(note.id)}
                        disabled={busy !== null}
                        className="rounded-md border border-rose-200/30 bg-rose-300/20 px-2 py-1 text-rose-100 transition hover:bg-rose-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t('Sil', 'Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      {message ? <p className="text-xs text-cyan-100">{message}</p> : null}
    </section>
  )
}
