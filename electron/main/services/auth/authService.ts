import Store from 'electron-store'
import crypto from 'node:crypto'
import type { AuthResult, AuthState, AuthUser } from '../../../../shared/types/auth'
import {
  isFirebaseAdminConfigured,
  readDbPath,
  setDbPath,
  updateDbPath,
} from '../firebase/firebaseAdminService'

type StoredSession = {
  user: AuthUser
  signedInAt: string
}

type AuthStoreSchema = {
  session: StoredSession | null
}

type DbAuthUser = {
  uid: string
  email: string
  emailLower: string
  displayName: string
  passwordSalt: string
  passwordHash: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

const store = new Store<AuthStoreSchema>({
  name: 'noteai-auth',
  defaults: {
    session: null,
  },
})

const AUTH_USERS_ROOT = 'authUsers'
const AUTH_EMAIL_INDEX_ROOT = 'authUsersByEmail'

const guestState = (): AuthState => ({
  isAuthenticated: false,
  user: null,
})

const stateFromSession = (session: StoredSession | null): AuthState => {
  if (!session) return guestState()
  return {
    isAuthenticated: true,
    user: session.user,
  }
}

const clearSession = () => {
  store.set('session', null)
}

const saveSession = (session: StoredSession) => {
  store.set('session', session)
}

const buildSessionFromDbUser = (user: DbAuthUser): StoredSession => {
  const authUser: AuthUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    provider: 'password',
  }
  return {
    user: authUser,
    signedInAt: new Date().toISOString(),
  }
}

const ensureFirebaseConfigured = (): string | null => {
  const status = isFirebaseAdminConfigured()
  if (status.ok) return null
  return status.error ?? 'Firebase admin konfig hatasi.'
}

const cleanEmail = (input: string): string => input.trim()

const normalizeEmail = (input: string): string => cleanEmail(input).toLowerCase()

const emailToIndexKey = (emailLower: string): string =>
  Buffer.from(emailLower, 'utf8').toString('base64url')

const isValidEmail = (value: string): boolean => /.+@.+\..+/.test(value)

const derivePasswordHash = (password: string, salt: string): string => {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

const verifyPassword = (
  password: string,
  salt: string,
  expectedHashHex: string,
): boolean => {
  const computedHex = derivePasswordHash(password, salt)
  const expected = Buffer.from(expectedHashHex, 'hex')
  const computed = Buffer.from(computedHex, 'hex')
  if (expected.length !== computed.length) {
    return false
  }
  return crypto.timingSafeEqual(expected, computed)
}

const defaultDisplayNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0]?.trim() ?? ''
  if (!localPart) return 'NoteAI User'
  return localPart.slice(0, 40)
}

const validateCredentials = (
  email: string,
  password: string,
): { email: string; emailLower: string } | { error: string } => {
  const normalizedEmail = cleanEmail(email)
  const emailLower = normalizeEmail(email)

  if (!normalizedEmail || !password) {
    return { error: 'Email ve sifre gerekli.' }
  }
  if (!isValidEmail(emailLower)) {
    return { error: 'Email formati gecersiz.' }
  }
  if (password.length < 6) {
    return { error: 'Sifre en az 6 karakter olmali.' }
  }
  return { email: normalizedEmail, emailLower }
}

const makeFailure = (error: string): AuthResult => ({
  ok: false,
  state: guestState(),
  error,
})

const buildUserPath = (uid: string) => `${AUTH_USERS_ROOT}/${uid}`
const buildEmailIndexPath = (emailLower: string) =>
  `${AUTH_EMAIL_INDEX_ROOT}/${emailToIndexKey(emailLower)}`

export const getAuthState = async (): Promise<AuthState> => {
  const session = store.get('session')
  return stateFromSession(session)
}

export const getSessionForSync = async (): Promise<StoredSession | null> => {
  return store.get('session')
}

export const signUpWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const configError = ensureFirebaseConfigured()
  if (configError) {
    return makeFailure(configError)
  }

  const validated = validateCredentials(email, password)
  if ('error' in validated) {
    return makeFailure(validated.error)
  }

  try {
    const emailPath = buildEmailIndexPath(validated.emailLower)
    const existingUid = await readDbPath<string>(emailPath)
    if (existingUid) {
      return makeFailure('Bu email zaten kayitli.')
    }

    const now = new Date().toISOString()
    const uid = crypto.randomUUID()
    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = derivePasswordHash(password, salt)

    const authUser: DbAuthUser = {
      uid,
      email: validated.email,
      emailLower: validated.emailLower,
      displayName: defaultDisplayNameFromEmail(validated.email),
      passwordSalt: salt,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    }

    await setDbPath(buildUserPath(uid), authUser)
    await setDbPath(emailPath, uid)
    await updateDbPath(`users/${uid}`, {
      meta: {
        uid,
        email: validated.email,
        displayName: authUser.displayName,
        provider: 'password',
        createdAt: now,
        updatedAt: now,
      },
    })

    const session = buildSessionFromDbUser(authUser)
    saveSession(session)
    return {
      ok: true,
      state: stateFromSession(session),
    }
  } catch (error) {
    return makeFailure(error instanceof Error ? error.message : 'Kayit basarisiz.')
  }
}

export const signInWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const configError = ensureFirebaseConfigured()
  if (configError) {
    return makeFailure(configError)
  }

  const validated = validateCredentials(email, password)
  if ('error' in validated) {
    return makeFailure(validated.error)
  }

  try {
    const uid = await readDbPath<string>(buildEmailIndexPath(validated.emailLower))
    if (!uid) {
      return makeFailure('Email veya sifre hatali.')
    }

    const authUser = await readDbPath<DbAuthUser>(buildUserPath(uid))
    if (!authUser) {
      return makeFailure('Email veya sifre hatali.')
    }
    const passwordOk = verifyPassword(password, authUser.passwordSalt, authUser.passwordHash)
    if (!passwordOk) {
      return makeFailure('Email veya sifre hatali.')
    }

    const now = new Date().toISOString()
    await updateDbPath(buildUserPath(uid), {
      lastLoginAt: now,
      updatedAt: now,
    })

    const session = buildSessionFromDbUser({
      ...authUser,
      lastLoginAt: now,
      updatedAt: now,
    })
    saveSession(session)
    return {
      ok: true,
      state: stateFromSession(session),
    }
  } catch (error) {
    return makeFailure(error instanceof Error ? error.message : 'Giris basarisiz.')
  }
}

export const signOut = async (): Promise<AuthResult> => {
  clearSession()
  return {
    ok: true,
    state: guestState(),
  }
}
