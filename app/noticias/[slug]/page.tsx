import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { NEWS, NEWS_BY_SLUG, TEAMS_BY_SLUG } from '@/lib/data'

interface Props {
  params: Promise<{ slug: string }>
}

// Genera las páginas de noticias en build time.
// Cuando se conecte un CMS, reemplazar este array por un fetch a la API del CMS.
export function generateStaticParams() {
  return NEWS.map(n => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = NEWS_BY_SLUG[slug]
  if (!article) return { title: 'Artículo no encontrado' }
  return {
    title: article.headline,
    description: article.excerpt,
    openGraph: {
      title: article.headline,
      description: article.excerpt,
      type: 'article',
    },
  }
}

// Convierte el body de texto plano / markdown básico a párrafos HTML
function renderBody(body: string) {
  return body.split('\n\n').map((para, i) => {
    // Negrita: **texto** → <strong>
    const html = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    return (
      <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
    )
  })
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params
  const article = NEWS_BY_SLUG[slug]
  if (!article) notFound()

  const relatedTeams = (article.relatedTeamSlugs ?? [])
    .map(s => TEAMS_BY_SLUG[s])
    .filter(Boolean)

  const otherArticles = NEWS.filter(n => n.slug !== slug).slice(0, 3)

  return (
    <div className="content-area" style={{ maxWidth: 800 }}>
      <Link href="/" className="back-link">
        ← Volver al inicio
      </Link>

      {/* CABECERA DEL ARTÍCULO */}
      <div className="article-header">
        <div className="article-tag">{article.tag}</div>
        <h1 className="article-title">{article.headline}</h1>
        <div className="article-meta">{article.date}</div>
      </div>

      <span className="article-emoji">{article.emoji}</span>

      {/* CUERPO */}
      <div className="article-body">
        {renderBody(article.body)}
      </div>

      {/* EQUIPOS RELACIONADOS */}
      {relatedTeams.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            Selecciones relacionadas
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {relatedTeams.map(t => (
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
                <span style={{ fontSize: 20 }}>{t.flag}</span>
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* OTRAS NOTICIAS */}
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
          Más noticias
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {otherArticles.map(n => (
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
              <span style={{ fontSize: 28, flexShrink: 0 }}>{n.emoji}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 4 }}>{n.tag}</div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{n.headline}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
