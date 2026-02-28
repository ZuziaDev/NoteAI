import { create } from 'zustand'
import type { AuthResult, AuthState } from '../../shared/types/auth'
import { authApi } from '../lib/authApi'

type AuthStore = {
  state: AuthState
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

const guestState: AuthState = {
  isAuthenticated: false,
  user: null,
}

export const useAuthStore = create<AuthStore>((set) => ({
  state: guestState,
  loaded: false,
  loading: false,
  load: async () => {
    set({ loading: true })
    try {
      const state = await authApi.getState()
      set({ state, loaded: true, loading: false })
    } catch {
      set({ state: guestState, loaded: true, loading: false })
    }
  },
  signInWithPassword: async (email: string, password: string) => {
    const result = await authApi.signInWithPassword(email, password)
    set({ state: result.state, loaded: true })
    return result
  },
  signUpWithPassword: async (email: string, password: string) => {
    const result = await authApi.signUpWithPassword(email, password)
    set({ state: result.state, loaded: true })
    return result
  },
  signOut: async () => {
    const result = await authApi.signOut()
    set({ state: result.state, loaded: true })
    return result
  },
}))
