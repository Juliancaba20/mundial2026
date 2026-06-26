// automation/images/index.ts
// ─── Orquestador de generación de imágenes ───────────────────────────────────
// Plantilla editorial fija — nunca se le permite al LLM escribir el prompt libremente.
// Solo se reemplazan variables específicas en la plantilla.

import fs from 'node:fs'
import path from 'node:path'
import type { GeneratedArticle } from '../generators/article-generator.ts'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'
import { PollinationsProvider } from './pollinations-provider.ts'
import type { ImageProvider } from './image-interface.ts'

// ─── Convertir a WebP con sharp ───────────────────────────────────────────────

async function toWebP(buffer: Buffer): Promise<Buffer> {
  // sharp se importa dinámicamente para no fallar si no está instalado
  try {
    const sharp = (await import('sharp')).default
    return await sharp(buffer)
      .resize(CONFIG.images.width, CONFIG.images.height, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer()
  } catch {
    // Si sharp no está disponible, retornar el buffer original
    logger.warn('sharp no disponible — guardando imagen sin convertir')
    return buffer
  }
}

// ─── Factory de provider ──────────────────────────────────────────────────────

function createImageProvider(): ImageProvider {
  switch (CONFIG.images.provider) {
    case 'pollinations': return new PollinationsProvider()
    default:             return new PollinationsProvider()
  }
}

// ─── Construir prompt desde plantilla ─────────────────────────────────────────
// La plantilla vive en config.ts — el LLM solo sugiere las variables {{theme}} y {{flags}}

function buildImagePrompt(article: GeneratedArticle): string {
  // Extraer banderas de los equipos relacionados (máx 3)
  const flags = article.relatedTeamSlugs
    .slice(0, 3)
    .map(s => s.replace(/-/g, ' '))
    .join(' and ')
    || 'international'

  // El "tema" viene del imagePrompt del LLM pero solo se usa como hint,
  // siempre embebido dentro de la plantilla editorial fija
  const theme = (article.imagePrompt ?? '')
    .replace(/[^a-zA-Z0-9 ,]/g, '')
    .slice(0, 80)
    || 'World Cup 2026 stadium'

  return CONFIG.images.promptTemplate
    .replace('{{theme}}', theme)
    .replace('{{flags}}', flags)
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function generateAndSaveImage(
  article: GeneratedArticle
): Promise<boolean> {
  const outputDir = path.resolve(process.cwd(), CONFIG.publicDir, article.slug)
  const outputPath = path.join(outputDir, 'cover.webp')

  fs.mkdirSync(outputDir, { recursive: true })

  const provider = createImageProvider()
  const prompt = buildImagePrompt(article)

  logger.info(`Imagen — prompt: "${prompt.slice(0, 80)}..."`)

  const rawBuffer = await provider.generate(
    prompt,
    CONFIG.images.width,
    CONFIG.images.height
  )

  if (!rawBuffer) {
    // Fallback: no imagen, el sitio usará el emoji
    logger.warn(`Sin imagen para ${article.slug} — se usará emoji fallback`)
    return false
  }

  try {
    const webpBuffer = await toWebP(rawBuffer)
    fs.writeFileSync(outputPath, webpBuffer)
    logger.success(`Imagen guardada: ${outputPath}`)
    return true
  } catch (err) {
    logger.error(`Error guardando imagen para ${article.slug}`, err)
    return false
  }
}
