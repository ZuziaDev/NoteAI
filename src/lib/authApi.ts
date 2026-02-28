import type { AuthResult, AuthState } from '../../shared/types/auth'

const FALLBACK_AUTH_KEY = 'noteai.fallback.auth'

const guestState: AuthState = {
  isAuthenticated: false,
  user: null,
}

const isAvailable = () => Boolean(window.noteai?.auth)

const loadFallbackState = (): AuthState => {
  const raw = localStorage.getItem(FALLBACK_AUTH_KEY)
  if (!raw) return guestState
  try {
    const parsed = JSON.parse(raw) as AuthState
    if (typeof parsed.isAuthenticated !== 'boolean') return guestState
    return parsed
  } catch {
    return guestState
  }
}

const saveFallbackState = (state: AuthState) => {
  localStorage.setItem(FALLBACK_AUTH_KEY, JSON.stringify(state))
}

const fallbackResult = (state: AuthState, error?: string): AuthResult => ({
  ok: !error,
  state,
  error,
})

export const authApi = {
  isAvailable,
  getState: async (): Promise<AuthState> => {
    if (!isAvailable()) return loadFallbackState()
    return window.noteai!.auth.getState()
  },
  signInWithPassword: async (email: string, password: string): Promise<AuthResult> => {
    if (!isAvailable()) {
      return fallbackResult(loadFallbackState(), 'Auth sadece Electron icinde calisir.')
    }
    return window.noteai!.auth.signInWithPassword(email, password)
  },
  signUpWithPassword: async (email: string, password: string): Promise<AuthResult> => {
    if (!isAvailable()) {
      return fallbackResult(loadFallbackState(), 'Auth sadece Electron icinde calisir.')
    }
    return window.noteai!.auth.signUpWithPassword(email, password)
  },
  signOut: async (): Promise<AuthResult> => {
    if (!isAvailable()) {
      saveFallbackState(guestState)
      return fallbackResult(guestState)
    }
    return window.noteai!.auth.signOut()
  },
}
