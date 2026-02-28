const TR_REPLACEMENTS: Record<string, string> = {
  c: 'c',
  g: 'g',
  i: 'i',
  o: 'o',
  s: 's',
  u: 'u',
}

const TR_CHAR_MAP: Record<string, string> = {
  '\u00e7': TR_REPLACEMENTS.c,
  '\u011f': TR_REPLACEMENTS.g,
  '\u0131': TR_REPLACEMENTS.i,
  '\u00f6': TR_REPLACEMENTS.o,
  '\u015f': TR_REPLACEMENTS.s,
  '\u00fc': TR_REPLACEMENTS.u,
}

const STOP_WORDS = new Set([
  've',
  'veya',
  'ile',
  'icin',
  'bu',
  'bir',
  'the',
  'a',
  'an',
])

const SYNONYM_GROUPS: string[][] = [
  ['todo', 'task', 'gorev', 'is', 'workitem'],
  ['note', 'not', 'memo', 'dokuman', 'doc'],
  ['chat', 'sohbet', 'mesaj', 'message'],
  ['calendar', 'takvim', 'timemap', 'agenda', 'ajanda'],
  ['high', 'yuksek', 'critical', 'kritik'],
  ['medium', 'orta', 'normal'],
  ['low', 'dusuk'],
  ['done', 'tamam', 'completed', 'bitmis'],
  ['open', 'acik', 'pending', 'bekleyen'],
  ['project', 'proje', 'workspace'],
]

const suffixes = [
  'lar',
  'ler',
  'lari',
  'leri',
  'nin',
  'nın',
  'nun',
  'nun',
  'den',
  'dan',
  'dir',
  'tir',
  'lik',
  'luk',
  'cu',
  'ci',
  'im',
  'in',
  'un',
]

const synonymMap = new Map<string, string>()

for (const group of SYNONYM_GROUPS) {
  const canonical = group[0]
  for (const token of group) {
    synonymMap.set(token, canonical)
  }
}

const foldTurkish = (value: string) =>
  value.replace(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc]/g, (char) => TR_CHAR_MAP[char] ?? char)

const normalizeToken = (value: string) => {
  const lowered = foldTurkish(value.toLowerCase())
  let stemmed = lowered
  for (const suffix of suffixes) {
    if (stemmed.length > suffix.length + 3 && stemmed.endsWith(suffix)) {
      stemmed = stemmed.slice(0, -suffix.length)
      break
    }
  }
  return synonymMap.get(stemmed) ?? stemmed
}

const tokenize = (value: string): string[] => {
  const folded = foldTurkish(value.toLowerCase())
  return folded
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .map((token) => normalizeToken(token))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

const toTokenSet = (value: string) => new Set(tokenize(value))

const isPartialMatch = (token: string, haystack: Set<string>) => {
  if (haystack.has(token)) return true
  for (const candidate of haystack) {
    if (candidate.startsWith(token) || token.startsWith(candidate)) {
      return true
    }
  }
  return false
}

export const semanticScore = (haystackText: string, queryText: string): number => {
  const queryTokens = toTokenSet(queryText)
  if (queryTokens.size === 0) {
    return 1
  }

  const haystackTokens = toTokenSet(haystackText)
  if (haystackTokens.size === 0) {
    return 0
  }

  let overlap = 0
  for (const token of queryTokens) {
    if (isPartialMatch(token, haystackTokens)) {
      overlap += 1
    }
  }

  return overlap / queryTokens.size
}

export const semanticIncludes = (haystackText: string, queryText: string, threshold = 0.34) => {
  const normalizedQuery = queryText.trim()
  if (!normalizedQuery) {
    return true
  }

  const foldedHaystack = foldTurkish(haystackText.toLowerCase())
  const foldedQuery = foldTurkish(normalizedQuery.toLowerCase())
  if (foldedHaystack.includes(foldedQuery)) {
    return true
  }

  return semanticScore(haystackText, normalizedQuery) >= threshold
}

