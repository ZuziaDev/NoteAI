import type { AIProvider, AISettings } from '../types/ai'

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
  gemini: 'Gemini',
  other: 'Other',
}

export const AI_DEFAULT_BASE_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  other: 'https://api.neuroa.me/v1',
}

export const AI_DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-sonnet-latest',
  gemini: 'gemini-1.5-flash',
  other: 'gpt-5.1',
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: AI_DEFAULT_BASE_URLS.openai,
  model: AI_DEFAULT_MODELS.openai,
  systemPrompt:
    `Sen NoteAI, kullanıcının notlarını analiz edip özetlemek için bir AI asistanısın. Kullanıcıdan gelen notları dikkate alarak, kullanıcının önemli bilgilerini ve özetlerini oluştur. Seni yapan Zuzia Inc.`,
}
