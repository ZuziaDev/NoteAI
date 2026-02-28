import { Notification } from 'electron'
import { getTodos } from '../storage/localStorage'

type TodoReminderService = {
  start: () => void
  stop: () => void
}

const CHECK_INTERVAL_MS = 60_000
const WINDOW_MS = 30 * 60_000

export const createTodoReminderService = (): TodoReminderService => {
  let timer: NodeJS.Timeout | null = null
  const notified = new Set<string>()

  const run = () => {
    const now = Date.now()
    const todos = getTodos()

    for (const todo of todos) {
      if (todo.done || !todo.dueAt) {
        continue
      }
      const dueMs = new Date(todo.dueAt).getTime()
      if (Number.isNaN(dueMs)) {
        continue
      }
      const diff = dueMs - now
      if (diff < 0 || diff > WINDOW_MS) {
        continue
      }

      const key = `${todo.id}:${todo.dueAt}`
      if (notified.has(key)) {
        continue
      }

      notified.add(key)
      if (Notification.isSupported()) {
        new Notification({
          title: 'NoteAI Hatirlatma',
          body: `${todo.title} (${Math.max(1, Math.round(diff / 60000))} dk icinde)`,
          silent: false,
        }).show()
      }
    }
  }

  return {
    start: () => {
      if (timer) return
      run()
      timer = setInterval(run, CHECK_INTERVAL_MS)
    },
    stop: () => {
      if (!timer) return
      clearInterval(timer)
      timer = null
      notified.clear()
    },
  }
}

