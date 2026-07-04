'use client'

import { motion } from 'motion/react'
import type { Player } from '@/types'

interface SquadSectionClientProps {
  coach: string
  squadByPosition: Record<Player['position'], Player[]>
  positionLabels: Record<Player['position'], string>
  positionOrder: Player['position'][]
  isPlaceholder?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
} as const

const playerVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 250, damping: 24 },
  },
} as const

export function SquadSectionClient({
  coach,
  squadByPosition,
  positionLabels,
  positionOrder,
  isPlaceholder = false,
}: SquadSectionClientProps) {
  return (
    <motion.div
      className="squad-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      variants={containerVariants}
    >
      <motion.div className="team-section-title" variants={itemVariants}>
        PLANTEL {isPlaceholder && <span style={{ opacity: 0.5, fontSize: '0.8em', fontWeight: 'normal' }}>(Por confirmar)</span>}
      </motion.div>

      {/* DIRECTOR TÉCNICO — card destacada dentro de la sección */}
      <motion.div
        className="squad-coach"
        variants={itemVariants}
        whileHover={{ scale: 1.01, borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="squad-coach-label">Director Técnico</span>
        <span className="squad-coach-name" style={isPlaceholder ? { opacity: 0.6, fontStyle: 'italic' } : {}}>
          {coach}
        </span>
      </motion.div>

      {/* JUGADORES */}
      <div className="squad-grid">
        {positionOrder.map(pos => {
          const players = squadByPosition[pos]
          if (players.length === 0) return null
          return (
            <motion.div
              key={pos}
              className="squad-column"
              variants={itemVariants}
            >
              <div className="squad-pos-label">{positionLabels[pos]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {players.map((p, idx) => (
                  <motion.div
                    key={`${p.number ?? idx}-${p.name}`}
                    className="squad-player"
                    variants={playerVariants}
                    whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                    style={isPlaceholder ? { opacity: 0.7 } : {}}
                  >
                    {p.number != null && (
                      <span className="squad-number">{p.number}</span>
                    )}
                    <div className="squad-info">
                      <span className="squad-name" style={isPlaceholder ? { fontStyle: 'italic' } : {}}>
                        {p.name}
                      </span>
                      {p.club && p.club !== '—' && <span className="squad-club">{p.club}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
