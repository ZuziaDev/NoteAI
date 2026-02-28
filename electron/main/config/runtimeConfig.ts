import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

type RuntimeConfigMap = Record<string, unknown>

let cachedConfig: RuntimeConfigMap | null = null

const coerceMap = (value: unknown): RuntimeConfigMap => {
  if (!value || typeof value !== 'object') {
    return {}
  }
  const map: RuntimeConfigMap = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string') {
      map[key] = raw.trim()
      continue
    }
    if (raw !== undefined) {
      map[key] = raw
    }
  }
  return map
}

const loadConfigFromFile = (filePath: string): RuntimeConfigMap => {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }
    const source = fs.readFileSync(filePath, 'utf-8')
    const sandbox = {
      module: { exports: {} as unknown },
      exports: {} as unknown,
      process: {
        env: process.env,
      },
    }
    vm.runInNewContext(source, sandbox, {
      timeout: 200,
      filename: filePath,
    })
    const moduleExports = (sandbox.module as { exports?: unknown }).exports
    if (moduleExports && typeof moduleExports === 'object') {
      return coerceMap(moduleExports)
    }
    if (sandbox.exports && typeof sandbox.exports === 'object') {
      return coerceMap(sandbox.exports)
    }
    return {}
  } catch {
    return {}
  }
}

const resolveConfig = (): RuntimeConfigMap => {
  if (cachedConfig) {
    return cachedConfig
  }

  const candidates = [
    path.join(process.cwd(), 'config.js'),
    path.join(process.resourcesPath, 'config.js'),
  ]

  const merged: RuntimeConfigMap = {}
  for (const filePath of candidates) {
    const loaded = loadConfigFromFile(filePath)
    for (const [key, value] of Object.entries(loaded)) {
      if (value) {
        merged[key] = value
      }
    }
  }

  cachedConfig = merged
  return merged
}

export const getRuntimeConfigValue = (name: string, fallback = ''): string => {
  const envValue = (process.env[name] ?? '').trim()
  if (envValue) {
    return envValue
  }
  const config = resolveConfig()
  const value = config[name]
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}

export const getRuntimeConfigObject = <T extends object>(name: string): T | null => {
  const config = resolveConfig()
  const value = config[name]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as T
}

export const getRuntimeConfig = (): RuntimeConfigMap => ({ ...resolveConfig() })
