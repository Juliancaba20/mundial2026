'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import type { BracketMatch, BracketRound, BracketSlot, LiveResultsMap, KnockoutResultsMap, Match } from '@/types'
import { buildBracket, ROUND_LABELS, ROUND_DATES } from '@/lib/bracket'
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
            <Flag code={slot.team.flagCode} name={slot.team.name} size={flagSize} />
            <span className="br-slot-name">
              {scale === 'sm'
                ? slot.team.name.split(' ')[0]  // primera palabra en R32
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

  return (
    <div className={`br-match br-scale-${scale}${highlight ? ' br-match-highlight' : ''}${isLive ? ' br-match-live' : ''}`}>
      <div className="br-match-date">
        {match.date}
        {isLive && <span className="br-live-badge">EN VIVO</span>}
      </div>
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

// ─── Geometría del árbol ───────────────────────────────────────────────────────
// Unidad base = altura efectiva (card + gap) de un partido de 16avos (R32).
// Cada ronda siguiente tiene el doble de altura por partido que la anterior,
// y cada card se centra exactamente entre sus dos alimentadores de la ronda
// previa. Esto reemplaza `space-around` (aproximado) por posiciones calculadas
// (exactas), que es lo que permite que los conectores SVG calcen sin errores.
const UNIT = 88 // alto de slot en R32, en px — ajustá esto si cambia el tamaño de card

// Cuántos "slots" de R32 ocupa una ronda determinada (R32=1, R16=2, QF=4, SF=8)
const ROUND_SPAN: Record<BracketRound, number> = {
  R32: 1, R16: 2, QF: 4, SF: 8, F: 16, '3RD': 16,
}

// Tamaño visual de card por ronda — crece hacia la final
const ROUND_SCALE: Record<BracketRound, 'sm' | 'md' | 'lg' | 'xl'> = {
  R32: 'sm', R16: 'md', QF: 'md', SF: 'lg', F: 'xl', '3RD': 'md',
}

// ─── Partición del árbol en mitad izquierda / derecha ─────────────────────────
// El bracket real del Mundial tiene dos mitades: una que confluye en SF-1 y
// otra que confluye en SF-2. Esto solo lee `nextMatchId` (ya generado por
// lib/bracket.ts) para clasificar cada partido — no recalcula ni reordena
// ninguna lógica del cuadro.
function splitBracketHalves(bracket: BracketMatch[]) {
  const sf = bracket.filter(m => m.round === 'SF')
  const sf1 = sf.find(m => m.id === 'SF-1')
  const sf2 = sf.find(m => m.id === 'SF-2')

  const idToMatch = new Map(bracket.map(m => [m.id, m]))

  // Para cada partido, sigue la cadena de nextMatchId hasta llegar a SF-1 o SF-2
  function belongsToSF1(m: BracketMatch): boolean {
    let cur: BracketMatch | undefined = m
    const seen = new Set<string>()
    while (cur && cur.round !== 'SF' && cur.nextMatchId && !seen.has(cur.id)) {
      seen.add(cur.id)
      cur = idToMatch.get(cur.nextMatchId)
    }
    if (cur?.id === 'SF-1') return true
    if (cur?.id === 'SF-2') return false
    return true // fallback defensivo, no debería ocurrir con el cuadro oficial
  }

  const left = { R32: [] as BracketMatch[], R16: [] as BracketMatch[], QF: [] as BracketMatch[], SF: sf1 ? [sf1] : [] }
  const right = { R32: [] as BracketMatch[], R16: [] as BracketMatch[], QF: [] as BracketMatch[], SF: sf2 ? [sf2] : [] }

  for (const round of ['R32', 'R16', 'QF'] as const) {
    for (const m of bracket.filter(x => x.round === round)) {
      if (belongsToSF1(m)) left[round].push(m)
      else right[round].push(m)
    }
  }

  return { left, right }
}
function RoundColumn({
  round,
  matches,
  side,
  treeHeight,
}: {
  round: BracketRound
  matches: BracketMatch[]
  side: 'left' | 'right'
  treeHeight: number
}) {
  const span = ROUND_SPAN[round]
  const allFuture = matches.every(m => !m.home.team && !m.away.team)

  return (
    <div
      className={`br-round-col${allFuture ? ' br-round-future' : ''}`}
      data-round={round}
      style={{ height: treeHeight }}
    >
      <div className="br-round-header">
        <div className="br-round-name">{ROUND_LABELS[round]}</div>
        <div className="br-round-date">{ROUND_DATES[round]}</div>
      </div>
      <div className="br-round-matches" style={{ height: treeHeight }}>
        {matches.map((m, i) => {
          const slotHeight = span * UNIT
          const center = slotHeight * i + slotHeight / 2
          const isSF = round === 'SF'
          // Fase 5: conector iluminado en verde cuando el partido está resuelto
          const isDone = m.status === 'done'

          return (
            <div
              key={m.id}
              className="br-match-wrapper"
              style={{ top: center, transform: 'translateY(-50%)' }}
            >
              <MatchCard match={m} scale={ROUND_SCALE[round]} highlight={round === 'F'} />

              {m.nextMatchId && !isSF && (
                <svg
                  className={`br-connector br-connector-${side} br-connector-${m.nextPosition}${isDone ? ' br-connector-done' : ''}`}
                  width={28}
                  height={slotHeight}
                  viewBox={`0 0 28 ${slotHeight}`}
                  preserveAspectRatio="none"
                >
                  <path
                    d={
                      side === 'left'
                        ? `M0,${slotHeight / 2} H14 V${m.nextPosition === 'home' ? slotHeight : 0} H28`
                        : `M28,${slotHeight / 2} H14 V${m.nextPosition === 'home' ? slotHeight : 0} H0`
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {isSF && (
                <div className={`br-sf-connector br-sf-connector-${side}${isDone ? ' br-connector-done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vista de tercer puesto y final ───────────────────────────────────────────
function FinalSection({ bracket, treeHeight }: { bracket: BracketMatch[]; treeHeight: number }) {
  const final = bracket.find(m => m.round === 'F')
  const third = bracket.find(m => m.round === '3RD')

  return (
    <div className="br-final-col" style={{ height: treeHeight }}>
      <div className="br-round-header">
        <div className="br-round-name">Final</div>
        <div className="br-round-date">{ROUND_DATES['F']}</div>
      </div>
      <div
        className="br-final-section"
        style={{ top: treeHeight / 2, transform: 'translateY(-50%)' }}
      >
        {final && (
          <div className="br-final-wrap">
            <div className="br-final-label">⭐ GRAN FINAL</div>
            <MatchCard match={final} scale="xl" highlight />
          </div>
        )}
        {third && (
          <div className="br-third-wrap">
            <div className="br-third-label">🥉 TERCER PUESTO</div>
            <div className="br-final-date">{ROUND_DATES['3RD']}</div>
            <MatchCard match={third} scale="md" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bracket desktop ──────────────────────────────────────────────────────────
function BracketDesktop({ bracket }: { bracket: BracketMatch[] }) {
  const roundsLeftToRight: Array<'R32' | 'R16' | 'QF' | 'SF'> = ['R32', 'R16', 'QF', 'SF']
  const treeHeight = ROUND_SPAN.SF * UNIT
  const { left, right } = splitBracketHalves(bracket)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fase 6: al cargar, centra en la ronda activa más avanzada.
  // "Activa" = primera ronda que aún tiene partidos pending o live.
  // Si todo está resuelto, centra en la Final.
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const roundOrder: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']
    const activeRound = roundOrder.find(r =>
      bracket.some(m => m.round === r && (m.status === 'pending' || m.status === 'live'))
    ) ?? 'F'
    const targetCol = container.querySelector<HTMLElement>(
      `.br-round-col[data-round="${activeRound}"]`
    )
    if (!targetCol) return
    const colLeft = targetCol.offsetLeft
    const colWidth = targetCol.offsetWidth
    container.scrollLeft = colLeft - (container.clientWidth - colWidth) / 2
  }, [bracket])

  return (
    <div className="br-desktop">
      <div className="br-scroll-container" ref={scrollRef}>
        <div className="br-tree" style={{ height: treeHeight }}>
          {roundsLeftToRight.map((round) => (
            <RoundColumn
              key={round}
              round={round}
              matches={left[round]}
              side="left"
              treeHeight={treeHeight}
            />
          ))}
          <FinalSection bracket={bracket} treeHeight={treeHeight} />
          {[...roundsLeftToRight].reverse().map((round) => (
            <RoundColumn
              key={`${round}-right`}
              round={round}
              matches={right[round]}
              side="right"
              treeHeight={treeHeight}
            />
          ))}
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

      {/* Desktop */}
      <BracketDesktop bracket={bracket} />

      {/* Mobile */}
      <BracketMobile bracket={bracket} />
    </div>
  )
}
