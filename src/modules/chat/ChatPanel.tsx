import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { aiApi } from '../../lib/aiApi'
import { useI18n } from '../../lib/i18n'
import { semanticIncludes } from '../../lib/semanticSearch'
import { storageApi } from '../../lib/storageApi'
import type { ChatMessage } from '../../../shared/types/ai'

type ChatPanelProps = {
  query: string
  summaryTick?: number
  summaryHandledTick?: number
  onSummaryHandled?: (tick: number) => void
}

const createLocalMessage = (
  role: ChatMessage['role'],
  text: string,
): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
  createdAt: new Date().toISOString(),
})

const toTaskTitle = (text: string) => {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  if (!firstLine) {
    return 'AI aksiyon gorevi'
  }
  return firstLine.slice(0, 100)
}

const parseSummaryAndTags = (text: string) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const tagsLine = lines.find((line) => /^tags?:/i.test(line))
  const tags = tagsLine
    ? tagsLine
        .replace(/^tags?:/i, '')
        .split(/[,\s]+/)
        .map((token) => token.replace(/^#/, '').trim().toLowerCase())
        .filter((token, index, arr) => token && arr.indexOf(token) === index)
        .slice(0, 8)
    : []
  const summary = lines
    .filter((line) => !/^tags?:/i.test(line))
    .join('\n')
    .trim()
  return {
    summary: summary || text,
    tags,
  }
}

export const ChatPanel = ({
  query,
  summaryTick = 0,
  summaryHandledTick = 0,
  onSummaryHandled,
}: ChatPanelProps) => {
  const { t } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const createTodoFromMessage = useCallback(async (messageText: string) => {
    const todos = await storageApi.getTodos()
    const now = new Date().toISOString()
    const nextTodos = [
      {
        id: crypto.randomUUID(),
        title: toTaskTitle(messageText),
        priority: 'Medium' as const,
        done: false,
        dueAt: null,
        recurrence: 'none' as const,
        tags: ['chat-action'],
        project: 'AI Chat',
        linkedNoteId: null,
        createdAt: now,
        updatedAt: now,
      },
      ...todos,
    ]
    await storageApi.saveTodos(nextTodos)
    setStatus(t('Mesaj goreve donusturuldu.', 'Message converted to task.'))
  }, [t])

  const saveMessageAsNote = useCallback(async (messageText: string) => {
    const suggestion = await aiApi.suggestNoteFileName(messageText)
    await storageApi.createNote({
      fileName: suggestion.fileName,
      title: suggestion.title,
      content: messageText,
    })
    setStatus(
      t(
        `Mesaj not olarak kaydedildi: ${suggestion.fileName}`,
        `Message saved as note: ${suggestion.fileName}`,
      ),
    )
  }, [t])

  const summarizeAndTagAsNote = useCallback(async (messageText: string) => {
    const prompt = [
      'Asagidaki metni kisa ozetle ve 3-6 etiket cikar.',
      'Format:',
      'Summary: ...',
      'Tags: etiket1, etiket2, etiket3',
      '',
      messageText,
    ].join('\n')
    const result = await aiApi.sendChatMessage(prompt)
    if (!result.ok || !result.message) {
      throw new Error(result.error ?? 'AI ozet islemi basarisiz.')
    }
    const parsed = parseSummaryAndTags(result.message.text)
    const markdown = [
      '# AI Ozet',
      '',
      parsed.summary,
      '',
      parsed.tags.length > 0
        ? t(
            `Etiketler: ${parsed.tags.map((tag) => `#${tag}`).join(' ')}`,
            `Tags: ${parsed.tags.map((tag) => `#${tag}`).join(' ')}`,
          )
        : '',
    ]
      .filter(Boolean)
      .join('\n')
    const suggestion = await aiApi.suggestNoteFileName(parsed.summary)
    await storageApi.createNote({
      fileName: suggestion.fileName,
      title: suggestion.title,
      content: markdown,
    })
    setStatus(
      t(
        `Ozet notu olusturuldu: ${suggestion.fileName}`,
        `Summary note created: ${suggestion.fileName}`,
      ),
    )
  }, [t])

  useEffect(() => {
    const load = async () => {
      const history = await aiApi.getChatHistory()
      setMessages(history)
    }

    load().catch(() => {
      setStatus(t('Chat gecmisi yuklenemedi.', 'Chat history could not be loaded.'))
    })
  }, [t])

  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalized) return messages
    return messages.filter((message) =>
      semanticIncludes(message.text, normalized),
    )
  }, [messages, normalized])

  const sendMessage = useCallback(async (value: string) => {
    const text = value.trim()
    if (!text || loading) return

    if (text.startsWith('/todo ')) {
      const commandText = text.slice('/todo '.length).trim()
      if (!commandText) {
        setStatus(t('Komut bos olamaz: /todo metin', 'Command cannot be empty: /todo text'))
        return
      }
      setInput('')
      try {
        await createTodoFromMessage(commandText)
      } catch {
        setStatus(t('Komut islenemedi.', 'Command could not be processed.'))
      }
      return
    }

    const optimistic = createLocalMessage('user', text)
    setMessages((prev) => [...prev, optimistic])
    setInput('')
    setLoading(true)
    setStatus(null)

    try {
      const result = await aiApi.sendChatMessage(text)
      if (!result.ok || !result.message) {
        const errorText = result.error ?? t('AI cevabi alinamadi.', 'AI response unavailable.')
        setStatus(errorText)
        setMessages((prev) => [
          ...prev,
          createLocalMessage('assistant', `Hata: ${errorText}`),
        ])
        return
      }
      setMessages((prev) => [...prev, result.message!])
    } catch (error) {
      const errorText =
        error instanceof Error
          ? error.message
          : t('AI cevabi alinamadi.', 'AI response unavailable.')
      setStatus(errorText)
      setMessages((prev) => [
        ...prev,
        createLocalMessage('assistant', `Hata: ${errorText}`),
      ])
    } finally {
      setLoading(false)
    }
  }, [createTodoFromMessage, loading, t])

  const createSummary = useCallback(async () => {
    await sendMessage(
      t(
        'Notlarimi ve acik gorevlerimi kisaca ozetle. Sonra en iyi 3 aksiyon oner.',
        'Summarize my notes and open tasks briefly, then suggest the best 3 actions.',
      ),
    )
  }, [sendMessage, t])

  const clearHistory = async () => {
    try {
      await aiApi.clearChatHistory()
      setMessages([])
      setStatus(t('Chat gecmisi temizlendi.', 'Chat history cleared.'))
    } catch {
      setStatus(t('Chat gecmisi temizlenemedi.', 'Chat history could not be cleared.'))
    }
  }

  useEffect(() => {
    if (summaryTick === 0 || summaryTick <= summaryHandledTick) return
    onSummaryHandled?.(summaryTick)
    void createSummary()
  }, [summaryTick, summaryHandledTick, onSummaryHandled, createSummary])

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-white">
          {t('AI Sohbet', 'AI Chat')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => void clearHistory()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/15"
          >
            {t('Temizle', 'Clear')}
          </button>
          <button
            onClick={() => void createSummary()}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
          {t('Ozet Uret', 'Generate Summary')}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
        {filtered.length === 0 ? (
          <article className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            {t('Henuz mesaj yok.', 'No messages yet.')}
          </article>
        ) : null}
        {filtered.map((message) => (
          <article
            key={message.id}
            className={`max-w-[85%] rounded-2xl border p-3 text-sm ${
              message.role === 'assistant'
                ? 'self-start border-white/10 bg-white/10 text-slate-100'
                : 'self-end border-cyan-200/35 bg-cyan-300/20 text-cyan-100'
            }`}
          >
            <div className="markdown-preview space-y-2">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
            {message.role === 'assistant' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    void createTodoFromMessage(message.text).catch(() =>
                      setStatus(t('Mesaj goreve cevrilemedi.', 'Message could not be converted to task.')),
                    )
                  }
                  className="rounded-lg border border-amber-200/30 bg-amber-300/20 px-2 py-1 text-xs text-amber-100 transition hover:bg-amber-300/30"
                >
                  {t('Goreve Cevir', 'Convert To Task')}
                </button>
                <button
                  onClick={() =>
                    void saveMessageAsNote(message.text).catch(() =>
                      setStatus(t('Mesaj nota kaydedilemedi.', 'Message could not be saved as note.')),
                    )
                  }
                  className="rounded-lg border border-cyan-200/30 bg-cyan-300/20 px-2 py-1 text-xs text-cyan-100 transition hover:bg-cyan-300/30"
                >
                  {t('Nota Kaydet', 'Save As Note')}
                </button>
                <button
                  onClick={() =>
                    void summarizeAndTagAsNote(message.text).catch((error: unknown) =>
                      setStatus(
                        error instanceof Error
                          ? error.message
                          : t('Ozet ve etiket islemi basarisiz.', 'Summary and tagging failed.'),
                      ),
                    )
                  }
                  className="rounded-lg border border-emerald-200/30 bg-emerald-300/20 px-2 py-1 text-xs text-emerald-100 transition hover:bg-emerald-300/30"
                >
                  {t('Ozet + Etiket', 'Summarize + Tag')}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {status ? <p className="text-xs text-cyan-100">{status}</p> : null}

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void sendMessage(input)
            }
          }}
          placeholder={t("AI'ya bir sey sor... (/todo metin)", "Ask AI something... (/todo text)")}
          className="w-full bg-transparent px-2 text-sm text-slate-100 outline-none placeholder:text-slate-400"
        />
        <button
          onClick={() => void sendMessage(input)}
          disabled={loading}
          className="rounded-xl border border-cyan-200/35 bg-cyan-300/20 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('Bekle...', 'Wait...') : t('Gonder', 'Send')}
        </button>
      </div>
    </section>
  )
}
