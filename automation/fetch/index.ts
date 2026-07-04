// automation/fetch/index.ts
// ─── Obtención de noticias desde RSS feeds ───────────────────────────────────
// Agrega fuentes configurables. Si una falla, continúa con las demás.
// Produce un array normalizado de RawArticle.

import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'

export interface RawArticle {
  title: string
  url: string
  snippet: string
  source: string
  sourceName: string
  pubDate: string
  weight: number   // factor de la fuente para el ranking
}

// ─── Fetch con timeout ────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, ms = 10_000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'mundial2026-bot/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

// ─── Parser RSS mínimo (sin dependencias externas) ───────────────────────────

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`,
    'i'
  )
  return (xml.match(re)?.[1] ?? '').trim()
}

function cleanHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isRelevant(title: string, snippet: string): boolean {
  return true;
}

function parseRSS(xml: string, sourceName: string, weight: number): RawArticle[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? []
  const results: RawArticle[] = []

  for (const item of items.slice(0, 20)) {
    const title   = cleanHtml(extractTag(item, 'title'))
    const link    = cleanHtml(extractTag(item, 'link') || extractTag(item, 'guid'))
    const desc    = cleanHtml(extractTag(item, 'description'))
    const pubDate = cleanHtml(extractTag(item, 'pubDate'))

    if (!title || !link) continue
    if (!isRelevant(title, desc)) continue

    results.push({
      title,
      url: link,
      snippet: desc.slice(0, 400),
      source: link,
      sourceName,
      pubDate: pubDate || new Date().toISOString(),
      weight,
    })
  }

  return results
}

// ─── Deduplicación por título ────────────────────────────────────────────────

function deduplicateByTitle(articles: RawArticle[]): RawArticle[] {
  const seen = new Map<string, RawArticle>()

  for (const a of articles) {
    // Key: primeros 50 chars del título en minúscula normalizada
    const key = a.title.toLowerCase().slice(0, 50).replace(/[^a-z0-9 ]/g, '')
    if (!seen.has(key)) {
      seen.set(key, a)
    } else {
      // Mantener la de mayor weight (fuente más importante)
      if (a.weight > seen.get(key)!.weight) {
        seen.set(key, { ...a })
      }
    }
  }

  return Array.from(seen.values())
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function fetchNews(): Promise<RawArticle[]> {
  const all: RawArticle[] = []
  let successCount = 0

  for (const feed of CONFIG.rssFeeds) {
    try {
      logger.info(`Fetching RSS: ${feed.name}`)
      const xml = await fetchWithTimeout(feed.url)
      const articles = parseRSS(xml, feed.name, feed.weight)
      logger.success(`${feed.name}: ${articles.length} artículos del Mundial`)
      all.push(...articles)
      successCount++
    } catch (err) {
      logger.warn(`Fuente ${feed.name} falló — continuando sin ella`)
      logger.error('Detalle', err)
    }
  }

  if (successCount === 0) {
    throw new Error('Todas las fuentes RSS fallaron. Abortando.')
  }

  const deduplicated = deduplicateByTitle(all)
  logger.info(`Total artículos únicos del Mundial: ${deduplicated.length}`)
  return deduplicated
}
