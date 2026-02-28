export const STORAGE_CHANNELS = {
  GET_TODOS: 'storage:get-todos',
  SAVE_TODOS: 'storage:save-todos',
  GET_LOCAL_SETTINGS: 'storage:get-local-settings',
  SAVE_LOCAL_SETTINGS: 'storage:save-local-settings',
  GET_CONSENTS: 'storage:get-consents',
  ACCEPT_MANDATORY_CONSENTS: 'storage:accept-mandatory-consents',
  GRANT_CLOUD_BACKUP_CONSENT: 'storage:grant-cloud-backup-consent',
  GET_ACCOUNT_CLOUD_PREFERENCE: 'storage:get-account-cloud-preference',
  SET_ACCOUNT_CLOUD_PREFERENCE: 'storage:set-account-cloud-preference',
  HAS_RESTORE_DECISION: 'storage:has-restore-decision',
  MARK_RESTORE_DECISION: 'storage:mark-restore-decision',
  GET_CLOUD_BACKUP_STATUS: 'storage:get-cloud-backup-status',
  RESET_LOCAL_DATA: 'storage:reset-local-data',
  GET_NOTES: 'storage:get-notes',
  CREATE_NOTE: 'storage:create-note',
  LOAD_NOTE: 'storage:load-note',
  SAVE_NOTE: 'storage:save-note',
  RENAME_NOTE: 'storage:rename-note',
  DELETE_NOTE: 'storage:delete-note',
  OPEN_EXTERNAL_FILES: 'storage:open-external-files',
  GET_TIMEMAP_NOTES: 'storage:get-timemap-notes',
  CREATE_TIMEMAP_NOTE: 'storage:create-timemap-note',
  UPDATE_TIMEMAP_NOTE: 'storage:update-timemap-note',
  DELETE_TIMEMAP_NOTE: 'storage:delete-timemap-note',
  GET_NOTE_VERSIONS: 'storage:get-note-versions',
  RESTORE_NOTE_VERSION: 'storage:restore-note-version',
  SYNC_FROM_CLOUD: 'storage:sync-from-cloud',
  EXPORT_JSON: 'storage:export-json',
  IMPORT_JSON: 'storage:import-json',
} as const

export const AI_CHANNELS = {
  GET_SETTINGS: 'ai:get-settings',
  SAVE_SETTINGS: 'ai:save-settings',
  TEST_CONNECTION: 'ai:test-connection',
  SUGGEST_NOTE_FILENAME: 'ai:suggest-note-filename',
  GET_CHAT_HISTORY: 'ai:get-chat-history',
  CLEAR_CHAT_HISTORY: 'ai:clear-chat-history',
  SEND_CHAT_MESSAGE: 'ai:send-chat-message',
} as const

export const AUTH_CHANNELS = {
  GET_STATE: 'auth:get-state',
  SIGN_IN_PASSWORD: 'auth:sign-in-password',
  SIGN_UP_PASSWORD: 'auth:sign-up-password',
  SIGN_OUT: 'auth:sign-out',
} as const

export const DISCORD_CHANNELS = {
  GET_STATUS: 'discord:get-status',
  SET_PRESENCE: 'discord:set-presence',
  CLEAR_PRESENCE: 'discord:clear-presence',
} as const
