import Link from 'next/link'
import type { Match } from '@/types'

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

  const badge = m.status === 'live'
    ? <span className="badge-live-s">EN VIVO {m.clock}</span>
    : m.status === 'done'
      ? <span className="badge-done-s">Final</span>
      : null

  return (
    <div className={`match-row${m.isArgentina ? ' arg' : ''}${m.status === 'live' ? ' is-live' : ''}`}>
      {showGroup && <div className="m-group-tag">GR.{m.group}</div>}
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
      <div className="m-right">
        {badge}
        <span className="m-venue-s">{m.venue}</span>
      </div>
    </div>
  )
}
