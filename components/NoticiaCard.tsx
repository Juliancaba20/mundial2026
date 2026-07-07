'use client'

import Link from 'next/link'
import type { Noticia } from '@/types'
import { motion } from 'motion/react'

const MESES_ES = [
  'ene','feb','mar','abr','may','jun',
  'jul','ago','sep','oct','nov','dic',
]

function formatFecha(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const dia = date.getUTCDate()
  const mes = MESES_ES[date.getUTCMonth()] // 0-indexed
  const anio = date.getUTCFullYear()
  return `${dia} ${mes} ${anio}`
}

// Card de noticia reutilizable para grids (home + índice /noticias).
interface Props {
  noticia: Noticia
  featured?: boolean   // fuerza featured aunque la noticia no lo marque
}

export function NoticiaCard({ noticia, featured }: Props) {
  const isFeatured = featured ?? noticia.featured
  const tieneImagen = Boolean(noticia.image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`news-card${isFeatured ? ' featured' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Link
        href={`/noticias/${noticia.slug}`}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none' }}
      >
        <div className={`news-img${tieneImagen ? ' has-image' : ''}`} style={{ overflow: 'hidden' }}>
          {tieneImagen ? (
            <motion.img
              src={noticia.image}
              alt={noticia.imageAlt ?? noticia.title}
              className="news-img-pic"
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <span className="news-img-emoji">{noticia.emoji ?? '📰'}</span>
          )}
        </div>
        <div className="news-body" style={{ flexGrow: 1 }}>
          <div className="news-tag">{noticia.category}</div>
          <div className="news-headline">{noticia.title}</div>
          <div className="news-meta">{formatFecha(noticia.date)}</div>
        </div>
      </Link>
    </motion.div>
  )
}


