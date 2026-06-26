// automation/markdown/index.ts
// ─── Escritura de archivos Markdown con frontmatter ───────────────────────────
// Reproduce exactamente el formato que ya usa content/noticias/<slug>/index.md

import fs from 'node:fs'
import path from 'node:path'
import type { GeneratedArticle } from '../generators/article-generator.ts'
import type { ScoredArticle } from '../ranking/index.ts'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'

// ─── Metadata de auditoría ────────────────────────────────────────────────────

interface ArticleMetadata {
  generatedAt: string
  sources: Array<{
    title: string
    url: string
    sourceName: string
    pubDate: string
    score: number
  }>
}

// ─── Generar el contenido del index.md ───────────────────────────────────────

function buildMarkdown(article: GeneratedArticle, today: string, hasImage: boolean): string {
  const imageLine = hasImage
    ? `image: /noticias/${article.slug}/cover.webp`
    : `# image: sin imagen generada`

  const imageAltLine = hasImage && article.imageAlt
    ? `imageAlt: "${article.imageAlt.replace(/"/g, '\\"')}"`
    : `imageAlt: ""`

  const relatedLine = article.relatedTeamSlugs.length > 0
    ? `relatedTeamSlugs: [${article.relatedTeamSlugs.join(', ')}]`
    : `relatedTeamSlugs: []`

  return `---
title: "${article.title.replace(/"/g, '\\"')}"
category: ${article.category}
date: ${today}
excerpt: "${article.excerpt.replace(/"/g, '\\"')}"
${imageLine}
${imageAltLine}
emoji: "${article.emoji ?? '⚽'}"
featured: ${article.featured === true}
${relatedLine}
---

${article.body.trim()}
`
}

// ─── Validación de campos obligatorios ───────────────────────────────────────

function validateFrontmatter(article: GeneratedArticle): void {
  const required: Array<keyof GeneratedArticle> = ['slug', 'title', 'category', 'excerpt', 'body']
  const missing = required.filter(f => !article[f])
  if (missing.length > 0) {
    throw new Error(`Validación fallida — campos faltantes: ${missing.join(', ')}`)
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

export function writeArticle(
  article: GeneratedArticle,
  rawArticle: ScoredArticle,
  today: string,
  hasImage: boolean
): void {
  validateFrontmatter(article)

  // Carpeta del artículo
  const contentDir = path.resolve(process.cwd(), CONFIG.contentDir, article.slug)
  fs.mkdirSync(contentDir, { recursive: true })

  // index.md
  const mdContent = buildMarkdown(article, today, hasImage)
  const mdPath = path.join(contentDir, 'index.md')
  fs.writeFileSync(mdPath, mdContent, 'utf8')
  logger.success(`Escrito: content/noticias/${article.slug}/index.md`)

  // metadata.json — auditoría de fuentes (no se muestra en la web)
  const metadata: ArticleMetadata = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        title: rawArticle.title,
        url: rawArticle.url,
        sourceName: rawArticle.sourceName,
        pubDate: rawArticle.pubDate,
        score: rawArticle.score,
      },
    ],
  }
  const metaPath = path.join(contentDir, 'metadata.json')
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8')
  logger.info(`Metadatos guardados: content/noticias/${article.slug}/metadata.json`)
}
