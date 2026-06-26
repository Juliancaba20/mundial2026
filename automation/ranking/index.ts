// automation/ranking/index.ts
// ─── Sistema de puntuación y selección de noticias ───────────────────────────
// Puntúa cada artículo según relevancia y selecciona las mejores.
// Si no hay suficientes noticias relevantes, publica menos (nunca rellena).

import type { RawArticle } from '../fetch/index.ts'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'

// ─── Factores de puntuación ───────────────────────────────────────────────────

const SCORE_FACTORS = {
  // Palabras de alta relevancia para el Mundial
  highRelevance: [
    'gol', 'goles', 'victoria', 'derrota', 'empate', 'clasific',
    'eliminad', 'octavos', '16avos', 'cuartos', 'semifinal', 'final',
    'clasificación', 'grupo', 'puntos', 'tabla',
    'goal', 'win', 'defeat', 'draw', 'qualified', 'eliminated',
    'round of 16', 'quarter', 'semi', 'final',
  ],
  // Equipos de alto interés para público latinoamericano
  latamTeams: [
    'argentina', 'brasil', 'brazil', 'colombia', 'uruguay', 'mexico',
    'méxico', 'ecuador', 'paraguay', 'perú', 'chile', 'venezuela',
    'estados unidos', 'usa', 'panama', 'panamá', 'haití', 'haiti',
  ],
  // Equipos europeos de alto interés general
  topTeams: [
    'españa', 'spain', 'francia', 'france', 'alemania', 'germany',
    'inglaterra', 'england', 'portugal', 'países bajos', 'netherlands',
    'brasil', 'brazil', 'argentina',
  ],
  // Palabras que bajan el score (especulación, mercado de fichajes, etc.)
  lowRelevance: [
    'fichaje', 'transfer', 'rumor', 'rumour', 'especulac',
    'lesión menor', 'entrenamiento', 'amistoso', 'friendly',
  ],
}

function scoreArticle(article: RawArticle, publishedSlugs: string[]): number {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  let score = 0

  // Factor de la fuente (configurado en config.ts)
  score += article.weight * 10

  // Alta relevancia temática
  for (const kw of SCORE_FACTORS.highRelevance) {
    if (text.includes(kw)) score += 8
  }

  // Equipos latinoamericanos (interés prioritario)
  for (const team of SCORE_FACTORS.latamTeams) {
    if (text.includes(team)) score += 6
  }

  // Equipos top europeos
  for (const team of SCORE_FACTORS.topTeams) {
    if (text.includes(team)) score += 4
  }

  // Penalizar especulación / baja relevancia
  for (const kw of SCORE_FACTORS.lowRelevance) {
    if (text.includes(kw)) score -= 10
  }

  // Frescura: penalizar artículos de más de 36h
  try {
    const age = Date.now() - new Date(article.pubDate).getTime()
    const hours = age / (1000 * 60 * 60)
    if (hours > 36) score -= 15
    else if (hours > 24) score -= 5
  } catch {
    // pubDate inválido: no penalizar
  }

  // Penalizar si el slug probable ya fue publicado (deduplicación por score)
  const probableSlug = slugify(article.title)
  if (publishedSlugs.some(s => s.includes(probableSlug.slice(0, 20)))) {
    score -= 50
  }

  return score
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export interface ScoredArticle extends RawArticle {
  score: number
}

export function rankAndSelect(
  articles: RawArticle[],
  publishedSlugs: string[],
  max: number,
  min: number
): ScoredArticle[] {
  // Puntuar todos
  const scored: ScoredArticle[] = articles.map(a => ({
    ...a,
    score: scoreArticle(a, publishedSlugs),
  }))

  // Ordenar por score descendente
  scored.sort((a, b) => b.score - a.score)

  // Filtrar score mínimo (evitar noticias irrelevantes)
  const MIN_SCORE = 5
  const viable = scored.filter(a => a.score >= MIN_SCORE)

  logger.info(`Artículos viables (score ≥ ${MIN_SCORE}): ${viable.length}`)

  if (viable.length < min) {
    logger.warn(`Solo ${viable.length} artículos viables. Mínimo requerido: ${min}. Abortando publicación.`)
    return []
  }

  const selected = viable.slice(0, max)
  logger.info(`Seleccionados para publicar: ${selected.length}`)

  for (const a of selected) {
    logger.info(`  [${a.score.toFixed(0)} pts] ${a.sourceName}: ${a.title.slice(0, 60)}`)
  }

  return selected
}
