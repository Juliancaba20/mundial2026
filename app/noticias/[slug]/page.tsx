import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TEAMS_BY_SLUG } from '@/lib/data'
import {
  getNoticiaBySlug,
  getNoticiaSlugs,
  getNoticiasRecientes,
  formatFecha,
} from '@/lib/noticias'
import { TeamFlag } from '@/components/TeamFlag'

interface Props {
  params: Promise<{ slug: string }>
}

// SSG: genera todas las páginas de noticia en build time.
export function generateStaticParams() {
  return getNoticiaSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getNoticiaBySlug(slug)
  if (!article) return { title: 'Artículo no encontrado' }

  const url = `https://mundial2026-blond-pi.vercel.app/noticias/${article.slug}`
  const images = article.image ? [{ url: article.image, width: 1600, height: 900 }] : []

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url,
      images,
      publishedTime: article.date.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images,
    },
  }
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params
  const article = getNoticiaBySlug(slug)
  if (!article) notFound()

  const relatedTeams = (article.relatedTeamSlugs ?? [])
    .map((s) => TEAMS_BY_SLUG[s])
    .filter(Boolean)

  const otherArticles = getNoticiasRecientes(3, slug)

  // JSON-LD schema.org/Article para rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date.toISOString(),
    articleSection: article.category,
    image: article.image ? [article.image] : undefined,
  }

  return (
    <div className="content-area" style={{ maxWidth: 800 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/noticias" className="back-link">
        ← Ver todas las noticias
      </Link>

      {/* CABECERA DEL ARTÍCULO */}
      <div className="article-header">
        <div className="article-tag">{article.category}</div>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">{formatFecha(article.date)}</div>
      </div>

      {/* PORTADA */}
      {article.image ? (
        <div className="article-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt={article.imageAlt ?? article.title}
            className="article-cover-img"
          />
        </div>
      ) : (
        article.emoji && <span className="article-emoji">{article.emoji}</span>
      )}

      {/* CUERPO (Markdown) */}
      <article className="article-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </article>

      {/* EQUIPOS RELACIONADOS */}
      {relatedTeams.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            Selecciones relacionadas
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {relatedTeams.map((t) => (
              <Link
                key={t.slug}
                href={`/equipo/${t.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 14,
                  color: 'var(--text)', textDecoration: 'none',
                }}
              >
                <TeamFlag code={t.flagCode} name={t.name} size={20} style={{ borderRadius: 2 }} />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* OTRAS NOTICIAS */}
      {otherArticles.length > 0 && (
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            Más noticias
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {otherArticles.map((n) => (
              <Link
                key={n.slug}
                href={`/noticias/${n.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 16px',
                  color: 'var(--text)', textDecoration: 'none',
                  transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{n.emoji ?? '📰'}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 4 }}>{n.category}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{n.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
