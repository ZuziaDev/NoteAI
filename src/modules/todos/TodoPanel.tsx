import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { parseNaturalTodoInput } from '../../lib/naturalTodoParser'
import { semanticIncludes } from '../../lib/semanticSearch'
import { storageApi } from '../../lib/storageApi'
import type {
  NoteFileRecord,
  TodoItem,
  TodoPriority,
  TodoRecurrence,
} from '../../../shared/types/storage'

type TodoPanelProps = {
  query: string
}

type TodoView = 'list' | 'agenda' | 'kanban'
type SnoozePreset = '5m' | '1h' | 'tomorrow'
type TodoTemplate = {
  id: string
  label: string
  title: string
  priority: TodoPriority
  recurrence: TodoRecurrence
  tags: string[]
  project: string
}
type KanbanColumnId = 'backlog' | 'today' | 'planned' | 'done'

const badgeStyles: Record<TodoPriority, string> = {
  Low: 'border-emerald-200/30 bg-emerald-300/20 text-emerald-100',
  Medium: 'border-amber-200/30 bg-amber-300/20 text-amber-100',
  High: 'border-rose-200/35 bg-rose-300/20 text-rose-100',
}

const TODO_TEMPLATES: TodoTemplate[] = [
  {
    id: 'morning-routine',
    label: 'Sabah Rutini',
    title: 'Gunluk sabah plani',
    priority: 'Medium',
    recurrence: 'daily',
    tags: ['rutin', 'sabah'],
    project: 'Kisisel',
  },
  {
    id: 'deep-work',
    label: 'Odak Bloku',
    title: '90 dk derin calisma',
    priority: 'High',
    recurrence: 'none',
    tags: ['odak', 'uretim'],
    project: 'Calisma',
  },
  {
    id: 'weekly-review',
    label: 'Haftalik Gozden Gecirme',
    title: 'Haftalik plan ve degerlendirme',
    priority: 'Medium',
    recurrence: 'weekly',
    tags: ['review', 'plan'],
    project: 'Planlama',
  },
]

const toLocalKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDateKey = (isoValue: string) => {
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return ''
  return toLocalKey(date)
}

const formatDue = (isoValue: string | null, locale: string) => {
  if (!isoValue) return locale === 'en-US' ? 'No date' : 'Tarih yok'
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return locale === 'en-US' ? 'Invalid date' : 'Gecersiz tarih'
  return date.toLocaleString(locale, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isOverdue = (item: TodoItem) =>
  !item.done && item.dueAt !== null && new Date(item.dueAt).getTime() < Date.now()

const getTodayKey = () => toLocalKey(new Date())

const getTomorrowIso = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

const applySnoozePreset = (currentDueAt: string | null, preset: SnoozePreset) => {
  const base = currentDueAt ? new Date(currentDueAt) : new Date()
  if (Number.isNaN(base.getTime())) {
    return null
  }
  if (preset === '5m') {
    base.setMinutes(base.getMinutes() + 5)
  } else if (preset === '1h') {
    base.setHours(base.getHours() + 1)
  } else {
    return getTomorrowIso()
  }
  return base.toISOString()
}

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag, index, arr) => tag && arr.indexOf(tag) === index)
    .slice(0, 10)

const createRecurringCopy = (todo: TodoItem): TodoItem | null => {
  if (todo.recurrence === 'none') return null
  const seed = todo.dueAt ? new Date(todo.dueAt) : new Date()
  if (Number.isNaN(seed.getTime())) return null

  const next = new Date(seed)
  if (todo.recurrence === 'daily') next.setDate(next.getDate() + 1)
  if (todo.recurrence === 'weekly') next.setDate(next.getDate() + 7)
  if (todo.recurrence === 'monthly') next.setMonth(next.getMonth() + 1)

  const now = new Date().toISOString()
  return {
    ...todo,
    id: crypto.randomUUID(),
    done: false,
    dueAt: next.toISOString(),
    createdAt: now,
    updatedAt: now,
  }
}

export const TodoPanel = ({ query }: TodoPanelProps) => {
  const { t, locale } = useI18n()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [notes, setNotes] = useState<NoteFileRecord[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPriority, setDraftPriority] = useState<TodoPriority>('Medium')
  const [draftDueAt, setDraftDueAt] = useState('')
  const [draftRecurrence, setDraftRecurrence] = useState<TodoRecurrence>('none')
  const [draftTags, setDraftTags] = useState('')
  const [draftProject, setDraftProject] = useState('')
  const [draftLinkedNoteId, setDraftLinkedNoteId] = useState('')
  const [draftTemplateId, setDraftTemplateId] = useState('')
  const [naturalInput, setNaturalInput] = useState('')
  const [view, setView] = useState<TodoView>('list')
  const [dragTodoId, setDragTodoId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const recurrenceLabels: Record<TodoRecurrence, string> = {
    none: t('Tek sefer', 'One-time'),
    daily: t('Gunluk', 'Daily'),
    weekly: t('Haftalik', 'Weekly'),
    monthly: t('Aylik', 'Monthly'),
  }

  useEffect(() => {
    const load = async () => {
      const [loadedTodos, loadedNotes] = await Promise.all([
        storageApi.getTodos(),
        storageApi.getNotes(),
      ])
      setTodos(loadedTodos)
      setNotes(loadedNotes)
    }
    load().catch(() =>
      setMessage(t('Gorevler yuklenemedi.', 'Tasks could not be loaded.')),
    )
  }, [t])

  const noteTitleMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const note of notes) {
      map.set(note.id, note.title)
    }
    return map
  }, [notes])

  const persist = async (nextTodos: TodoItem[]) => {
    setTodos(nextTodos)
    await storageApi.saveTodos(nextTodos)
  }

  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalized) return todos
    return todos.filter((item) => {
      const dueText = item.dueAt ? formatDue(item.dueAt, locale).toLowerCase() : ''
      const tags = item.tags.join(' ')
      const linked = item.linkedNoteId ? noteTitleMap.get(item.linkedNoteId) ?? '' : ''
      return semanticIncludes(
        `${item.title} ${item.priority} ${dueText} ${item.project} ${tags} ${linked}`,
        normalized,
      )
    })
  }, [normalized, todos, noteTitleMap, locale])

  const addTodo = async (source?: { title: string; dueAt: string | null; recurrence: TodoRecurrence }) => {
    const title = (source?.title ?? draftTitle).trim()
    if (!title) {
      setMessage(t('Bos gorev eklenemez.', 'Cannot add an empty task.'))
      return
    }

    const now = new Date().toISOString()
    const dueAt =
      source?.dueAt ?? (draftDueAt ? new Date(draftDueAt).toISOString() : null)
    const recurrence = source?.recurrence ?? draftRecurrence
    const nextTodos: TodoItem[] = [
      {
        id: crypto.randomUUID(),
        title,
        priority: draftPriority,
        done: false,
        dueAt,
        recurrence,
        tags: parseTags(draftTags),
        project: draftProject.trim(),
        linkedNoteId: draftLinkedNoteId || null,
        createdAt: now,
        updatedAt: now,
      },
      ...todos,
    ]

    try {
      await persist(nextTodos)
      setDraftTitle('')
      setDraftDueAt('')
      setDraftRecurrence('none')
      setDraftTags('')
      setDraftProject('')
      setDraftLinkedNoteId('')
      setDraftTemplateId('')
      setMessage(t('Gorev kaydedildi.', 'Task saved.'))
    } catch {
      setMessage(t('Gorev kaydedilemedi.', 'Task could not be saved.'))
    }
  }

  const addByNaturalInput = async () => {
    const parsed = parseNaturalTodoInput(naturalInput)
    if (!parsed) {
      setMessage(t('Hizli metin bos olamaz.', 'Quick input cannot be empty.'))
      return
    }
    setNaturalInput('')
    await addTodo(parsed)
  }

  const applyTemplate = (templateId: string) => {
    setDraftTemplateId(templateId)
    const template = TODO_TEMPLATES.find((item) => item.id === templateId)
    if (!template) {
      return
    }
    setDraftTitle(template.title)
    setDraftPriority(template.priority)
    setDraftRecurrence(template.recurrence)
    setDraftTags(template.tags.join(', '))
    setDraftProject(template.project)
    setMessage(
      t(`Sablon uygulandi: ${template.label}`, `Template applied: ${template.label}`),
    )
  }

  const toggleTodo = async (id: string) => {
    const now = new Date().toISOString()
    const original = todos.find((todo) => todo.id === id)
    const nextTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done, updatedAt: now } : todo,
    )

    const becameDone = original && !original.done
    if (becameDone) {
      const recurring = createRecurringCopy({
        ...original,
        done: true,
        updatedAt: now,
      })
      if (recurring) {
        nextTodos.unshift(recurring)
      }
    }

    try {
      await persist(nextTodos)
    } catch {
      setMessage(t('Gorev guncellenemedi.', 'Task could not be updated.'))
    }
  }

  const snoozeTodo = async (id: string, preset: SnoozePreset) => {
    const target = todos.find((todo) => todo.id === id)
    if (!target) {
      return
    }
    const nextDueAt = applySnoozePreset(target.dueAt, preset)
    if (!nextDueAt) {
      setMessage(
        t(
          'Erteleme icin tarih olusturulamadi.',
          'A date could not be created for snooze.',
        ),
      )
      return
    }
    const now = new Date().toISOString()
    const nextTodos = todos.map((todo) =>
      todo.id === id
        ? { ...todo, dueAt: nextDueAt, done: false, updatedAt: now }
        : todo,
    )
    try {
      await persist(nextTodos)
      setMessage(t('Gorev ertelendi.', 'Task snoozed.'))
    } catch {
      setMessage(t('Erteleme basarisiz.', 'Snooze failed.'))
    }
  }

  const moveTodoToColumn = async (id: string, column: KanbanColumnId) => {
    const target = todos.find((todo) => todo.id === id)
    if (!target) {
      return
    }
    const now = new Date().toISOString()
    const todayAtNine = new Date()
    todayAtNine.setHours(9, 0, 0, 0)
    const plannedAtNine = new Date(todayAtNine)
    plannedAtNine.setDate(plannedAtNine.getDate() + 1)

    const patch: Partial<TodoItem> =
      column === 'done'
        ? { done: true }
        : column === 'backlog'
          ? { done: false, dueAt: null }
          : column === 'today'
            ? { done: false, dueAt: todayAtNine.toISOString() }
            : { done: false, dueAt: plannedAtNine.toISOString() }

    const nextTodos = todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            ...patch,
            updatedAt: now,
          }
        : todo,
    )

    try {
      await persist(nextTodos)
    } catch {
      setMessage(t('Kanban tasima basarisiz.', 'Kanban move failed.'))
    }
  }

  const deleteTodo = async (id: string) => {
    const nextTodos = todos.filter((todo) => todo.id !== id)
    try {
      await persist(nextTodos)
    } catch {
      setMessage(t('Gorev silinemedi.', 'Task could not be deleted.'))
    }
  }

  const weeklyBuckets = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(base)
      day.setDate(base.getDate() + index)
      const key = toLocalKey(day)
      return {
        key,
        label: day.toLocaleDateString(locale, {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
        }),
        items: filtered.filter((item) => item.dueAt && toDateKey(item.dueAt) === key),
      }
    })
    const backlog = filtered.filter((item) => !item.dueAt)
    const overdue = filtered.filter((item) => isOverdue(item))
    return { days, backlog, overdue }
  }, [filtered, locale])

  const kanbanColumns = useMemo(() => {
    const todayKey = getTodayKey()
    const columns: Record<KanbanColumnId, { label: string; items: TodoItem[] }> = {
      backlog: { label: 'Backlog', items: [] },
      today: { label: t('Bugun', 'Today'), items: [] },
      planned: { label: t('Planli', 'Planned'), items: [] },
      done: { label: t('Tamamlandi', 'Done'), items: [] },
    }

    for (const todo of filtered) {
      if (todo.done) {
        columns.done.items.push(todo)
        continue
      }
      if (!todo.dueAt) {
        columns.backlog.items.push(todo)
        continue
      }
      const dueKey = toDateKey(todo.dueAt)
      if (dueKey === todayKey) {
        columns.today.items.push(todo)
      } else {
        columns.planned.items.push(todo)
      }
    }
    return columns
  }, [filtered, t])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">
          {t('To-Do + Ajanda', 'To-Do + Agenda')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`rounded-xl border px-3 py-2 text-xs ${
              view === 'list'
                ? 'accent-soft'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            {t('Liste', 'List')}
          </button>
          <button
            onClick={() => setView('agenda')}
            className={`rounded-xl border px-3 py-2 text-xs ${
              view === 'agenda'
                ? 'accent-soft'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            {t('Ajanda', 'Agenda')}
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`rounded-xl border px-3 py-2 text-xs ${
              view === 'kanban'
                ? 'accent-soft'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/15'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="grid gap-2 lg:grid-cols-2">
          <input
            value={naturalInput}
            onChange={(event) => setNaturalInput(event.target.value)}
            placeholder={t('Hizli ekle: "yarin 18:30 spor daily"', 'Quick add: "tomorrow 18:30 gym daily"')}
            className="rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/50"
          />
          <button
            onClick={() => void addByNaturalInput()}
            className="rounded-xl border border-cyan-200/30 bg-cyan-300/20 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/30"
          >
            {t('Hizli Ekle', 'Quick Add')}
          </button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder={t('Yeni gorev...', 'New task...')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
          <input
            type="datetime-local"
            value={draftDueAt}
            onChange={(event) => setDraftDueAt(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
          />
          <select
            value={draftPriority}
            onChange={(event) => setDraftPriority(event.target.value as TodoPriority)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <button
            onClick={() => void addTodo()}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20"
          >
            {t('+ Ekle', '+ Add')}
          </button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-5">
          <select
            value={draftTemplateId}
            onChange={(event) => applyTemplate(event.target.value)}
            className="rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 outline-none"
          >
            <option value="">{t('Sablon sec', 'Select template')}</option>
            {TODO_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
          <select
            value={draftRecurrence}
            onChange={(event) => setDraftRecurrence(event.target.value as TodoRecurrence)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="none">{t('Tek Sefer', 'One-time')}</option>
            <option value="daily">{t('Gunluk', 'Daily')}</option>
            <option value="weekly">{t('Haftalik', 'Weekly')}</option>
            <option value="monthly">{t('Aylik', 'Monthly')}</option>
          </select>
          <input
            value={draftProject}
            onChange={(event) => setDraftProject(event.target.value)}
            placeholder={t('Proje', 'Project')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
          <input
            value={draftTags}
            onChange={(event) => setDraftTags(event.target.value)}
            placeholder="Tag1, tag2"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
          />
          <select
            value={draftLinkedNoteId}
            onChange={(event) => setDraftLinkedNoteId(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">{t('Nota baglama', 'No linked note')}</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title}
              </option>
            ))}
          </select>
        </div>
        {message ? <p className="mt-2 text-xs text-slate-300">{message}</p> : null}
      </div>

      {view === 'list' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      item.done ? 'text-slate-400 line-through' : 'text-slate-100'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-1 text-xs ${
                      isOverdue(item) ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    {formatDue(item.dueAt, locale)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {recurrenceLabels[item.recurrence]}
                    {item.project ? ` • ${item.project}` : ''}
                  </p>
                  {item.tags.length > 0 ? (
                    <p className="mt-1 text-[11px] text-cyan-100/90">#{item.tags.join(' #')}</p>
                  ) : null}
                  {item.linkedNoteId ? (
                    <p className="mt-1 text-[11px] text-amber-100/90">
                      {t('Not', 'Note')}: {noteTitleMap.get(item.linkedNoteId) ?? t('Silinmis not', 'Deleted note')}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`rounded-lg border px-2 py-1 text-xs ${badgeStyles[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{item.done ? t('Tamamlandi', 'Completed') : t('Devam ediyor', 'In progress')}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.done ? (
                    <>
                      <button
                        onClick={() => void snoozeTodo(item.id, '5m')}
                        className="rounded-lg border border-cyan-200/30 bg-cyan-300/15 px-2 py-1 text-cyan-100 transition hover:bg-cyan-300/25"
                      >
                        +5dk
                      </button>
                      <button
                        onClick={() => void snoozeTodo(item.id, '1h')}
                        className="rounded-lg border border-cyan-200/30 bg-cyan-300/15 px-2 py-1 text-cyan-100 transition hover:bg-cyan-300/25"
                      >
                        +1s
                      </button>
                      <button
                        onClick={() => void snoozeTodo(item.id, 'tomorrow')}
                        className="rounded-lg border border-cyan-200/30 bg-cyan-300/15 px-2 py-1 text-cyan-100 transition hover:bg-cyan-300/25"
                      >
                        {t('Yarin', 'Tomorrow')}
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => void toggleTodo(item.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 transition hover:bg-white/15"
                  >
                    {item.done ? t('Geri Al', 'Undo') : t('Tamamla', 'Complete')}
                  </button>
                  <button
                    onClick={() => void deleteTodo(item.id)}
                    className="rounded-lg border border-rose-200/30 bg-rose-300/20 px-2 py-1 text-rose-100 transition hover:bg-rose-300/30"
                  >
                    {t('Sil', 'Delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : view === 'agenda' ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-rose-200/30 bg-rose-300/10 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-rose-100">{t('Geciken', 'Overdue')}</p>
              <p className="mt-2 text-sm text-slate-100">
                {weeklyBuckets.overdue.length} {t('gorev', 'tasks')}
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Backlog</p>
              <p className="mt-2 text-sm text-slate-100">
                {weeklyBuckets.backlog.length} {t('gorev', 'tasks')}
              </p>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {weeklyBuckets.days.map((day) => (
              <article
                key={day.key}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{day.label}</p>
                <div className="mt-2 space-y-2">
                  {day.items.length === 0 ? (
                    <p className="text-xs text-slate-500">{t('Plan yok', 'No plan')}</p>
                  ) : (
                    day.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => void toggleTodo(item.id)}
                        className={`w-full rounded-xl border px-2 py-2 text-left text-xs ${
                          item.done
                            ? 'border-white/10 bg-white/5 text-slate-500 line-through'
                            : 'border-white/10 bg-white/10 text-slate-100'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {(Object.keys(kanbanColumns) as KanbanColumnId[]).map((columnId) => {
            const column = kanbanColumns[columnId]
            return (
              <article
                key={columnId}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const todoId = event.dataTransfer.getData('application/x-noteai-todo')
                  if (todoId) {
                    void moveTodoToColumn(todoId, columnId)
                  }
                  setDragTodoId(null)
                }}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">
                  {column.label} ({column.items.length})
                </p>
                <div className="mt-2 space-y-2">
                  {column.items.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-500">
                      {dragTodoId ? t('Buraya birak', 'Drop here') : t('Kart yok', 'No cards')}
                    </p>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/x-noteai-todo', item.id)
                          setDragTodoId(item.id)
                        }}
                        onDragEnd={() => setDragTodoId(null)}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-100"
                      >
                        <p className={item.done ? 'line-through text-slate-400' : ''}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDue(item.dueAt, locale)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
