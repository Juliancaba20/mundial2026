// automation/generators/article-generator.ts
// ─── Generación de artículos con LLM ─────────────────────────────────────────
// El LLM NUNCA investiga. Solo redacta usando la información de las fuentes.

import type { ScoredArticle } from '../ranking/index.ts'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'
import { createLLMProvider } from './groq-provider.ts'

export interface GeneratedArticle {
  slug: string
  title: string
  category: string
  excerpt: string
  emoji: string
  featured: boolean
  relatedTeamSlugs: string[]
  imageAlt: string
  imagePrompt: string
  body: string
}

const SYSTEM_PROMPT = `Sos redactor de un sitio web del Mundial de Fútbol 2026 en español rioplatense.

REGLAS ABSOLUTAS — NO NEGOCIABLES:
1. Solo usás información que esté EXPLÍCITAMENTE en las fuentes proporcionadas.
2. NUNCA inventás resultados, goles, asistencias, tarjetas ni declaraciones.
3. NUNCA agregás datos que no estén en el texto fuente.
4. Si un dato no está en las fuentes, simplemente no lo mencionás.
5. El tono es periodístico, directo, sin adjetivos vacíos.
6. Respondés SOLO con JSON válido, sin markdown, sin texto adicional.`

function buildPrompt(
  article: ScoredArticle,
  today: string,
  publishedSlugs: string[],
  featuredCount: number,
  articleIndex: number
): string {
  const validSlugs = CONFIG.teamSlugs.join(', ')
  const validCats = CONFIG.categories.join(', ')
  const isFeatured = articleIndex < featuredCount

  return `Fecha de hoy: ${today}

FUENTE (usá ÚNICAMENTE esta información):
Título: ${article.title}
Medio: ${article.sourceName}
Resumen: ${article.snippet}

Generá un JSON con este schema exacto (sin campos extra):
{
  "slug": "string — kebab-case, sin tildes, descriptivo, max 60 chars. DEBE ser único respecto a: ${publishedSlugs.slice(-10).join(', ')}",
  "title": "string — título periodístico en español, max 80 chars, sin comillas internas",
  "category": "string — EXACTAMENTE uno de: ${validCats}",
  "excerpt": "string — bajada de 1-2 oraciones, max 160 chars, sin comillas internas",
  "emoji": "string — un emoji relevante al tema",
  "featured": ${isFeatured},
  "relatedTeamSlugs": ["array — slugs de equipos mencionados, SOLO de esta lista: ${validSlugs}. Array vacío [] si ninguno aplica"],
  "imageAlt": "string — descripción de imagen de estadio o ambiente del Mundial, SIN mencionar jugadores específicos",
  "imagePrompt": "string en INGLÉS — para generación de imagen. Describir estadio, banderas, ambiente. Sin jugadores, sin texto, sin marcadores",
  "body": "string — artículo en Markdown. Min 150 palabras. Usar ## para subtítulos, **negritas** para datos clave, listas con - cuando aplique. Solo información de la fuente."
}

Respondé SOLO con el JSON. Sin backticks, sin texto antes ni después.`
}

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function parseJSON(raw: string): GeneratedArticle {
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  return JSON.parse(clean) as GeneratedArticle
}

function validate(article: GeneratedArticle, slug: string): void {
  const required = ['slug', 'title', 'category', 'excerpt', 'body'] as const
  const missing = required.filter(f => !article[f])
  if (missing.length > 0) {
    throw new Error(`Campos faltantes en artículo ${slug}: ${missing.join(', ')}`)
  }
  if (article.body.split(' ').length < 80) {
    throw new Error(`Cuerpo demasiado corto en artículo ${slug} (< 80 palabras)`)
  }
  if (!CONFIG.categories.includes(article.category as typeof CONFIG.categories[number])) {
    // Normalizar a la categoría más cercana
    article.category = 'Noticias de selecciones'
  }
  // Filtrar relatedTeamSlugs a solo slugs válidos
  article.relatedTeamSlugs = (article.relatedTeamSlugs ?? [])
    .filter(s => (CONFIG.teamSlugs as readonly string[]).includes(s))
}

export async function generateArticle(
  rawArticle: ScoredArticle,
  today: string,
  publishedSlugs: string[],
  articleIndex: number
): Promise<GeneratedArticle> {
  const llm = createLLMProvider()
  logger.info(`Redactando con ${llm.name}: "${rawArticle.title.slice(0, 50)}..."`)

  const prompt = buildPrompt(
    rawArticle,
    today,
    publishedSlugs,
    CONFIG.featuredCount,
    articleIndex
  )

  const response = await llm.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: prompt },
    ],
    {
      maxTokens: CONFIG.llm.maxTokens,
      temperature: CONFIG.llm.temperature,
    }
  )

  const article = parseJSON(response)

  // Sanitizar slug
  article.slug = sanitizeSlug(article.slug || rawArticle.title)

  // Validar campos y datos
  validate(article, article.slug)

  logger.success(`Artículo generado: ${article.slug}`)
  return article
}
