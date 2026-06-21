'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { BracketMatch, BracketRound, BracketSlot, LiveResultsMap, KnockoutResultsMap, Match } from '@/types'
import { buildBracket, ROUND_LABELS, ROUND_DATES } from '@/lib/bracket'
import { BASE_MATCHES } from '@/lib/data'
import { TeamFlag } from './TeamFlag'

// ─── Aplicar resultados ESPN al array de partidos base ────────────────────────
function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

// ─── Slot de equipo dentro de un partido ──────────────────────────────────────
function SlotRow({
  slot,
  score,
  isWinner,
  scale,
}: {
  slot: BracketSlot
  score?: string
  isWinner?: boolean
  scale: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const hasTeam = !!slot.team
  const flagSize = scale === 'sm' ? 16 : scale === 'md' ? 18 : scale === 'lg' ? 20 : 22

  return (
    <div className={`br-slot${isWinner ? ' br-winner' : ''}${!hasTeam ? ' br-empty' : ''}`}>
      <div className="br-slot-left">
        {hasTeam && slot.team ? (
          <>
            <TeamFlag code={slot.team.flagCode} name={slot.team.name} size={flagSize} />
            <span className="br-slot-name">{slot.team.name}</span>
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

// ─── Hora local del navegador a partir del kickoff ISO UTC ────────────────────
function useLocalKickoff(kickoff?: string): { dayLabel: string; time: string } | null {
  const [value, setValue] = useState<{ dayLabel: string; time: string } | null>(null)
  useEffect(() => {
    if (!kickoff) { setValue(null); return }
    const d = new Date(kickoff)
    if (isNaN(d.getTime())) { setValue(null); return }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setValue({
      dayLabel: d.toLocaleDateString('es', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString('es', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
    })
  }, [kickoff])
  return value
}

// ─── Tarjeta de partido ───────────────────────────────────────────────────────
function MatchCard({
  match,
  scale = 'md',
  highlight = false,
}: {
  match: BracketMatch
  scale?: 'sm' | 'md' | 'lg' | 'xl'
  highlight?: boolean
}) {
  const [homeScore, awayScore] = match.home.score !== undefined
    ? [match.home.score, match.away.score]
    : [undefined, undefined]

  const isLive = match.status === 'live'
  const isDone = match.status === 'done'
  const localTime = useLocalKickoff(match.kickoff)

  let headerContent: ReactNode
  if (isLive) {
    headerContent = (
      <>
        {match.date}
        <span className="br-live-badge">EN VIVO{match.clock ? ` ${match.clock}` : ''}</span>
      </>
    )
  } else if (isDone) {
    headerContent = (
      <>
        <span className="br-final-tag">Final</span>
        {match.date}
      </>
    )
  } else {
    headerContent = localTime
      ? (
        <>
          {localTime.dayLabel}
          <span className="br-kickoff-time">{localTime.time} hs</span>
        </>
      )
      : match.date
  }

  return (
    <div className={`br-match br-scale-${scale}${highlight ? ' br-match-highlight' : ''}${isLive ? ' br-match-live' : ''}${isDone ? ' br-match-done' : ''}`}>
      <div className="br-match-date">{headerContent}</div>
      <SlotRow
        slot={match.home}
        score={homeScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(homeScore) > Number(awayScore)}
        scale={scale}
      />
      <div className="br-divider" />
      <SlotRow
        slot={match.away}
        score={awayScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(awayScore) > Number(homeScore)}
        scale={scale}
      />
    </div>
  )
}

// ─── Escala por ronda en layout vertical ──────────────────────────────────────
const ROUND_SCALE: Record<BracketRound, 'sm' | 'md' | 'lg' | 'xl'> = {
  R32: 'sm', R16: 'sm', QF: 'md', SF: 'lg', F: 'xl', '3RD': 'md',
}

// ─── Columnas por ronda (cuántas cards se muestran en fila) ───────────────────
const ROUND_COLS: Record<BracketRound, number> = {
  R32: 2, R16: 2, QF: 2, SF: 2, F: 1, '3RD': 1,
}

// ─── Sección de una ronda en layout vertical ──────────────────────────────────
function RoundSection({
  round,
  matches,
  sectionRef,
}: {
  round: BracketRound
  matches: BracketMatch[]
  sectionRef?: React.RefObject<HTMLDivElement | null>
}) {
  const allFuture = matches.every(m => !m.home.team && !m.away.team)
  const cols = ROUND_COLS[round]
  const scale = ROUND_SCALE[round]

  return (
    <div
      ref={sectionRef}
      className={`brv-section${allFuture ? ' brv-section-future' : ''}`}
      data-round={round}
    >
      <div className="brv-section-header">
        <div className="brv-section-name">{ROUND_LABELS[round]}</div>
        <div className="brv-section-date">{ROUND_DATES[round]}</div>
      </div>
      <div className={`brv-grid brv-grid-${cols}`}>
        {matches.map(m => (
          <MatchCard key={m.id} match={m} scale={scale} highlight={round === 'F'} />
        ))}
      </div>
    </div>
  )
}

// ─── Sección especial: Final + Tercer Puesto ──────────────────────────────────
function FinalSections({
  bracket,
  finalRef,
}: {
  bracket: BracketMatch[]
  finalRef?: React.RefObject<HTMLDivElement | null>
}) {
  const final = bracket.find(m => m.round === 'F')
  const third = bracket.find(m => m.round === '3RD')

  return (
    <>
      {/* GRAN FINAL */}
      <div ref={finalRef} className="brv-section brv-section-final" data-round="F">
        <div className="brv-section-header">
          <div className="brv-final-crown">🏆</div>
          <div className="brv-section-name brv-section-name-final">Gran Final</div>
          <div className="brv-section-date">{ROUND_DATES['F']}</div>
        </div>
        {final && (
          <div className="brv-final-card-wrap">
            <MatchCard match={final} scale="xl" highlight />
          </div>
        )}
      </div>

      {/* TERCER PUESTO */}
      <div className="brv-section brv-section-third" data-round="3RD">
        <div className="brv-section-header">
          <div className="brv-third-crown">🥉</div>
          <div className="brv-section-name">Tercer Puesto</div>
          <div className="brv-section-date">{ROUND_DATES['3RD']}</div>
        </div>
        {third && (
          <div className="brv-third-card-wrap">
            <MatchCard match={third} scale="md" />
          </div>
        )}
      </div>
    </>
  )
}

// ─── Layout vertical principal ────────────────────────────────────────────────
function BracketVertical({ bracket }: { bracket: BracketMatch[] }) {
  const sectionRefs = useRef<Map<BracketRound, HTMLDivElement>>(new Map())

  // Auto-scroll a la ronda activa más avanzada
  useEffect(() => {
    const roundOrder: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']
    const activeRound = roundOrder.find(r =>
      bracket.some(m => m.round === r && (m.status === 'pending' || m.status === 'live'))
    ) ?? 'F'
    const el = sectionRefs.current.get(activeRound)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [bracket])

  const mainRounds: BracketRound[] = ['R32', 'R16', 'QF', 'SF']

  return (
    <div className="brv-root">
      {mainRounds.map(round => {
        const matches = bracket.filter(m => m.round === round)
        return (
          <RoundSection
            key={round}
            round={round}
            matches={matches}
            sectionRef={{
              current: null,
              ...{} // inline workaround; usamos callback ref abajo
            } as React.RefObject<HTMLDivElement | null>}
          />
        )
      })}
      <FinalSections bracket={bracket} />
    </div>
  )
}

// Versión con callback refs para el auto-scroll
function BracketVerticalWithRefs({ bracket }: { bracket: BracketMatch[] }) {
  const refsMap = useRef<Map<BracketRound, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    const roundOrder: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']
    const activeRound = roundOrder.find(r =>
      bracket.some(m => m.round === r && (m.status === 'pending' || m.status === 'live'))
    ) ?? 'F'
    const el = refsMap.current.get(activeRound)
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [bracket])

  const mainRounds: BracketRound[] = ['R32', 'R16', 'QF', 'SF']

  return (
    <div className="brv-root">
      {mainRounds.map(round => {
        const matches = bracket.filter(m => m.round === round)
        const allFuture = matches.every(m => !m.home.team && !m.away.team)
        const cols = ROUND_COLS[round]
        const scale = ROUND_SCALE[round]
        return (
          <div
            key={round}
            ref={el => { refsMap.current.set(round, el) }}
            className={`brv-section${allFuture ? ' brv-section-future' : ''}`}
            data-round={round}
          >
            <div className="brv-section-header">
              <div className="brv-section-name">{ROUND_LABELS[round]}</div>
              <div className="brv-section-date">{ROUND_DATES[round]}</div>
            </div>
            <div className={`brv-grid brv-grid-${cols}`}>
              {matches.map(m => (
                <MatchCard key={m.id} match={m} scale={scale} highlight={false} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Gran Final */}
      {(() => {
        const final = bracket.find(m => m.round === 'F')
        const third = bracket.find(m => m.round === '3RD')
        return (
          <>
            <div
              ref={el => { refsMap.current.set('F', el) }}
              className="brv-section brv-section-final"
              data-round="F"
            >
              <div className="brv-section-header">
                <div className="brv-final-crown">🏆</div>
                <div className="brv-section-name brv-section-name-final">Gran Final</div>
                <div className="brv-section-date">{ROUND_DATES['F']}</div>
              </div>
              {final && (
                <div className="brv-final-card-wrap">
                  <MatchCard match={final} scale="xl" highlight />
                </div>
              )}
            </div>
            <div className="brv-section brv-section-third" data-round="3RD">
              <div className="brv-section-header">
                <div className="brv-third-crown">🥉</div>
                <div className="brv-section-name">Tercer Puesto</div>
                <div className="brv-section-date">{ROUND_DATES['3RD']}</div>
              </div>
              {third && (
                <div className="brv-third-card-wrap">
                  <MatchCard match={third} scale="md" />
                </div>
              )}
            </div>
          </>
        )
      })()}
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
      const data: { results: LiveResultsMap; knockoutResults: KnockoutResultsMap } = await res.json()
      const updatedMatches = applyResults(BASE_MATCHES, data.results ?? {})
      setBracket(buildBracket(updatedMatches, data.knockoutResults ?? {}))
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
      <BracketVerticalWithRefs bracket={bracket} />
    </div>
  )
}
