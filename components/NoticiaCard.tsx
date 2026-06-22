import Link from 'next/link'
import type { Noticia } from '@/types'
import { formatFecha } from '@/lib/noticias'

// Card de noticia reutilizable para grids (home + índice /noticias).
// Server Component — sin estado ni efectos.
//
// Comportamiento visual:
// - Si `noticia.image` existe → muestra la portada con next/image (cover).
// - Si no → conserva el fallback actual: emoji grande sobre gradiente.
// - `noticia.featured` → ocupa dos filas en el grid (clase `featured`).
interface Props {
  noticia: Noticia
  featured?: boolean   // fuerza featured aunque la noticia no lo marque
}

export function NoticiaCard({ noticia, featured }: Props) {
  const isFeatured = featured ?? noticia.featured
  const tieneImagen = Boolean(noticia.image)

  return (
    <Link
      href={`/noticias/${noticia.slug}`}
      className={`news-card${isFeatured ? ' featured' : ''}`}
    >
      <div className={`news-img${tieneImagen ? ' has-image' : ''}`}>
        {tieneImagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={noticia.image}
            alt={noticia.imageAlt ?? noticia.title}
            className="news-img-pic"
            loading="lazy"
          />
        ) : (
          <span className="news-img-emoji">{noticia.emoji ?? '📰'}</span>
        )}
      </div>
      <div className="news-body">
        <div className="news-tag">{noticia.category}</div>
        <div className="news-headline">{noticia.title}</div>
        <div className="news-meta">{formatFecha(noticia.date)}</div>
      </div>
    </Link>
  )
}
