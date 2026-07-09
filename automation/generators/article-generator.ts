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
1. Redactás a partir de la información de la fuente proporcionada.
2. NUNCA inventás resultados, goles, asistencias, tarjetas ni declaraciones concretas.
3. Podés agregar contexto general del torneo (formato, grupos, sede) para enriquecer el artículo, pero no datos específicos de partidos que no estén en la fuente.
4. El tono es periodístico, directo, sin adjetivos vacíos.
5. El cuerpo DEBE tener mínimo 120 palabras. Si la fuente es corta, expandís con contexto relevante del Mundial 2026.
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

FUENTE:
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
  "body": "string — artículo en Markdown, MÍNIMO 120 palabras. FORMATO OBLIGATORIO: cada párrafo, subtítulo, ítem de lista o cita DEBE estar en su propia línea, separado del anterior por una línea en blanco (carácter \\n\\n real dentro del string JSON). NUNCA vuelques todo el artículo en una sola línea. Usar ## para subtítulos (en su propia línea), **negritas** para datos clave, listas con - (una por línea) cuando aplique. Si la fuente es escasa, completá con contexto general del torneo (sede, formato, grupos) pero NO inventés resultados ni declaraciones concretas."
}

Ejemplo de la ESTRUCTURA esperada para el campo body (con saltos de línea reales, no literal el texto):
"Primer párrafo de apertura con el dato principal.\\n\\n## Subtítulo\\n\\nSegundo párrafo desarrollando el tema.\\n\\n- Primer punto\\n- Segundo punto\\n\\n> Cita si corresponde"

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

// ─── Normalización del body ───────────────────────────────────────────────────
// Red de seguridad determinística: el LLM a veces devuelve el artículo entero
// en una sola línea (con "##", "-" y ">" mezclados en el texto sin saltos de
// línea reales), lo que rompe el render en ReactMarkdown (el heading se traga
// todo el artículo). Esta función fuerza la estructura de bloques Markdown
// independientemente de lo que haya devuelto el LLM.
function normalizeMarkdownBody(raw: string): string {
  let body = raw.trim()

  // Si ya tiene separación real de bloques, solo normalizamos espaciados.
  const hasBlankLines = /\n\s*\n/.test(body)

  if (!hasBlankLines) {
    // Todo vino en una sola línea (o sin dobles saltos). Insertamos línea en
    // blanco antes de cada marcador de bloque para reconstituir la estructura.
    body = body
      // Antes de un heading "## " que no está al inicio del string.
      .replace(/([^\n])\s+(#{1,6}\s)/g, '$1\n\n$2')
      // Antes de un ítem de lista "- " que no está al inicio del string.
      .replace(/([^\n])\s+(-\s+\S)/g, '$1\n\n$2')
      // Antes de una cita "> " que no está al inicio del string.
      .replace(/([^\n])\s+(>\s+\S)/g, '$1\n\n$2')
  }

  // Aunque ya tuviera saltos de línea, garantizamos que headings, listas y
  // citas siempre queden separados del texto anterior por línea en blanco
  // (por si el LLM puso un solo \n en vez de \n\n).
  body = body
    .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
    .replace(/([^\n])\n(>\s)/g, '$1\n\n$2')
    // Colapsamos 3+ saltos de línea a 2 (una sola línea en blanco).
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return body
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
  if (article.body.split(' ').length < 50) {
    throw new Error(`Cuerpo demasiado corto en artículo ${slug} (< 50 palabras)`)
  }
  if (!CONFIG.categories.includes(article.category as typeof CONFIG.categories[number])) {
    article.category = 'Noticias de selecciones'
  }
  article.relatedTeamSlugs = (article.relatedTeamSlugs ?? [])
    .filter(s => (CONFIG.teamSlugs as readonly string[]).includes(s))

  // Punto 2: forzamos la estructura de bloques del body sin importar lo que
  // haya devuelto el LLM.
  article.body = normalizeMarkdownBody(article.body)

  // Punto 3: si tras normalizar sigue sin tener bloques separados, es señal
  // de que el heurístico no pudo reconstituir la estructura (ej. el LLM no
  // usó ningún marcador de Markdown). Se registra pero no se bloquea el
  // artículo — mejor publicarlo como texto corrido que perderlo.
  const hasBlocks = /\n\s*\n/.test(article.body)
  if (!hasBlocks) {
    logger.warn(`Artículo ${slug}: el body no tiene estructura de bloques Markdown tras normalizar (posible párrafo único).`)
  }
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

  article.slug = sanitizeSlug(article.slug || rawArticle.title)

  validate(article, article.slug)

  logger.success(`Artículo generado: ${article.slug}`)
  return article
}
