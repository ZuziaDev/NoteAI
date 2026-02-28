import type { TodoRecurrence } from '../../shared/types/storage'

export type ParsedTodoInput = {
  title: string
  dueAt: string | null
  recurrence: TodoRecurrence
}

const parseTime = (input: string) => {
  const timeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\b/)
  if (!timeMatch) {
    return null
  }
  const hour = Number(timeMatch[1] ?? '0')
  const minute = Number(timeMatch[2] ?? '0')
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

const parseOffsetDays = (input: string) => {
  const normalized = input.toLowerCase()
  if (normalized.includes('bugun') || normalized.includes('today')) return 0
  if (normalized.includes('yarin') || normalized.includes('tomorrow')) return 1
  if (normalized.includes('haftaya') || normalized.includes('next week')) return 7

  const inDays = normalized.match(/(\d+)\s*(gun|days?)/)
  if (inDays) {
    return Number(inDays[1] ?? '0')
  }
  return null
}

const parseRecurrence = (input: string): TodoRecurrence => {
  const normalized = input.toLowerCase()
  if (normalized.includes('her gun') || normalized.includes('daily')) return 'daily'
  if (normalized.includes('her hafta') || normalized.includes('weekly')) return 'weekly'
  if (normalized.includes('her ay') || normalized.includes('monthly')) return 'monthly'
  return 'none'
}

export const parseNaturalTodoInput = (input: string): ParsedTodoInput | null => {
  const text = input.trim()
  if (!text) return null

  const now = new Date()
  const offsetDays = parseOffsetDays(text)
  const time = parseTime(text)
  let dueAt: string | null = null

  if (offsetDays !== null || time !== null) {
    const target = new Date(now)
    if (offsetDays !== null) {
      target.setDate(target.getDate() + offsetDays)
    }
    if (time) {
      target.setHours(time.hour, time.minute, 0, 0)
    } else {
      target.setHours(9, 0, 0, 0)
    }
    dueAt = target.toISOString()
  }

  const title = text
    .replace(/\b(today|tomorrow|next week|daily|weekly|monthly)\b/gi, '')
    .replace(/\b(bugun|yarin|haftaya|her gun|her hafta|her ay)\b/gi, '')
    .replace(/\b\d{1,2}(:\d{2})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    title: title || text,
    dueAt,
    recurrence: parseRecurrence(text),
  }
}

