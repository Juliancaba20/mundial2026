// automation/scheduler.ts
// ─── Orquestador principal del sistema de auto-publicación ───────────────────
// Ejecutado por GitHub Actions una vez al día.
// Flujo: fetch → ranking → dedup → generate → image → write → git

import { fetchNews } from './fetch/index.ts'
import { rankAndSelect } from './ranking/index.ts'
import { generateArticle } from './generators/article-generator.ts'
import { generateAndSaveImage } from './images/index.ts'
import { writeArticle } from './markdown/index.ts'
import { commitAndPush } from './git/index.ts'
import { isPublished, markPublished, getPublishedSlugs } from './state/index.ts'
import { logger } from './logger/index.ts'
import { CONFIG } from './config.ts'

function getToday(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function run(): Promise<void> {
  const today = getToday()
  logger.section(`Auto-publicación ${CONFIG.topic} — ${today}`)

  // ─── 1. Obtener noticias ──────────────────────────────────────────────────
  logger.section('1/5 · Obteniendo noticias RSS')
  let rawArticles: Awaited<ReturnType<typeof fetchNews>>
  try {
    rawArticles = await fetchNews()
  } catch (err) {
    logger.error('Error fatal en fetch de noticias', err)
    process.exit(1)
  }

  // ─── 2. Ranking y selección ───────────────────────────────────────────────
  logger.section('2/5 · Ranking y selección')
  const publishedSlugs = getPublishedSlugs()
  const selected = rankAndSelect(
    rawArticles,
    publishedSlugs,
    CONFIG.maxArticles,
    CONFIG.minArticles
  )

  if (selected.length === 0) {
    logger.warn('No hay noticias suficientemente relevantes hoy. Finalizando sin publicar.')
    process.exit(0)
  }

  // ─── 3. Generar y publicar cada artículo ─────────────────────────────────
  logger.section('3/5 · Redactando y publicando artículos')
  const newSlugs: string[] = []
  let publishedCount = 0
  let skippedCount = 0

  for (let i = 0; i < selected.length; i++) {
    const raw = selected[i]
    logger.section(`Artículo ${i + 1}/${selected.length}: ${raw.title.slice(0, 50)}`)

    try {
      // Generar artículo con LLM
      const article = await generateArticle(raw, today, publishedSlugs, i)

      // Capa 3 de deduplicación: verificar slug generado
      if (isPublished(article.slug)) {
        logger.warn(`Slug ya publicado: ${article.slug} — omitiendo`)
        skippedCount++
        continue
      }

      // Generar imagen (fallo no es fatal)
      logger.section('Generando imagen de portada')
      const hasImage = await generateAndSaveImage(article)

      // Escribir index.md + metadata.json
      logger.section('Escribiendo archivos')
      writeArticle(article, raw, today, hasImage)

      newSlugs.push(article.slug)
      publishedCount++
    } catch (err) {
      logger.error(`Falló artículo "${raw.title.slice(0, 40)}"`, err)
      logger.warn('Continuando con el siguiente artículo...')
      skippedCount++
    }
  }

  // ─── 4. Actualizar estado ─────────────────────────────────────────────────
  if (newSlugs.length > 0) {
    logger.section('4/5 · Actualizando registro de publicadas')
    markPublished(newSlugs)
  }

  // ─── 5. Git commit y push ─────────────────────────────────────────────────
  logger.section('5/5 · Git commit y push')
  if (publishedCount > 0) {
    commitAndPush(publishedCount, today)
  } else {
    logger.info('No se publicaron noticias nuevas — sin commit.')
  }

  // ─── Resumen ──────────────────────────────────────────────────────────────
  logger.summary(publishedCount, selected.length, skippedCount)

  if (publishedCount === 0 && selected.length > 0) {
    // Todos fallaron — salir con error para que GitHub Actions lo detecte
    process.exit(1)
  }
}

run().catch(err => {
  logger.error('Error no capturado en el orquestador', err)
  process.exit(1)
})
