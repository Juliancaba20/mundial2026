import Link from 'next/link'
import type { Match } from '@/types'
import { MatchTime } from './MatchTime'
import { TeamFlag } from './TeamFlag'

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
            <TeamFlag code={m.home.flagCode} name={m.home.name} size={18} className="m-flag-img" />
            <span className="m-tname">{m.home.name}</span>
          </Link>
          {scoreEl}
          <Link href={`/equipo/${m.away.slug}`} className="m-team right">
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
    </div>
  )
}
