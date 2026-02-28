import { ipcMain } from 'electron'
import { DEFAULT_AI_SETTINGS } from '../../../shared/constants/ai'
import { AI_CHANNELS } from '../../../shared/constants/ipc'
import type {
  AISettings,
  ChatMessage,
  NoteFilenameSuggestionResult,
} from '../../../shared/types/ai'
import type { TodoItem } from '../../../shared/types/storage'
import { requestAIMessage, testAIConnection } from '../services/ai/aiClient'
import {
  clearChatHistory,
  getAISettings,
  getChatHistory,
  getNotes,
  getTodos,
  loadNote,
  saveAISettings,
  saveChatHistory,
} from '../services/storage/localStorage'

const MAX_HISTORY = 24
const MAX_TODOS_IN_PROMPT = 30
const MAX_NOTE_CHARS = 6_000
const MAX_NOTES_IN_PROMPT = 4

const handle = <TArgs extends unknown[], TResult>(
  channel: string,
  listener: (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => TResult,
) => {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, listener)
}

const trimSettings = (settings: AISettings): AISettings => ({
  provider: settings.provider,
  apiKey: settings.apiKey.trim(),
  baseUrl: settings.baseUrl.trim(),
  model: settings.model.trim(),
  systemPrompt: settings.systemPrompt.trim(),
})

const sanitizeSettings = (value: AISettings): AISettings => ({
  ...DEFAULT_AI_SETTINGS,
  ...trimSettings(value),
})

const formatTodos = (todos: TodoItem[]) => {
  if (todos.length === 0) return '- Gorev yok'
  return todos
    .slice(0, MAX_TODOS_IN_PROMPT)
    .map((todo) => {
      const status = todo.done ? 'tamamlandi' : 'acik'
      const tags = todo.tags?.length ? ` #${todo.tags.join(' #')}` : ''
      const project = todo.project ? ` [${todo.project}]` : ''
      const recurrence = todo.recurrence && todo.recurrence !== 'none' ? ` <${todo.recurrence}>` : ''
      return `- [${status}] (${todo.priority}) ${todo.title}${project}${recurrence}${tags}`
    })
    .join('\n')
}

const sanitizeBaseName = (input: string) => {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')

  if (!cleaned) return `note-${Date.now()}`
  return cleaned.slice(0, 64)
}

const normalizeSuggestedFileName = (input: string) => {
  const withoutExt = input.replace(/\.[a-z0-9]+$/i, '').trim()
  return `${sanitizeBaseName(withoutExt)}.md`
}

const titleFromFileName = (fileName: string) =>
  fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()

const suggestFallbackName = (text: string): NoteFilenameSuggestionResult => {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  const candidate = firstLine
    ? firstLine.split(/\s+/).slice(0, 8).join(' ')
    : `note-${Date.now()}`
  const fileName = normalizeSuggestedFileName(candidate)
  return {
    ok: true,
    fileName,
    title: titleFromFileName(fileName) || 'New Note',
    reason: 'Fallback adlandirma',
  }
}

const buildNotesContext = async () => {
  const notes = await getNotes()
  const selected = notes.slice(0, MAX_NOTES_IN_PROMPT)
  const chunks: string[] = []
  let consumed = 0

  for (const note of selected) {
    if (consumed >= MAX_NOTE_CHARS) break
    try {
      const document = await loadNote(note.id)
      const remaining = MAX_NOTE_CHARS - consumed
      const snippet = document.content.slice(0, remaining)
      consumed += snippet.length
      chunks.push(`- ${note.title} (${note.fileName})\n${snippet || '(bos)'}`)
    } catch {
      chunks.push(`- ${note.title} (${note.fileName})\n(icerik okunamadi)`)
    }
  }

  return chunks.length > 0 ? chunks.join('\n\n') : '- Not yok'
}

const buildSystemPrompt = (
  todos: TodoItem[],
  notesContext: string,
  customPrompt: string,
) => {
  return [
    customPrompt || 'Kisa, net ve eylem odakli cevap ver.',
    '',
    'Sen NoteAI icindeki asistanisin.',
    'Cevaplari kisa, net ve eylem odakli yaz.',
    'Kullanici isterse gorev/plana cevirmeyi oner.',
    '',
    'Mevcut To-Do verisi:',
    formatTodos(todos),
    '',
    'Mevcut notlar:',
    notesContext,
  ].join('\n')
}

const createMessage = (role: ChatMessage['role'], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
  createdAt: new Date().toISOString(),
})

export const registerAIIpcHandlers = () => {
  handle(AI_CHANNELS.GET_SETTINGS, async () => getAISettings())

  handle(AI_CHANNELS.SAVE_SETTINGS, async (_event, settings: AISettings) => {
    const sanitized = sanitizeSettings(settings)
    return saveAISettings(sanitized)
  })

  handle(AI_CHANNELS.TEST_CONNECTION, async (_event, settings: AISettings) => {
    const sanitized = sanitizeSettings(settings)
    return testAIConnection(sanitized)
  })

  handle(
    AI_CHANNELS.SUGGEST_NOTE_FILENAME,
    async (_event, input: string): Promise<NoteFilenameSuggestionResult> => {
      const text = input.trim()
      if (!text) {
        return suggestFallbackName(input)
      }

      const settings = getAISettings()
      if (!settings.apiKey.trim() && settings.provider !== 'other') {
        return suggestFallbackName(text)
      }

      try {
        const suggestion = await requestAIMessage(
          settings,
          [
            {
              role: 'user',
              text: `Bu nota kisa ve anlamli bir dosya adi oner. Not:\n${text.slice(0, 2500)}`,
            },
          ],
          [
            'Sadece dosya adinin kendisini ver.',
            'Maksimum 6 kelime.',
            'Kebab-case kullan (ornek: weekly-review-plan).',
            'Uzanti yazma.',
          ].join(' '),
        )
        const fileName = normalizeSuggestedFileName(suggestion.split('\n')[0] ?? suggestion)
        return {
          ok: true,
          fileName,
          title: titleFromFileName(fileName) || 'New Note',
          reason: 'AI adlandirma',
        }
      } catch {
        return suggestFallbackName(text)
      }
    },
  )

  handle(AI_CHANNELS.GET_CHAT_HISTORY, async () => getChatHistory())

  handle(AI_CHANNELS.CLEAR_CHAT_HISTORY, async () => {
    clearChatHistory()
  })

  handle(AI_CHANNELS.SEND_CHAT_MESSAGE, async (_event, input: string) => {
    const text = input.trim()
    if (!text) {
      return {
        ok: false,
        error: 'Bos mesaj gonderilemez.',
      }
    }

    const settings = getAISettings()
    const previousHistory = getChatHistory()
    const userMessage = createMessage('user', text)

    const conversation = [...previousHistory, userMessage]
      .slice(-MAX_HISTORY)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }))

    try {
      const [todos, notesContext] = await Promise.all([getTodos(), buildNotesContext()])
      const systemPrompt = buildSystemPrompt(
        todos,
        notesContext,
        settings.systemPrompt,
      )

      const aiText = await requestAIMessage(settings, conversation, systemPrompt)
      const assistantMessage = createMessage('assistant', aiText)
      const nextHistory = [...previousHistory, userMessage, assistantMessage].slice(
        -MAX_HISTORY,
      )
      saveChatHistory(nextHistory)

      return {
        ok: true,
        message: assistantMessage,
      }
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'AI cevabi alinamadi.'
      const isServerSide =
        /AI istegi basarisiz \(5\d\d\)/.test(rawMessage) ||
        rawMessage.toLowerCase().includes('internal server error')
      const failureMessage = isServerSide
        ? `${rawMessage} Sunucu gecici olarak yogun olabilir, tekrar dene veya modeli degistir.`
        : rawMessage
      return {
        ok: false,
        error: failureMessage,
      }
    }
  })
}
