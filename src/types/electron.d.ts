import type { NoteAIApi } from '../../shared/types/ai'
import type { NoteAIDiscordApi } from '../../shared/types/discord'
import type { NoteAuthApi } from '../../shared/types/auth'
import type { NoteAIStorageApi } from '../../shared/types/storage'

declare global {
  interface Window {
    noteai?: {
      ping: () => string
      storage: NoteAIStorageApi
      ai: NoteAIApi
      auth: NoteAuthApi
      discord: NoteAIDiscordApi
    }
  }
}

export {}
