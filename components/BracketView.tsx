'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import type { BracketMatch, BracketRound, BracketSlot, LiveResultsMap, Match } from '@/types'
import { buildBracket, ROUND_LABELS, ROUND_DATES, BRACKET_ROUNDS } from '@/lib/bracket'
import { BASE_MATCHES } from '@/lib/data'

// ─── Aplicar resultados ESPN al array de partidos base ────────────────────────
function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

// ─── Bandera real via flagcdn.com ─────────────────────────────────────────────
function Flag({ code, name, size = 24 }: { code: string; name: string; size?: number }) {
  const [error, setError] = useState(false)
  if (error) {
    return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>⚽</span>
  }
  return (
    <img
      src={`https://flagcdn.com/w${size * 2}/${code.toLowerCase()}.png`}
      alt={name}
      width={size * 1.5}
      height={size}
      style={{ objectFit: 'cover', borderRadius: 2, display: 'block', flexShrink: 0 }}
      onError={() => setError(true)}
    />
  )
}

// ─── Slot de equipo dentro de un partido ──────────────────────────────────────
function SlotRow({
  slot,
  score,
  isWinner,
  compact,
}: {
  slot: BracketSlot
  score?: string
  isWinner?: boolean
  compact?: boolean
}) {
  const hasTeam = !!slot.team

  return (
    <div className={`br-slot${isWinner ? ' br-winner' : ''}${!hasTeam ? ' br-empty' : ''}`}>
      <div className="br-slot-left">
        {hasTeam && slot.team ? (
          <>
            <Flag code={slot.team.flagCode} name={slot.team.name} size={compact ? 16 : 18} />
            <span className="br-slot-name">
              {compact
                ? slot.team.name.split(' ')[0]  // primera palabra en compact
                : slot.team.name}
            </span>
          </>
        ) : (
          <span className="br-slot-label">{slot.label}</span>
        )}
      </div>
      {score !== undefined && (
        <span className={`br-slot-score${isWinner ? ' br-slot-score-win' : ''}`}>
          {score}
        </span>
      )}
    </div>
  )
}

// ─── Tarjeta de partido ───────────────────────────────────────────────────────
function MatchCard({
  match,
  compact = false,
  highlight = false,
}: {
  match: BracketMatch
  compact?: boolean
  highlight?: boolean
}) {
  const [homeScore, awayScore] = match.home.score !== undefined
    ? [match.home.score, match.away.score]
    : [undefined, undefined]

  const isLive = match.status === 'live'
  const isDone = match.status === 'done'

  return (
    <div className={`br-match${highlight ? ' br-match-highlight' : ''}${isLive ? ' br-match-live' : ''}`}>
      <div className="br-match-date">
        {match.date}
        {isLive && <span className="br-live-badge">EN VIVO</span>}
      </div>
      <SlotRow
        slot={match.home}
        score={homeScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(homeScore) > Number(awayScore)}
        compact={compact}
      />
      <div className="br-divider" />
      <SlotRow
        slot={match.away}
        score={awayScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(awayScore) > Number(homeScore)}
        compact={compact}
      />
    </div>
  )
}

// ─── Columna de una ronda ─────────────────────────────────────────────────────
function RoundColumn({
  round,
  matches,
  totalRounds,
  roundIndex,
}: {
  round: BracketRound
  matches: BracketMatch[]
  totalRounds: number
  roundIndex: number
}) {
  const isFinal = round === 'F'

  return (
    <div className={`br-round-col${isFinal ? ' br-round-final' : ''}`}>
      <div className="br-round-header">
        <div className="br-round-name">{ROUND_LABELS[round]}</div>
        <div className="br-round-date">{ROUND_DATES[round]}</div>
      </div>
      <div className="br-round-matches">
        {matches.map(m => (
          <div key={m.id} className="br-match-wrapper">
            <MatchCard match={m} compact={round === 'R32'} highlight={round === 'F'} />
            {/* Línea conectora hacia la siguiente ronda */}
            {m.nextMatchId && roundIndex < totalRounds - 1 && (
              <div className={`br-connector br-connector-${m.nextPosition}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vista de tercer puesto y final ───────────────────────────────────────────
function FinalSection({ bracket }: { bracket: BracketMatch[] }) {
  const final = bracket.find(m => m.round === 'F')
  const third = bracket.find(m => m.round === '3RD')

  return (
    <div className="br-final-section">
      {final && (
        <div className="br-final-wrap">
          <div className="br-final-label">⭐ GRAN FINAL</div>
          <div className="br-final-date">{ROUND_DATES['F']}</div>
          <MatchCard match={final} highlight />
        </div>
      )}
      {third && (
        <div className="br-third-wrap">
          <div className="br-third-label">🥉 TERCER PUESTO</div>
          <div className="br-final-date">{ROUND_DATES['3RD']}</div>
          <MatchCard match={third} />
        </div>
      )}
    </div>
  )
}

// ─── Bracket desktop ──────────────────────────────────────────────────────────
function BracketDesktop({ bracket }: { bracket: BracketMatch[] }) {
  const rounds = BRACKET_ROUNDS

  return (
    <div className="br-desktop">
      <div className="br-scroll-container">
        <div className="br-tree">
          {rounds.filter(r => r !== 'F').map((round, ri) => {
            const matches = bracket.filter(m => m.round === round)
            return (
              <RoundColumn
                key={round}
                round={round}
                matches={matches}
                totalRounds={rounds.length}
                roundIndex={ri}
              />
            )
          })}
          {/* La final va en el centro como elemento especial */}
          <FinalSection bracket={bracket} />
          {/* Espejo: rondas de derecha a izquierda */}
          {[...rounds.filter(r => r !== 'F')].reverse().map((round, ri) => {
            const matches = bracket.filter(m => m.round === round)
            return (
              <RoundColumn
                key={`${round}-right`}
                round={round}
                matches={matches}
                totalRounds={rounds.length}
                roundIndex={ri}
              />
            )
          })}
        </div>
      </div>
      <div className="br-scroll-hint">← Deslizá para ver el bracket completo →</div>
    </div>
  )
}

// ─── Bracket mobile (tabs por ronda) ─────────────────────────────────────────
function BracketMobile({ bracket }: { bracket: BracketMatch[] }) {
  const allRounds: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F', '3RD']
  const [activeRound, setActiveRound] = useState<BracketRound>('R32')

  const matches = bracket.filter(m => m.round === activeRound)

  return (
    <div className="br-mobile">
      {/* Tabs de ronda */}
      <div className="br-mobile-tabs">
        {allRounds.map(r => (
          <button
            key={r}
            className={`br-tab-btn${activeRound === r ? ' active' : ''}`}
            onClick={() => setActiveRound(r)}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="br-mobile-date">{ROUND_DATES[activeRound]}</div>

      <div className="br-mobile-matches">
        {matches.map(m => (
          <MatchCard key={m.id} match={m} highlight={m.round === 'F'} />
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function BracketView() {
  const [bracket, setBracket] = useState<BracketMatch[]>(() => buildBracket(BASE_MATCHES))
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchAndRebuild = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const results: LiveResultsMap = await res.json()
      const updatedMatches = applyResults(BASE_MATCHES, results)
      setBracket(buildBracket(updatedMatches))
      setLastUpdated(
        new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      )
    } catch { /* mantiene el bracket base */ }
  }, [])

  useEffect(() => {
    fetchAndRebuild()
    const id = setInterval(fetchAndRebuild, 60_000)
    return () => clearInterval(id)
  }, [fetchAndRebuild])

  return (
    <div className="br-root">
      <div className="br-header">
        <div className="br-status">
          <span className="live-dot" />
          {lastUpdated ? `Actualizado ${lastUpdated}` : 'Cargando clasificados…'}
        </div>
        <button className="refresh-btn" onClick={fetchAndRebuild}>↻ Actualizar</button>
      </div>

      {/* Desktop */}
      <BracketDesktop bracket={bracket} />

      {/* Mobile */}
      <BracketMobile bracket={bracket} />
    </div>
  )
}
