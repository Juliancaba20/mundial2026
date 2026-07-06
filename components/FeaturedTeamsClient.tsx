'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { TeamFlag } from './TeamFlag'

interface Team {
  slug: string
  name: string
  flagCode: string
  group: string
  isChampion?: boolean
}

interface Props {
  teams: Team[]
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
} as const

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 15, rotateY: -25, z: -50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    z: 0,
    transition: { type: 'spring', stiffness: 220, damping: 18 },
  },
} as const

export function FeaturedTeamsClient({ teams }: Props) {
  return (
    <motion.div
      className="teams-scroll"
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '12px',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {teams.map(t => (
        <motion.div
          key={t.slug}
          variants={cardVariants}
          whileHover={{ y: -6, scale: 1.03, borderColor: 'rgba(255, 255, 255, 0.2)' }}
          whileTap={{ scale: 0.98 }}
          className={`team-card${t.isChampion ? ' arg' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <Link href={`/equipo/${t.slug}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
            <TeamFlag code={t.flagCode} name={t.name} size={36} className="tc-flag-img" />
            <div className="tc-name">{t.name}</div>
            <div className="tc-group">Grupo {t.group}</div>
            {t.isChampion && (
              <motion.div 
                className="tc-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                ★ Campeona
              </motion.div>
            )}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
