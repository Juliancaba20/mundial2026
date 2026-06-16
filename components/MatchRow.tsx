import Link from 'next/link'
import type { Match } from '@/types'
import { MatchTime } from './MatchTime'

interface Props {
  match: Match
  showGroup?: boolean
}

export function MatchRow({ match: m, showGroup = true }: Props) {
  const scoreEl = m.status === 'live'
    ? <div className="m-score-box live-s">{m.score}</div>
    : m.status === 'done'
      ? <div className="m-score-box">{m.score}</div>
      : <div className="m-score-box pending">vs</div>

  return (
    <div className={[
      'match-row',
      m.isArgentina  ? 'arg'     : '',
      m.status === 'live' ? 'is-live' : '',
      m.status === 'done' ? 'is-done' : '',
    ].filter(Boolean).join(' ')}>

      {/* Grupo */}
      {showGroup && <div className="m-group-tag">GR.{m.group}</div>}

      {/* Equipos + score */}
      <div className="m-main">
        <div className="m-teams">
          <Link href={`/equipo/${m.home.slug}`} className="m-team">
            <span className="m-flag">{m.home.flag}</span>
            <span className="m-tname">{m.home.name}</span>
          </Link>
          {scoreEl}
          <Link href={`/equipo/${m.away.slug}`} className="m-team right">
            <span className="m-flag">{m.away.flag}</span>
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
    </div>
  )
}
