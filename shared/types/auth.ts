export type AuthProvider = 'password'

export type AuthUser = {
  uid: string
  email: string
  displayName: string
  provider: AuthProvider
}

export type AuthState = {
  isAuthenticated: boolean
  user: AuthUser | null
}

export type AuthResult = {
  ok: boolean
  state: AuthState
  error?: string
}

export type NoteAuthApi = {
  getState: () => Promise<AuthState>
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>
  signUpWithPassword: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}
