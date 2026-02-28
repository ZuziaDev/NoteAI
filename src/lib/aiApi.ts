import { DEFAULT_AI_SETTINGS } from '../../shared/constants/ai'
import type {
  AIChatResult,
  NoteFilenameSuggestionResult,
  AISettings,
  ChatMessage,
  ConnectionTestResult,
} from '../../shared/types/ai'

const FALLBACK_SETTINGS_KEY = 'noteai.fallback.ai-settings'
const FALLBACK_CHAT_KEY = 'noteai.fallback.chat'

const isAvailable = () => Boolean(window.noteai?.ai)

const loadFallbackSettings = (): AISettings => {
  const raw = localStorage.getItem(FALLBACK_SETTINGS_KEY)
  if (!raw) return DEFAULT_AI_SETTINGS
  try {
    const parsed = JSON.parse(raw) as AISettings
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_AI_SETTINGS
  }
}

const saveFallbackSettings = (settings: AISettings): AISettings => {
  localStorage.setItem(FALLBACK_SETTINGS_KEY, JSON.stringify(settings))
  return settings
}

const loadFallbackChatHistory = (): ChatMessage[] => {
  const raw = localStorage.getItem(FALLBACK_CHAT_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ChatMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveFallbackChatHistory = (messages: ChatMessage[]) => {
  localStorage.setItem(FALLBACK_CHAT_KEY, JSON.stringify(messages))
}

const createFallbackMessage = (role: ChatMessage['role'], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
  createdAt: new Date().toISOString(),
})

export const aiApi = {
  isAvailable,
  getSettings: async (): Promise<AISettings> => {
    if (!isAvailable()) return loadFallbackSettings()
    return window.noteai!.ai.getSettings()
  },
  saveSettings: async (settings: AISettings): Promise<AISettings> => {
    if (!isAvailable()) return saveFallbackSettings(settings)
    return window.noteai!.ai.saveSettings(settings)
  },
  testConnection: async (settings: AISettings): Promise<ConnectionTestResult> => {
    if (!isAvailable()) {
      return {
        ok: true,
        message: 'Browser fallback modunda baglanti testi taklit edildi.',
      }
    }
    return window.noteai!.ai.testConnection(settings)
  },
  suggestNoteFileName: async (input: string): Promise<NoteFilenameSuggestionResult> => {
    if (!isAvailable()) {
      const base = input
        .trim()
        .split(/\s+/)
        .slice(0, 6)
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
      const fileName = `${base || `note-${Date.now()}`}.md`
      const title = fileName.replace(/\.md$/i, '').replace(/-/g, ' ')
      return {
        ok: true,
        fileName,
        title,
        reason: 'Browser fallback',
      }
    }
    return window.noteai!.ai.suggestNoteFileName(input)
  },
  getChatHistory: async (): Promise<ChatMessage[]> => {
    if (!isAvailable()) return loadFallbackChatHistory()
    return window.noteai!.ai.getChatHistory()
  },
  clearChatHistory: async (): Promise<void> => {
    if (!isAvailable()) {
      saveFallbackChatHistory([])
      return
    }
    await window.noteai!.ai.clearChatHistory()
  },
  sendChatMessage: async (input: string): Promise<AIChatResult> => {
    if (!isAvailable()) {
      const history = loadFallbackChatHistory()
      const userMessage = createFallbackMessage('user', input.trim())
      const aiMessage = createFallbackMessage(
        'assistant',
        'Electron disinda AI cagri yapilamaz. Uygulamayi .exe olarak ac.',
      )
      saveFallbackChatHistory([...history, userMessage, aiMessage])
      return {
        ok: true,
        message: aiMessage,
      }
    }
    return window.noteai!.ai.sendChatMessage(input)
  },
}
