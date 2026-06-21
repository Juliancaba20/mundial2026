import type { BracketMatch, BracketSlot } from '@/types'
import { TeamFlag } from './TeamFlag'
import { MatchTime } from './MatchTime'

// Renderiza un slot de bracket (equipo real o placeholder con label)
function SlotDisplay({ slot, side }: { slot: BracketSlot; side: 'home' | 'away' }) {
  const isRight = side === 'away'

  if (!slot.team) {
    return (
      <div className={`bm-team${isRight ? ' right' : ''}`}>
        <span className="bm-placeholder">{slot.label}</span>
      </div>
    )
  }

  return (
    <div className={`bm-team${isRight ? ' right' : ''}`}>
      <TeamFlag
        code={slot.team.flagCode}
        name={slot.team.name}
        size={18}
        className="m-flag-img"
      />
      <span className="m-tname">{slot.team.name}</span>
    </div>
  )
}

interface Props {
  match: BracketMatch
  roundLabel?: string  // ej: "16avos" — solo para filas sueltas sin encabezado de fase
}

export function BracketMatchRow({ match: m, roundLabel }: Props) {
  const isLive = m.status === 'live'
  const isDone = m.status === 'done'
  const isPending = m.status === 'pending'
  const isFinal = m.round === 'F'
  const isThird = m.round === '3RD'

  // Score desde los slots (bracket lo almacena ahí)
  const homeScore = m.home.score
  const awayScore = m.away.score
  const hasScore = homeScore !== undefined && awayScore !== undefined

  let scoreEl: React.ReactNode
  if (isLive && hasScore) {
    scoreEl = <div className="m-score-box live-s">{homeScore} – {awayScore}</div>
  } else if (isDone && hasScore) {
    scoreEl = <div className="m-score-box">{homeScore} – {awayScore}</div>
  } else {
    scoreEl = <div className="m-score-box pending">vs</div>
  }

  const rowClass = [
    'match-row',
    'bm-row',
    isFinal ? 'bm-final' : '',
    isThird ? 'bm-third' : '',
    isLive ? 'is-live' : '',
    isDone ? 'is-done' : '',
  ].filter(Boolean).join(' ')

  // Fecha de display para MatchTime fallback
  const dateFallback = m.date

  return (
    <div className={rowClass}>
      {/* Etiqueta de ronda (opcional) */}
      {roundLabel && (
        <div className="m-group-tag bm-round-tag">{roundLabel}</div>
      )}

      {/* Equipos + score */}
      <div className="m-main">
        <div className="m-teams">
          <SlotDisplay slot={m.home} side="home" />
          {scoreEl}
          <SlotDisplay slot={m.away} side="away" />
        </div>

        {/* Meta: hora + estado */}
        <div className="m-meta-row">
          {m.kickoff ? (
            <MatchTime
              kickoff={m.kickoff}
              status={m.status}
              clock={m.clock}
              date={dateFallback}
            />
          ) : (
            <span className="mt-pending">
              <span className="mt-date">{dateFallback}</span>
            </span>
          )}
          {isPending && !m.home.team && !m.away.team && (
            <span className="bm-tbd-tag">por definir</span>
          )}
        </div>
      </div>
    </div>
  )
}
