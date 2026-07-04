'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'

interface HeroClientProps {
  countdown: ReactNode
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
} as const

const eyebrowVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
} as const

const titleVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 150, damping: 18 },
  },
} as const

const subtitleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const

const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
} as const

const statVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
} as const

export function HeroClient({ countdown }: HeroClientProps) {
  return (
    <div className="hero" style={{ overflow: 'hidden' }}>
      <motion.div 
        className="hero-bg"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <div className="hero-grid" />
      
      <motion.div
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <motion.div className="hero-eyebrow" variants={eyebrowVariants}>
          <motion.span 
            className="hero-eyebrow-line" 
            initial={{ width: 0 }}
            animate={{ width: 16 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          FIFA COPA MUNDIAL
        </motion.div>

        {/* Title */}
        <motion.h1 className="hero-title" variants={titleVariants}>
          USA · MÉX<br />
          <motion.span
            initial={{ color: 'var(--text-light)' }}
            animate={{ color: 'var(--green)' }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            CAN 2026
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p className="hero-subtitle" variants={subtitleVariants}>
          EE.UU · México · Canadá &nbsp;·&nbsp; 11 jun – 19 jul
        </motion.p>

        {/* Countdown component passed as child */}
        <motion.div variants={subtitleVariants}>
          {countdown}
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="hero-meta"
          variants={statsContainerVariants}
        >
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <span className="hero-stat-num">48</span> selecciones
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <span className="hero-stat-num">104</span> partidos
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <span className="hero-stat-num">16</span> estadios
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <span className="hero-stat-num">3</span> países sede
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
