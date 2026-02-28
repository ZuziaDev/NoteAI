import {
  AI_DEFAULT_BASE_URLS,
  AI_DEFAULT_MODELS,
} from '../../../../shared/constants/ai'
import type {
  AIProvider,
  AISettings,
  ConnectionTestResult,
} from '../../../../shared/types/ai'

type AIConversationMessage = {
  role: 'user' | 'assistant'
  text: string
}

const REQUEST_TIMEOUT_MS = 45_000
const MAX_RETRIES = 2
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const withTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const extractErrorMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string') {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('error' in payload) {
    const errorValue = (payload as { error?: unknown }).error
    if (typeof errorValue === 'string') {
      return errorValue
    }
    if (errorValue && typeof errorValue === 'object') {
      const nestedMessage = (errorValue as { message?: unknown }).message
      if (typeof nestedMessage === 'string') {
        return nestedMessage
      }
      return JSON.stringify(errorValue)
    }
  }

  const message = (payload as { message?: unknown }).message
  if (typeof message === 'string') {
    return message
  }

  return null
}

const isRetryableStatus = (status: number) => RETRYABLE_STATUS.has(status)

const formatHttpError = (response: Response, payload: unknown): string => {
  const detail =
    extractErrorMessage(payload) ?? `${response.status} ${response.statusText}`
  return `AI istegi basarisiz (${response.status}): ${detail}`
}

const requestWithRetries = async (
  url: string,
  init: RequestInit,
): Promise<{ response: Response; json: unknown }> => {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await withTimeout(url, init)
      const json = (await response.json().catch(() => null)) as unknown

      if (
        !response.ok &&
        isRetryableStatus(response.status) &&
        attempt < MAX_RETRIES
      ) {
        await sleep(450 * (attempt + 1))
        continue
      }

      return { response, json }
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        await sleep(450 * (attempt + 1))
        continue
      }
    }
  }

  if (
    lastError &&
    typeof lastError === 'object' &&
    'name' in lastError &&
    (lastError as { name?: string }).name === 'AbortError'
  ) {
    throw new Error('AI istegi zaman asimina ugradi.')
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('AI istegi basarisiz.')
}

const ensureSettings = (settings: AISettings): AISettings => {
  const baseUrl = settings.baseUrl.trim() || AI_DEFAULT_BASE_URLS[settings.provider]
  const model = settings.model.trim() || AI_DEFAULT_MODELS[settings.provider]
  return {
    ...settings,
    baseUrl: trimTrailingSlash(baseUrl),
    model,
  }
}

const extractOpenAIText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) return null
  const first = choices[0] as {
    message?: {
      content?: unknown
    }
  }
  const content = first?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    const firstText = content.find(
      (part) => part && typeof part === 'object' && 'text' in part,
    ) as { text?: string } | undefined
    if (typeof firstText?.text === 'string') return firstText.text.trim()
  }
  return null
}

const extractClaudeText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const content = (payload as { content?: unknown }).content
  if (!Array.isArray(content) || content.length === 0) return null
  const textPart = content.find(
    (item) => item && typeof item === 'object' && (item as { type?: string }).type === 'text',
  ) as { text?: string } | undefined
  return typeof textPart?.text === 'string' ? textPart.text.trim() : null
}

const extractGeminiText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const candidates = (payload as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates) || candidates.length === 0) return null

  const firstCandidate = candidates[0] as {
    content?: { parts?: Array<{ text?: unknown }> }
  }
  const parts = firstCandidate?.content?.parts
  if (!Array.isArray(parts) || parts.length === 0) return null
  const text = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim()
  return text || null
}

const ensureAuth = (provider: AIProvider, apiKey: string): string | null => {
  if (provider === 'other') return null
  if (!apiKey.trim()) {
    return 'API key gerekli.'
  }
  return null
}

const requestOpenAICompatible = async (
  settings: AISettings,
  messages: AIConversationMessage[],
  systemPrompt: string,
): Promise<string> => {
  const authError = ensureAuth(settings.provider, settings.apiKey)
  if (authError) {
    throw new Error(authError)
  }

  if (!settings.baseUrl) {
    throw new Error('Base URL gerekli.')
  }

  const endpoint = `${settings.baseUrl}/chat/completions`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (settings.apiKey.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`
  }

  const payload = {
    model: settings.model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((message) => ({
        role: message.role,
        content: message.text,
      })),
    ],
  }

  const { response, json } = await requestWithRetries(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(formatHttpError(response, json))
  }

  const text = extractOpenAIText(json)
  if (!text) {
    throw new Error('AI cevabi okunamadi.')
  }

  return text
}

const requestClaude = async (
  settings: AISettings,
  messages: AIConversationMessage[],
  systemPrompt: string,
): Promise<string> => {
  const authError = ensureAuth(settings.provider, settings.apiKey)
  if (authError) {
    throw new Error(authError)
  }

  if (!settings.baseUrl) {
    throw new Error('Base URL gerekli.')
  }

  const endpoint = `${settings.baseUrl}/messages`
  const payload = {
    model: settings.model,
    max_tokens: 900,
    system: systemPrompt,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.text,
    })),
  }

  const { response, json } = await requestWithRetries(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(formatHttpError(response, json))
  }

  const text = extractClaudeText(json)
  if (!text) {
    throw new Error('AI cevabi okunamadi.')
  }

  return text
}

const requestGemini = async (
  settings: AISettings,
  messages: AIConversationMessage[],
  systemPrompt: string,
): Promise<string> => {
  if (!settings.apiKey.trim()) {
    throw new Error('API key gerekli.')
  }
  if (!settings.baseUrl) {
    throw new Error('Base URL gerekli.')
  }

  const endpoint = `${settings.baseUrl}/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`
  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text }],
    })),
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 900,
    },
  }

  const { response, json } = await requestWithRetries(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(formatHttpError(response, json))
  }

  const text = extractGeminiText(json)
  if (!text) {
    throw new Error('AI cevabi okunamadi.')
  }

  return text
}

export const requestAIMessage = async (
  inputSettings: AISettings,
  messages: AIConversationMessage[],
  systemPrompt: string,
): Promise<string> => {
  const settings = ensureSettings(inputSettings)

  if (settings.provider === 'claude') {
    return requestClaude(settings, messages, systemPrompt)
  }
  if (settings.provider === 'gemini') {
    return requestGemini(settings, messages, systemPrompt)
  }
  return requestOpenAICompatible(settings, messages, systemPrompt)
}

export const testAIConnection = async (
  inputSettings: AISettings,
): Promise<ConnectionTestResult> => {
  const settings = ensureSettings(inputSettings)

  try {
    const reply = await requestAIMessage(
      settings,
      [{ role: 'user', text: 'Sadece "OK" yaz.' }],
      'Kisa cevap ver.',
    )
    return {
      ok: true,
      message: reply || 'Baglanti basarili.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Baglanti hatasi',
    }
  }
}
