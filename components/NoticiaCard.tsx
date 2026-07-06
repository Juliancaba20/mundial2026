'use client'

import Link from 'next/link'
import type { Noticia } from '@/types'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

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

  // 3D Tilt parameters using MotionValues to avoid component re-renders
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Map relative coordinates [-0.5, 0.5] to degrees of rotation
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8])

  const springConfig = { damping: 25, stiffness: 220, mass: 0.4 }
  const rx = useSpring(rotateX, springConfig)
  const ry = useSpring(rotateY, springConfig)

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left - width / 2
    const mouseY = event.clientY - rect.top - height / 2
    x.set(mouseX / width)
    y.set(mouseY / height)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        height: '100%',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileTap={{ scale: 0.98 }}
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        className={`news-card${isFeatured ? ' featured' : ''}`}
      >
        <Link
          href={`/noticias/${noticia.slug}`}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', transformStyle: 'preserve-3d' }}
        >
          <div className={`news-img${tieneImagen ? ' has-image' : ''}`} style={{ overflow: 'hidden', transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}>
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
              <span className="news-img-emoji" style={{ display: 'block', transform: 'translateZ(25px)' }}>{noticia.emoji ?? '📰'}</span>
            )}
          </div>
          <div className="news-body" style={{ flexGrow: 1, transformStyle: 'preserve-3d', transform: 'translateZ(30px)' }}>
            <div className="news-tag" style={{ transform: 'translateZ(10px)' }}>{noticia.category}</div>
            <div className="news-headline" style={{ transform: 'translateZ(15px)' }}>{noticia.title}</div>
            <div className="news-meta" style={{ transform: 'translateZ(5px)' }}>{formatFecha(noticia.date)}</div>
          </div>
        </Link>
      </motion.div>
    </div>
  )
}


