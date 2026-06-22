import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Noticia } from '@/types'

// ─── Noticias: lectura de Markdown + frontmatter ─────────────────────────────
//
// Cada noticia es una carpeta en `content/noticias/<slug>/` que contiene un
// `index.md` con frontmatter YAML. La imagen de portada (opcional) vive en
// `public/noticias/<slug>/cover.webp` y se referencia por URL desde raíz.
//
// Toda la lectura ocurre en BUILD TIME (Server Components / generateStaticParams).
// No hay fetch en runtime ni DB. Ver `NOTICIAS.md` para el flujo editorial.

const NOTICIAS_DIR = path.join(process.cwd(), 'content', 'noticias')

const MESES_ES = [
  'ene','feb','mar','abr','may','jun',
  'jul','ago','sep','oct','nov','dic',
]

// Formatea una fecha (día UTC) como "13 jun 2026" — label de display.
// Recibe `Date` ya interpretada en UTC (sin hora) para evitar bugs de tz.
export function formatFecha(date: Date): string {
  const dia = date.getUTCDate()
  const mes = MESES_ES[date.getUTCMonth()] // 0-indexed
  const anio = date.getUTCFullYear()
  return `${dia} ${mes} ${anio}`
}

// Lee y parsea una carpeta de noticia. Lanza errores claros en build si el
// frontmatter está incompleto o mal formado.
function leerNoticia(slug: string): Noticia {
  const dir = path.join(NOTICIAS_DIR, slug)
  const file = path.join(dir, 'index.md')

  if (!fs.existsSync(file)) {
    throw new Error(`Noticia sin index.md: content/noticias/${slug}/index.md`)
  }

  const raw = fs.readFileSync(file, 'utf8')
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(raw)
  } catch (e) {
    throw new Error(
      `Frontmatter inválido en content/noticias/${slug}/index.md: ${(e as Error).message}`
    )
  }

  const d = parsed.data

  // Validación explícita — fail-fast en build con mensaje útil.
  const faltan: string[] = []
  if (!d.title) faltan.push('title')
  if (!d.category) faltan.push('category')
  if (!d.date) faltan.push('date')
  if (!d.excerpt) faltan.push('excerpt')
  if (faltan.length > 0) {
    throw new Error(
      `Noticia content/noticias/${slug}/index.md falta frontmatter: ${faltan.join(', ')}`
    )
  }

  // `date` en frontmatter viene como string "YYYY-MM-DD". Lo parseamos como
  // fecha UTC a medianoche para que el día sea estable sin importar la tz del
  // servidor o del autor (evita el bug histórico de /partidos con timezones).
  let fecha: Date
  if (d.date instanceof Date) {
    fecha = d.date
  } else {
    // Sólo la parte YYYY-MM-DD; descartamos hora/tz para estabilidad.
    fecha = new Date(`${String(d.date).slice(0, 10)}T00:00:00Z`)
  }
  if (Number.isNaN(fecha.getTime())) {
    throw new Error(
      `Noticia content/noticias/${slug}/index.md — date inválida: "${d.date}" (usar YYYY-MM-DD)`
    )
  }

  return {
    slug,
    title: String(d.title).trim(),
    category: String(d.category).trim(),
    date: fecha,
    excerpt: String(d.excerpt).trim(),
    body: parsed.content,
    image: d.image ? String(d.image).trim() : undefined,
    imageAlt: d.imageAlt ? String(d.imageAlt).trim() : undefined,
    emoji: d.emoji ? String(d.emoji).trim() : undefined,
    featured: d.featured === true,
    relatedTeamSlugs: Array.isArray(d.relatedTeamSlugs) ? d.relatedTeamSlugs.map(String) : undefined,
  }
}

// Lee todas las noticias, ordenadas por fecha DESC (más reciente primero).
// Llama en Server Components o en generateStaticParams.
export function getAllNoticias(): Noticia[] {
  if (!fs.existsSync(NOTICIAS_DIR)) return []

  const slugs = fs
    .readdirSync(NOTICIAS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.'))

  const noticias = slugs.map(leerNoticia)
  noticias.sort((a, b) => b.date.getTime() - a.date.getTime())
  return noticias
}

// Acceso O(1) por slug para la página de detalle.
export function getNoticiaBySlug(slug: string): Noticia | null {
  const dir = path.join(NOTICIAS_DIR, slug, 'index.md')
  if (!fs.existsSync(dir)) return null
  return leerNoticia(slug)
}

// Slugs para generateStaticParams().
export function getNoticiaSlugs(): string[] {
  return getAllNoticias().map((n) => n.slug)
}

// Las N más recientes — para la home y bloques relacionados.
export function getNoticiasRecientes(limit: number, excludeSlug?: string): Noticia[] {
  return getAllNoticias()
    .filter((n) => n.slug !== excludeSlug)
    .slice(0, limit)
}
