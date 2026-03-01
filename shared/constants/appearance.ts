import type {
  LocalSettings,
  ThemePreset,
  UiStylePreset,
} from '../types/storage'

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  cloudBackupEnabled: false,
  syncConflictStrategy: 'merge',
  themePreset: 'aurora',
  uiStylePreset: 'glass',
  language: 'tr',
  timeMapColors: {
    todo: '#f59e0b',
    notes: '#94a3b8',
    important: '#f43f5e',
  },
  dailyBriefingEnabled: true,
  lastDailyBriefingDate: null,
}

export const THEME_PRESET_LABELS: Record<ThemePreset, string> = {
  aurora: 'Aurora',
  sunset: 'Sunset',
  forest: 'Forest',
  midnight: 'Midnight',
  sand: 'Sand',
  neon: 'Neon',
  ocean: 'Ocean',
  copper: 'Copper',
  mono: 'Mono',
  dawn: 'Dawn',
  ember: 'Ember',
  glacier: 'Glacier',
  royal: 'Royal',
}

export const UI_STYLE_LABELS: Record<UiStylePreset, string> = {
  glass: 'Glass',
  solid: 'Solid',
  outline: 'Outline',
  neon: 'Neon Deck',
  minimal: 'Minimal',
  v02: 'UI v0.2',
}

export const DESIGN_PACKS: Array<{
  id: string
  label: string
  description: string
  themePreset: ThemePreset
  uiStylePreset: UiStylePreset
}> = [
  {
    id: 'classic-aurora',
    label: 'Classic Aurora',
    description: 'Cam efektli dengeli varsayilan gorunum.',
    themePreset: 'aurora',
    uiStylePreset: 'glass',
  },
  {
    id: 'sunset-solid',
    label: 'Sunset Solid',
    description: 'Daha tok paneller ve sicak renk gecisleri.',
    themePreset: 'sunset',
    uiStylePreset: 'solid',
  },
  {
    id: 'forest-outline',
    label: 'Forest Outline',
    description: 'Temiz cizgi odakli sade calisma stili.',
    themePreset: 'forest',
    uiStylePreset: 'outline',
  },
  {
    id: 'neon-lab',
    label: 'Neon Lab',
    description: 'Parlak accent ve teknoloji hissi.',
    themePreset: 'neon',
    uiStylePreset: 'neon',
  },
  {
    id: 'midnight-minimal',
    label: 'Midnight Minimal',
    description: 'Yorgun goz icin dusuk kontrastli minimal arayuz.',
    themePreset: 'midnight',
    uiStylePreset: 'minimal',
  },
  {
    id: 'ocean-glass',
    label: 'Ocean Glass',
    description: 'Serin mavi tonlar ve parlak cam paneller.',
    themePreset: 'ocean',
    uiStylePreset: 'glass',
  },
  {
    id: 'copper-solid',
    label: 'Copper Solid',
    description: 'Bakir tonlu guclu kontrastli panel gorunumu.',
    themePreset: 'copper',
    uiStylePreset: 'solid',
  },
  {
    id: 'mono-minimal',
    label: 'Mono Focus',
    description: 'Renk daginikligini azaltan sade odak modu.',
    themePreset: 'mono',
    uiStylePreset: 'minimal',
  },
  {
    id: 'dawn-v02',
    label: 'Dawn v0.2',
    description: 'Yeni nesil UI v0.2 kartlari ve yumusak sabah tonlari.',
    themePreset: 'dawn',
    uiStylePreset: 'v02',
  },
  {
    id: 'ember-v02',
    label: 'Ember v0.2',
    description: 'Koyu zemin uzerinde ates tonlu vurucu v0.2 arayuz.',
    themePreset: 'ember',
    uiStylePreset: 'v02',
  },
  {
    id: 'glacier-v02',
    label: 'Glacier v0.2',
    description: 'Soguk mavi tonlarla temiz ve yeni stil dashboard hissi.',
    themePreset: 'glacier',
    uiStylePreset: 'v02',
  },
  {
    id: 'royal-v02',
    label: 'Royal v0.2',
    description: 'Derin lacivert ve premium vurgu renkleriyle UI v0.2.',
    themePreset: 'royal',
    uiStylePreset: 'v02',
  },
]
