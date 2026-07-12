'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Match } from '@/types'
import { MatchTime } from './MatchTime'
import { TeamFlag } from './TeamFlag'
import { motion } from 'motion/react'

interface Props {
  match: Match
  showGroup?: boolean
}

export function MatchRow({ match: m, showGroup = true }: Props) {
  const router = useRouter()
  const matchHref = `/partidos/${m.id}`

  const handleRowClick = () => {
    router.push(matchHref)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(matchHref)
    }
  }

  const scoreEl = m.status === 'live'
    ? <div className="m-score-box live-s">{m.score}</div>
    : m.status === 'done'
      ? <div className="m-score-box">{m.score}</div>
      : <div className="m-score-box pending">vs</div>

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      whileHover={{ y: -2, scale: 1.005, borderColor: 'rgba(255, 255, 255, 0.14)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => router.prefetch(matchHref)}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalle: ${m.home.name} vs ${m.away.name}`}
      style={{ cursor: 'pointer' }}
      className={[
        'match-row',
        m.isArgentina  ? 'arg'     : '',
        m.status === 'live' ? 'is-live' : '',
        m.status === 'done' ? 'is-done' : '',
      ].filter(Boolean).join(' ')}
    >

      {/* Grupo */}
      {showGroup && <div className="m-group-tag">GR.{m.group}</div>}

      {/* Equipos + score */}
      <div className="m-main">
        <div className="m-teams">
          <Link href={`/equipo/${m.home.slug}`} className="m-team" onClick={(e) => e.stopPropagation()}>
            <TeamFlag code={m.home.flagCode} name={m.home.name} size={18} className="m-flag-img" />
            <span className="m-tname">{m.home.name}</span>
          </Link>
          {scoreEl}
          <Link href={`/equipo/${m.away.slug}`} className="m-team right" onClick={(e) => e.stopPropagation()}>
            <TeamFlag code={m.away.flagCode} name={m.away.name} size={18} className="m-flag-img" />
            <span className="m-tname">{m.away.name}</span>
          </Link>
        </div>

        {/* Meta: hora local + estadio */}
        <div className="m-meta-row">
          <MatchTime
            kickoff={m.kickoff}
            status={m.status}
            clock={m.clock}
            date={m.date}
          />
          {m.stadium && (
            <span className="m-stadium">{m.stadium}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

