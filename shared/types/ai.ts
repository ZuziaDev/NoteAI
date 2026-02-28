export type AIProvider = 'openai' | 'claude' | 'gemini' | 'other'

export type AISettings = {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  systemPrompt: string
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  createdAt: string
}

export type AIChatResult = {
  ok: boolean
  message?: ChatMessage
  error?: string
}

export type ConnectionTestResult = {
  ok: boolean
  message: string
}

export type NoteFilenameSuggestionResult = {
  ok: boolean
  fileName: string
  title: string
  reason?: string
}

export type NoteAIApi = {
  getSettings: () => Promise<AISettings>
  saveSettings: (settings: AISettings) => Promise<AISettings>
  testConnection: (settings: AISettings) => Promise<ConnectionTestResult>
  suggestNoteFileName: (input: string) => Promise<NoteFilenameSuggestionResult>
  getChatHistory: () => Promise<ChatMessage[]>
  clearChatHistory: () => Promise<void>
  sendChatMessage: (input: string) => Promise<AIChatResult>
}
