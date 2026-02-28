import { create } from 'zustand'

export type AppSection = 'todos' | 'timemap' | 'notes' | 'chat' | 'focus' | 'settings'

type UIStore = {
  activeSection: AppSection
  searchQuery: string
  chatSummaryTick: number
  chatSummaryHandledTick: number
  setActiveSection: (section: AppSection) => void
  setSearchQuery: (query: string) => void
  triggerChatSummary: () => void
  markChatSummaryHandled: (tick: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeSection: 'todos',
  searchQuery: '',
  chatSummaryTick: 0,
  chatSummaryHandledTick: 0,
  setActiveSection: (section) => set({ activeSection: section }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  triggerChatSummary: () =>
    set((state) => ({ chatSummaryTick: state.chatSummaryTick + 1 })),
  markChatSummaryHandled: (tick) =>
    set((state) =>
      tick > state.chatSummaryHandledTick
        ? { chatSummaryHandledTick: tick }
        : state,
    ),
}))
