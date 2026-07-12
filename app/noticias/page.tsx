import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllNoticias } from '@/lib/noticias'
import { NoticiaCard } from '@/components/NoticiaCard'

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Todas las noticias del Mundial 2026 — análisis, sedes, favoritos e historia.',
  alternates: {
    canonical: 'https://mundial2026-blond-pi.vercel.app/noticias',
  },
  openGraph: {
    title: 'Noticias del Mundial 2026',
    description: 'Análisis, sedes, favoritos e historia de la Copa Mundial FIFA 2026.',
    type: 'website',
  },
}

export default function NoticiasPage() {
  const noticias = getAllNoticias()

  return (
    <div className="content-area">
      <div className="page-header-accent">
        <div className="page-header-stripe" style={{ background: '#00A86B' }} />
        <div className="page-header-inner">
          <div className="page-title">NOTICIAS</div>
          <div className="page-sub">
            Toda la cobertura del Mundial 2026 · ordenadas por fecha
          </div>
        </div>
      </div>

      {noticias.length === 0 ? (
        <div className="api-error">
          No hay noticias todavía. Para agregar una, seguí los pasos de{' '}
          <code>NOTICIAS.md</code>.
        </div>
      ) : (
        <>
          {/* Todas las noticias en un único grid de 5 columnas en desktop */}
          <div className="news-grid news-grid-index">
            {noticias.map((n) => (
              <NoticiaCard key={n.slug} noticia={n} />
            ))}
          </div>

          <div style={{ marginTop: 40 }}>
            <Link href="/" className="back-link">
              ← Volver al inicio
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
