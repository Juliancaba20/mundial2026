'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',              label: 'Inicio' },
  { href: '/grupos',        label: 'Grupos' },
  { href: '/partidos',      label: 'Partidos' },
  { href: '/eliminatorias', label: 'Eliminatorias' },
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
        <div className="brand-mark">⚽</div>
        <div>
          <div className="brand-text">MUNDIAL</div>
          <div className="brand-year">FIFA 2026</div>
        </div>
      </Link>

      <nav className="nav-links">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-btn${isActive(link.href) ? ' active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* El indicador de "en vivo" se maneja desde el cliente en la página de partidos */}
      <div id="topbar-live" style={{ display: 'none' }} className="topbar-live">
        <span className="live-dot" />
        En vivo
      </div>
    </header>
  )
}
