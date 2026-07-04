'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

// La final del Mundial 2026 es el 19 de julio en Nueva Jersey
const FINAL_DATE = new Date('2026-07-19T18:00:00-04:00')
// Inicio del Mundial (partido inaugural)
const START_DATE = new Date('2026-06-11T19:00:00Z')

interface TimeLeft { d: string; h: string; m: string; s: string }

function calc(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { d: '00', h: '00', m: '00', s: '00' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

function getPhase(): 'before' | 'during' | 'after' {
  const now = Date.now()
  if (now < START_DATE.getTime()) return 'before'
  if (now < FINAL_DATE.getTime()) return 'during'
  return 'after'
}

export function Countdown() {
  const [t, setT] = useState<TimeLeft>({ d: '--', h: '--', m: '--', s: '--' })
  const [phase, setPhase] = useState<'before' | 'during' | 'after'>('before')

  useEffect(() => {
    const update = () => {
      const p = getPhase()
      setPhase(p)
      if (p === 'before') setT(calc(START_DATE))
      else if (p === 'during') setT(calc(FINAL_DATE))
      else setT({ d: '00', h: '00', m: '00', s: '00' })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (phase === 'after') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--green)', letterSpacing: '.04em' }}
      >
        ¡EL MUNDIAL HA TERMINADO!
      </motion.div>
    )
  }

  const label = phase === 'before'
    ? 'para el partido inaugural'
    : 'para la Final · MetLife Stadium, Nueva Jersey'

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  } as const

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.p className="cd-event-label" variants={itemVariants}>{label}</motion.p>
      <div className="hero-countdown">
        <motion.div className="cd-unit" variants={itemVariants} whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <motion.span
            key={t.d}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="cd-num"
          >
            {t.d}
          </motion.span>
          <span className="cd-label">días</span>
        </motion.div>
        
        <motion.span className="cd-sep" variants={itemVariants}>:</motion.span>
        
        <motion.div className="cd-unit" variants={itemVariants} whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <motion.span
            key={t.h}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="cd-num"
          >
            {t.h}
          </motion.span>
          <span className="cd-label">horas</span>
        </motion.div>
        
        <motion.span className="cd-sep" variants={itemVariants}>:</motion.span>
        
        <motion.div className="cd-unit" variants={itemVariants} whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <motion.span
            key={t.m}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="cd-num"
          >
            {t.m}
          </motion.span>
          <span className="cd-label">minutos</span>
        </motion.div>
        
        <motion.span className="cd-sep" variants={itemVariants}>:</motion.span>
        
        <motion.div className="cd-unit" variants={itemVariants} whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <motion.span
            key={t.s}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="cd-num"
          >
            {t.s}
          </motion.span>
          <span className="cd-label">segundos</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

