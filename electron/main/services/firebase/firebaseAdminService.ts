import { initializeApp, cert, getApps, getApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase, type Database } from 'firebase-admin/database'
import { getRuntimeConfigObject, getRuntimeConfigValue } from '../../config/runtimeConfig'

type ServiceAccountLike = {
  type?: string
  project_id?: string
  private_key_id?: string
  private_key?: string
  client_email?: string
  client_id?: string
  auth_uri?: string
  token_uri?: string
  auth_provider_x509_cert_url?: string
  client_x509_cert_url?: string
  universe_domain?: string
}

let cachedDb: Database | null = null

const normalizeServiceAccount = (raw: ServiceAccountLike): ServiceAccount => {
  return {
    ...raw,
    projectId: raw.project_id,
    privateKey: raw.private_key?.replace(/\\n/g, '\n'),
    clientEmail: raw.client_email,
  }
}

const loadServiceAccount = (): ServiceAccount | null => {
  const objectConfig = getRuntimeConfigObject<ServiceAccountLike>('SERVICE_ACCOUNT')
  if (objectConfig) {
    return normalizeServiceAccount(objectConfig)
  }

  const jsonConfig = getRuntimeConfigValue('SERVICE_ACCOUNT_JSON', '')
  if (!jsonConfig) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonConfig) as ServiceAccountLike
    return normalizeServiceAccount(parsed)
  } catch {
    return null
  }
}

const validateServiceAccount = (account: ServiceAccount | null): string | null => {
  if (!account) return 'SERVICE_ACCOUNT tanimli degil.'
  if (!account.projectId) return 'SERVICE_ACCOUNT.project_id eksik.'
  if (!account.clientEmail) return 'SERVICE_ACCOUNT.client_email eksik.'
  if (!account.privateKey) return 'SERVICE_ACCOUNT.private_key eksik.'
  return null
}

const ensureDatabase = (): Database => {
  if (cachedDb) return cachedDb

  const databaseURL = getRuntimeConfigValue('FIREBASE_DATABASE_URL', '').trim()
  if (!databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL tanimli degil.')
  }

  const serviceAccount = loadServiceAccount()
  const serviceError = validateServiceAccount(serviceAccount)
  if (serviceError) {
    throw new Error(serviceError)
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount!),
          databaseURL,
        })

  cachedDb = getDatabase(app)
  return cachedDb
}

const normalizePath = (value: string): string => value.replace(/^\/+|\/+$/g, '')

export const readDbPath = async <T>(dbPath: string): Promise<T | null> => {
  const db = ensureDatabase()
  const snapshot = await db.ref(normalizePath(dbPath)).get()
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.val() as T
}

export const setDbPath = async (dbPath: string, value: unknown): Promise<void> => {
  const db = ensureDatabase()
  await db.ref(normalizePath(dbPath)).set(value)
}

export const updateDbPath = async (
  dbPath: string,
  value: Record<string, unknown>,
): Promise<void> => {
  const db = ensureDatabase()
  await db.ref(normalizePath(dbPath)).update(value)
}

export const removeDbPath = async (dbPath: string): Promise<void> => {
  const db = ensureDatabase()
  await db.ref(normalizePath(dbPath)).remove()
}

export const isFirebaseAdminConfigured = (): { ok: boolean; error?: string } => {
  try {
    ensureDatabase()
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Firebase admin konfig hatasi.',
    }
  }
}
