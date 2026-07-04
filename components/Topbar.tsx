'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'

const LINKS = [
  { href: '/',              label: 'Inicio' },
  { href: '/grupos',        label: 'Grupos' },
  { href: '/partidos',      label: 'Partidos' },
  { href: '/eliminatorias', label: 'Eliminatorias' },
  { href: '/noticias',      label: 'Noticias' },
]

export function Topbar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <motion.img
          src="/brand-mark.webp"
          alt="Mundial 2026"
          width={34}
          height={34}
          className="brand-mark"
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        />
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="brand-text">MUNDIAL</div>
          <div className="brand-year">FIFA 2026</div>
        </motion.div>
      </Link>

      <nav className="nav-links">
        {LINKS.map(link => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-btn${active ? ' active' : ''}`}
              style={active ? { background: 'transparent' } : undefined}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>{link.label}</span>
              {active && (
                <motion.span
                  layoutId="activeNavBackground"
                  className="absolute inset-0 rounded-md"
                  style={{ background: 'rgba(0,168,107,0.12)', zIndex: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div id="topbar-live" style={{ display: 'none' }} className="topbar-live">
        <span className="live-dot" />
        En vivo
      </div>
    </header>
  )
}

