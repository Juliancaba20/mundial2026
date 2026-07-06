'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ReactNode, useRef } from 'react'

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
  hidden: { opacity: 0, y: -15, z: 20 },
  visible: {
    opacity: 1,
    y: 0,
    z: 0,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
} as const

const titleVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.98, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', stiffness: 150, damping: 18 },
  },
} as const

const subtitleVariants = {
  hidden: { opacity: 0, z: -10 },
  visible: {
    opacity: 1,
    z: 0,
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
  const heroRef = useRef<HTMLDivElement>(null)

  // Motion values for mouse position
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs
  const springConfig = { damping: 30, stiffness: 120, mass: 0.6 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Map mouse positions to 3D rotations & offsets
  // Rotations for the main content block
  const contentRotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6])
  const contentRotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6])
  
  // Parallax offsets for background elements & 3D floating spheres
  const bgX = useTransform(smoothX, [-0.5, 0.5], [-15, 15])
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-15, 15])

  const sphere1X = useTransform(smoothX, [-0.5, 0.5], [-40, 40])
  const sphere1Y = useTransform(smoothY, [-0.5, 0.5], [-40, 40])
  
  const sphere2X = useTransform(smoothX, [-0.5, 0.5], [30, -30])
  const sphere2Y = useTransform(smoothY, [-0.5, 0.5], [30, -30])

  function handleMouseMove(event: React.MouseEvent) {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    // Get relative position from -0.5 to 0.5
    const relX = (event.clientX - rect.left) / width - 0.5
    const relY = (event.clientY - rect.top) / height - 0.5
    mouseX.set(relX)
    mouseY.set(relY)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div 
      className="hero" 
      style={{ overflow: 'hidden', perspective: '1200px' }}
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="hero-bg"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          x: bgX,
          y: bgY,
        }}
      />
      
      {/* Dynamic Grid with subtle rotation and mouse parallax */}
      <motion.div 
        className="hero-grid" 
        style={{
          x: useTransform(smoothX, [-0.5, 0.5], [-8, 8]),
          y: useTransform(smoothY, [-0.5, 0.5], [-8, 8]),
        }}
      />

      {/* Floating 3D Hologram Spheres */}
      {/* Sphere 1: Emerald/Mint Glow */}
      <motion.div
        style={{
          position: 'absolute',
          right: '8%',
          top: '15%',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.18) 0%, rgba(0, 168, 107, 0.45) 50%, rgba(13, 17, 23, 0.95) 100%)',
          boxShadow: 'inset -8px -8px 24px rgba(0,0,0,0.8), 0 0 40px rgba(0,168,107,0.25)',
          pointerEvents: 'none',
          zIndex: 0,
          x: sphere1X,
          y: sphere1Y,
        }}
        animate={{
          y: [0, -12, 0],
          rotate: 360,
        }}
        transition={{
          y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 25, ease: 'linear' }
        }}
      />

      {/* Sphere 2: Gold/Amber Metallic Glass Glow */}
      <motion.div
        style={{
          position: 'absolute',
          left: '5%',
          bottom: '22%',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(201, 168, 76, 0.4) 55%, rgba(13, 17, 23, 0.95) 100%)',
          boxShadow: 'inset -6px -6px 20px rgba(0,0,0,0.9), 0 0 35px rgba(201,168,76,0.18)',
          pointerEvents: 'none',
          zIndex: 0,
          x: sphere2X,
          y: sphere2Y,
        }}
        animate={{
          y: [0, 10, 0],
          rotate: -360,
        }}
        transition={{
          y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 20, ease: 'linear' }
        }}
      />
      
      <motion.div
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          rotateX: contentRotateX,
          rotateY: contentRotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Eyebrow */}
        <motion.div 
          className="hero-eyebrow" 
          variants={eyebrowVariants}
          style={{ transform: 'translateZ(40px)' }}
        >
          <motion.span 
            className="hero-eyebrow-line" 
            initial={{ width: 0 }}
            animate={{ width: 16 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          FIFA COPA MUNDIAL
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="hero-title" 
          variants={titleVariants}
          style={{ transform: 'translateZ(60px)' }}
        >
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
        <motion.p 
          className="hero-subtitle" 
          variants={subtitleVariants}
          style={{ transform: 'translateZ(30px)' }}
        >
          EE.UU · México · Canadá &nbsp;·&nbsp; 11 jun – 19 jul
        </motion.p>

        {/* Countdown component passed as child */}
        <motion.div 
          variants={subtitleVariants}
          style={{ transform: 'translateZ(45px)' }}
        >
          {countdown}
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="hero-meta"
          variants={statsContainerVariants}
          style={{ transform: 'translateZ(25px)' }}
        >
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2, z: 15 }}
          >
            <span className="hero-stat-num">48</span> selecciones
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2, z: 15 }}
          >
            <span className="hero-stat-num">104</span> partidos
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2, z: 15 }}
          >
            <span className="hero-stat-num">16</span> estadios
          </motion.div>
          
          <motion.div className="hero-stat-div" variants={statVariants} />
          
          <motion.div 
            className="hero-stat" 
            variants={statVariants}
            whileHover={{ scale: 1.05, y: -2, z: 15 }}
          >
            <span className="hero-stat-num">3</span> países sede
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
