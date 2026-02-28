import type { TodoItem } from '../../shared/types/storage'
import type { AppLanguage } from '../../shared/types/storage'

export type DailyBriefing = {
  dateLabel: string
  headline: string
  summaryLines: string[]
  focusItems: string[]
}

const localDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toDate = (value: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const getTodayKey = () => localDateKey(new Date())

export const createDailyBriefing = (
  todos: TodoItem[],
  language: AppLanguage,
): DailyBriefing => {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const yesterday = new Date(todayStart)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayKey = localDateKey(now)
  const yesterdayKey = localDateKey(yesterday)

  const openTodos = todos.filter((todo) => !todo.done)
  const doneYesterday = todos.filter(
    (todo) => todo.done && localDateKey(new Date(todo.updatedAt)) === yesterdayKey,
  )
  const overdue = openTodos.filter((todo) => {
    const due = toDate(todo.dueAt)
    return due !== null && due.getTime() < todayStart.getTime()
  })
  const dueToday = openTodos.filter(
    (todo) => todo.dueAt !== null && localDateKey(new Date(todo.dueAt)) === todayKey,
  )
  const highPriority = openTodos.filter((todo) => todo.priority === 'High')

  const focusCandidates = [...overdue, ...dueToday, ...highPriority]
  const uniqueFocus = Array.from(
    new Map(focusCandidates.map((item) => [item.id, item])).values(),
  ).slice(0, 4)

  const headline =
    overdue.length > 0
      ? language === 'en'
        ? `Good morning. You have ${overdue.length} overdue tasks. Let's clear those first.`
        : `Gunaydin. ${overdue.length} geciken gorev var, once bunlari temizleyelim.`
      : language === 'en'
        ? `Good morning. You have ${dueToday.length} planned tasks for today.`
        : `Gunaydin. Bugun ${dueToday.length} planli gorev var, guclu baslayalim.`

  const summaryLines =
    language === 'en'
      ? [
          `Tasks completed yesterday: ${doneYesterday.length}`,
          `Tasks planned for today: ${dueToday.length}`,
          `Total open tasks: ${openTodos.length}`,
          `Open high-priority tasks: ${highPriority.length}`,
        ]
      : [
          `Dun tamamlanan gorev: ${doneYesterday.length}`,
          `Bugun planlanan gorev: ${dueToday.length}`,
          `Toplam acik gorev: ${openTodos.length}`,
          `High oncelik acik gorev: ${highPriority.length}`,
        ]

  const focusItems =
    uniqueFocus.length > 0
      ? uniqueFocus.map((todo) => `${todo.title} (${todo.priority})`)
      : [
          language === 'en'
            ? 'No focus task yet. You can define a new goal today.'
            : 'Odak gorevi yok. Bugun yeni bir hedef belirleyebilirsin.',
        ]

  return {
    dateLabel: now.toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', {
      weekday: 'long',
      month: 'short',
      day: '2-digit',
    }),
    headline,
    summaryLines,
    focusItems,
  }
}
