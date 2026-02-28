import { create } from 'zustand'
import { DEFAULT_LOCAL_SETTINGS } from '../../shared/constants/appearance'
import type { LocalSettings } from '../../shared/types/storage'
import { storageApi } from '../lib/storageApi'

type AppearanceStore = {
  settings: LocalSettings
  loaded: boolean
  loading: boolean
  loadSettings: () => Promise<void>
  saveSettings: (next: LocalSettings) => Promise<LocalSettings>
  patchSettings: (
    patch: Partial<LocalSettings>,
  ) => Promise<LocalSettings | undefined>
}

export const useAppearanceStore = create<AppearanceStore>((set, get) => ({
  settings: DEFAULT_LOCAL_SETTINGS,
  loaded: false,
  loading: false,
  loadSettings: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const loaded = await storageApi.getLocalSettings()
      set({
        settings: {
          ...DEFAULT_LOCAL_SETTINGS,
          ...loaded,
        },
        loaded: true,
        loading: false,
      })
    } catch {
      set({ loaded: true, loading: false })
    }
  },
  saveSettings: async (next: LocalSettings) => {
    const saved = await storageApi.saveLocalSettings(next)
    set({
      settings: {
        ...DEFAULT_LOCAL_SETTINGS,
        ...saved,
      },
      loaded: true,
    })
    return saved
  },
  patchSettings: async (patch: Partial<LocalSettings>) => {
    try {
      const next: LocalSettings = {
        ...get().settings,
        ...patch,
      }
      const saved = await get().saveSettings(next)
      return saved
    } catch {
      return undefined
    }
  },
}))
