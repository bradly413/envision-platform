import registry from '../data/experience-builder-registry.json'

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'want',
  'include',
  'add',
  'use',
  'make',
  'that',
  'this',
])

const CATEGORY_LABELS = {
  animations: 'animation',
  backgrounds: 'background',
  components: 'component',
  'text-animations': 'text animation',
}

const CATEGORY_ORDER = ['backgrounds', 'text-animations', 'animations', 'components']

function hashValue(value = '') {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function formatToken(token = '') {
  return cleanText(token).replace(/-/g, ' ')
}

export function formatRegistryCategoryLabel(category = '') {
  return CATEGORY_LABELS[category] || cleanText(category).replace(/-/g, ' ')
}

export function inferReferenceSite(prompt = '') {
  const match = prompt.match(/https?:\/\/[^\s)]+/i)
  return match ? match[0] : ''
}

function tokenize(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`
      if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3)
      if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2)
      if (token.endsWith('s') && token.length > 3) return token.slice(0, -1)
      return token
    })
    .filter((token) => !STOP_WORDS.has(token))
}

function scoreRegistryEntry(entry, target, promptTokens, promptText) {
  let score = 0
  const reasons = []
  const searchable = [
    entry.title,
    entry.description,
    ...(entry.tags ?? []),
    ...(entry.useCases ?? []),
    ...(entry.placementHints ?? []),
    ...(entry.promptHints ?? []),
  ].join(' ').toLowerCase()
  const searchTokens = new Set(tokenize(searchable))
  const titleTokens = new Set(tokenize(entry.title))

  if (entry.supports.includes(target)) {
    score += 40
    reasons.push(`supports ${target}`)
  } else if (entry.adaptationRequiredFor?.includes(target)) {
    score += 18
    reasons.push(`${target} requires adaptation`)
  } else {
    score -= 25
  }

  score += Math.round((entry.suitability?.[target] ?? 0) * 24)

  for (const token of promptTokens) {
    if (entry.tags?.includes(token)) {
      score += 8
      reasons.push(`tag:${token}`)
      continue
    }

    if (titleTokens.has(token)) {
      score += 7
      reasons.push(`title:${token}`)
      continue
    }

    if (searchTokens.has(token) || searchable.includes(token)) {
      score += 4
      reasons.push(`text:${token}`)
    }
  }

  if (promptText.includes('background') && entry.category === 'backgrounds') {
    score += 10
    reasons.push('category:background')
  }

  if ((promptText.includes('title') || promptText.includes('headline') || promptText.includes('text')) && entry.category === 'text-animations') {
    score += 10
    reasons.push('category:text')
  }

  if ((promptText.includes('animation') || promptText.includes('transition') || promptText.includes('parallax')) && entry.category === 'animations') {
    score += 10
    reasons.push('category:animation')
  }

  if ((promptText.includes('component') || promptText.includes('section') || promptText.includes('card') || promptText.includes('stack')) && entry.category === 'components') {
    score += 10
    reasons.push('category:component')
  }

  if (target === 'presentation') {
    if (entry.interactionModes?.some((mode) => ['static', 'ambient'].includes(mode))) {
      score += 6
      reasons.push('presentation-safe motion')
    }

    if (entry.interactionModes?.some((mode) => ['scroll', 'cursor', 'pointer'].includes(mode))) {
      score -= 8
      reasons.push('interactive timing')
    }
  } else if (entry.interactionModes?.some((mode) => ['scroll', 'cursor', 'pointer'].includes(mode))) {
    score += 6
    reasons.push('interactive portal motion')
  }

  return {score, reasons: [...new Set(reasons)].slice(0, 8)}
}

function createRecommendation(entry, target, score, reasons) {
  const categoryLabel = formatRegistryCategoryLabel(entry.category)
  const directSupport = entry.supports.includes(target)
  const needsAdaptation = entry.adaptationRequiredFor?.includes(target)
  const primaryPlacement = formatToken(entry.placementHints?.[0] || '')
  const interaction = formatToken(entry.interactionModes?.[0] || 'static')
  const supportLabel = directSupport
    ? `${target} ready`
    : needsAdaptation
      ? `adapt for ${target}`
      : `best for ${entry.supports?.[0] || 'other modes'}`

  const rationaleBits = [cleanText(entry.description)]

  if (primaryPlacement) {
    rationaleBits.push(`Best used as a ${primaryPlacement}.`)
  }

  if (needsAdaptation) {
    rationaleBits.push(`Needs frame-safe adaptation before using it in ${target} mode.`)
  } else if (directSupport) {
    rationaleBits.push(`Fits the approved ${target} output without extra adaptation.`)
  }

  return {
    ...entry,
    score,
    reasons,
    categoryLabel,
    supportLabel,
    interactionLabel: interaction,
    placementLabel: primaryPlacement,
    effectMapping: entry.placementHints?.[0] || entry.category,
    target,
    rationale: rationaleBits.join(' '),
  }
}

export function getRegistryOptionsForCategory({category, outputMode = 'portal', limit = 12} = {}) {
  if (!category) return []

  return (registry.items || [])
    .filter((entry) => entry.category === category)
    .map((entry) => {
      const {score, reasons} = scoreRegistryEntry(entry, outputMode, [], '')
      return createRecommendation(entry, outputMode, score, reasons)
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
}

export function pickRegistryRecommendations({prompt = '', outputMode = 'portal', limit = 4, variationSeed = ''}) {
  const promptText = cleanText(prompt).toLowerCase()
  const promptTokens = tokenize(prompt)

  const ranked = (registry.items || [])
    .map((entry) => {
      const {score, reasons} = scoreRegistryEntry(entry, outputMode, promptTokens, promptText)
      return createRecommendation(entry, outputMode, score, reasons)
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  const selected = []
  const categoryCounts = {}
  const seedBase = cleanText(variationSeed) || `${promptText}|${outputMode}`

  for (const category of CATEGORY_ORDER) {
    const pool = ranked.filter((entry) => entry.category === category).slice(0, 4)
    if (!pool.length) continue
    const pickIndex = hashValue(`${seedBase}:${category}`) % pool.length
    const chosen = pool[pickIndex]
    selected.push(chosen)
    categoryCounts[category] = 1
  }

  for (const entry of ranked) {
    if (selected.length >= limit) break
    if (selected.some((item) => item.id === entry.id)) continue
    if ((categoryCounts[entry.category] || 0) >= 2) continue
    selected.push(entry)
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1
  }

  return selected.slice(0, limit)
}
