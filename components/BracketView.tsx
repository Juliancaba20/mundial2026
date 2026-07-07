'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { BracketMatch, BracketRound, BracketSlot, LiveResultsMap, KnockoutResultsMap, Match } from '@/types'
import { buildBracket, ROUND_LABELS, ROUND_DATES } from '@/lib/bracket'
import { BASE_MATCHES } from '@/lib/data'
import { TeamFlag } from './TeamFlag'
import { motion } from 'motion/react'


// ─── Aplicar resultados ESPN al array de partidos base ────────────────────────
function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

// ─── Hora local ───────────────────────────────────────────────────────────────
function useLocalKickoff(kickoff?: string): { dayLabel: string; time: string } | null {
  const [value, setValue] = useState<{ dayLabel: string; time: string } | null>(null)
  useEffect(() => {
    if (!kickoff) {
      setTimeout(() => setValue(null), 0)
      return
    }
    const d = new Date(kickoff)
    if (isNaN(d.getTime())) {
      setTimeout(() => setValue(null), 0)
      return
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const calculated = {
      dayLabel: d.toLocaleDateString('es', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString('es', { timeZone: tz, hour: '2-digit', minute: '2-digit' }),
    }
    setTimeout(() => setValue(calculated), 0)
  }, [kickoff])
  return value
}

// ─── Slot ─────────────────────────────────────────────────────────────────────
function SlotRow({ slot, score, isWinner, scale }: {
  slot: BracketSlot; score?: string; isWinner?: boolean; scale: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const hasTeam = !!slot.team
  const flagSize = scale === 'sm' ? 14 : scale === 'md' ? 16 : scale === 'lg' ? 18 : 20
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
        <span className={`br-slot-score${isWinner ? ' br-slot-score-win' : ''}`}>{score}</span>
      )}
    </div>
  )
}

// ─── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({ match, scale = 'sm', highlight = false }: {
  match: BracketMatch; scale?: 'sm' | 'md' | 'lg' | 'xl'; highlight?: boolean
}) {
  const [homeScore, awayScore] = match.home.score !== undefined
    ? [match.home.score, match.away.score]
    : [undefined, undefined]
  const isLive = match.status === 'live'
  const isDone = match.status === 'done'
  const localTime = useLocalKickoff(match.kickoff)

  let headerContent: ReactNode
  if (isLive) {
    headerContent = <>{match.date}<span className="br-live-badge">EN VIVO{match.clock ? ` ${match.clock}` : ''}</span></>
  } else if (isDone) {
    headerContent = <><span className="br-final-tag">Final</span>{match.date}</>
  } else {
    headerContent = localTime
      ? <>{localTime.dayLabel}<span className="br-kickoff-time">{localTime.time}</span></>
      : match.date
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`br-match br-scale-${scale}${highlight ? ' br-match-highlight' : ''}${isLive ? ' br-match-live' : ''}${isDone ? ' br-match-done' : ''}`}
    >
      <div className="br-match-date">{headerContent}</div>
      <SlotRow slot={match.home} score={homeScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(homeScore) > Number(awayScore)}
        scale={scale} />
      <div className="br-divider" />
      <SlotRow slot={match.away} score={awayScore}
        isWinner={isDone && homeScore !== undefined && awayScore !== undefined && Number(awayScore) > Number(homeScore)}
        scale={scale} />
    </motion.div>
  )
}

// ─── Configuración del árbol ──────────────────────────────────────────────────
// UNIT: altura reservada por partido en la columna de R32 (la más densa)
// Cada ronda siguiente ocupa 2× el espacio, centrado entre sus dos "padres"
const UNIT = 104         // px por slot en R32
const CARD_H = 84        // altura aproximada de la card (2 slots + header + divider)
const COL_W = 200        // ancho de cada columna de partidos
const COL_GAP = 60       // gap entre columnas (espacio para conectores)

const ROUND_ORDER: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']

// ─── Orden visual del árbol (NO es el orden de creación en lib/bracket.ts) ────
// ConnectorLayer asume que el partido i de una ronda es alimentado por los
// partidos 2i y 2i+1 de la ronda anterior (posición en el array, no nextMatchId).
// Esa asunción es correcta SOLO si los arrays de cada ronda están ordenados así.
// El orden de definición en lib/bracket.ts es el "oficial" (R32-1..R32-16,
// R16-1..R16-8) y NO respeta esa asunción — por eso el árbol se veía mal
// armado visualmente (uníamos Sudáfrica/Canadá con Alemania/Paraguay cuando en
// realidad Canadá se cruza con el ganador de Países Bajos/Marruecos).
// Estos arrays reordenan cada ronda para el render, sin tocar id/nextMatchId.
const R32_VISUAL_ORDER = [
  'R32-1', 'R32-3', 'R32-2', 'R32-5', 'R32-12', 'R32-11', 'R32-10', 'R32-9',
  'R32-4', 'R32-6', 'R32-7', 'R32-8', 'R32-16', 'R32-14', 'R32-13', 'R32-15',
]
const R16_VISUAL_ORDER = ['R16-1', 'R16-2', 'R16-5', 'R16-6', 'R16-3', 'R16-4', 'R16-7', 'R16-8']
// QF y SF ya quedan en orden visual correcto con el orden de definición
// (QF-1,QF-2,QF-3,QF-4 / SF-1,SF-2) — no necesitan reordenarse.

function sortByVisualOrder(matches: BracketMatch[], order: string[]): BracketMatch[] {
  return [...matches].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
}

const ROUND_SCALE: Record<BracketRound, 'sm' | 'md' | 'lg' | 'xl'> = {
  R32: 'sm', R16: 'sm', QF: 'md', SF: 'lg', F: 'xl', '3RD': 'md',
}

// Calcula el top (px) de cada partido dentro de su columna
// R32: partido i → top = i * UNIT
// R16: partido i → top = (2i * UNIT) + UNIT/2 - CARD_H/2   (centrado entre dos R32)
// QF:  partido i → idem con 4× UNIT
// etc.
function calcTop(roundIndex: number, matchIndex: number): number {
  const span = Math.pow(2, roundIndex) // cuántos UNIT ocupa este partido
  return matchIndex * span * UNIT + (span * UNIT - CARD_H) / 2
}

// Altura total del árbol
function treeHeight(): number {
  return 16 * UNIT // 16 partidos × UNIT
}

// ─── SVG conectores entre columnas consecutivas ───────────────────────────────
// Para cada partido en la ronda destino, dibuja dos líneas desde sus dos "padres"
// en la ronda anterior hasta el borde izquierdo del partido actual.
function ConnectorLayer({ fromRoundIndex, fromMatches, toMatches }: {
  fromRoundIndex: number
  fromMatches: BracketMatch[]
  toMatches: BracketMatch[]
}) {
  const W = COL_GAP
  const H = treeHeight()

  const paths: string[] = []

  toMatches.forEach((toMatch, toIdx) => {
    const toTop = calcTop(fromRoundIndex + 1, toIdx)
    const toMid = toTop + CARD_H / 2

    // Los dos partidos padres corresponden a toIdx*2 y toIdx*2+1
    const parent1Idx = toIdx * 2
    const parent2Idx = toIdx * 2 + 1

    if (parent1Idx < fromMatches.length) {
      const p1Top = calcTop(fromRoundIndex, parent1Idx)
      const p1Mid = p1Top + CARD_H / 2
      const isDone = fromMatches[parent1Idx].status === 'done'
      // línea horizontal desde borde derecho del padre → mitad del gap, luego curva → entrada del hijo
      paths.push(`<path d="M 0 ${p1Mid} H ${W / 2} V ${toMid} H ${W}" fill="none" stroke="${isDone ? 'var(--green)' : 'var(--border2)'}" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="square"/>`)
    }
    if (parent2Idx < fromMatches.length) {
      const p2Top = calcTop(fromRoundIndex, parent2Idx)
      const p2Mid = p2Top + CARD_H / 2
      const isDone = fromMatches[parent2Idx].status === 'done'
      paths.push(`<path d="M 0 ${p2Mid} H ${W / 2} V ${toMid} H ${W}" fill="none" stroke="${isDone ? 'var(--green)' : 'var(--border2)'}" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="square"/>`)
    }
  })

  return (
    <div className="brt-connector-col" style={{ width: COL_GAP, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: paths.join('') }} />
    </div>
  )
}

// ─── Columna de una ronda ─────────────────────────────────────────────────────
function RoundColumn({ round, matches, roundIndex }: {
  round: BracketRound; matches: BracketMatch[]; roundIndex: number
}) {
  const H = treeHeight()
  const scale = ROUND_SCALE[round]
  const allFuture = matches.every(m => !m.home.team && !m.away.team)

  return (
    <div className={`brt-col${allFuture ? ' brt-col-future' : ''}`} style={{ width: COL_W, height: H }}>
      <div className="brt-round-header">
        <div className="brt-round-name">{ROUND_LABELS[round]}</div>
        <div className="brt-round-date">{ROUND_DATES[round]}</div>
      </div>
      <div className="brt-col-body" style={{ position: 'relative', height: H }}>
        {matches.map((match, idx) => (
          <div key={match.id} className="brt-match-pos" style={{ top: calcTop(roundIndex, idx) }}>
            <MatchCard match={match} scale={scale} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Columna final (F + 3RD) ──────────────────────────────────────────────────
function FinalColumn({ finalMatch, thirdMatch }: {
  finalMatch?: BracketMatch; thirdMatch?: BracketMatch
}) {
  const H = treeHeight()
  // Final: centrada verticalmente en el árbol
  const finalTop = (H - CARD_H * 1.6) / 2 - 40 // un poco arriba del centro para dejar espacio al 3RD
  const thirdTop = finalTop + CARD_H * 1.6 + 32

  return (
    <div className="brt-col brt-col-final" style={{ width: COL_W + 30, height: H }}>
      <div className="brt-round-header">
        <div className="brt-round-name brt-final-name">Final</div>
        <div className="brt-round-date">{ROUND_DATES['F']}</div>
      </div>
      <div className="brt-col-body" style={{ position: 'relative', height: H }}>
        {finalMatch && (
          <div className="brt-match-pos" style={{ top: finalTop }}>
            <MatchCard match={finalMatch} scale="xl" highlight />
          </div>
        )}
        {thirdMatch && (
          <div className="brt-match-pos" style={{ top: thirdTop }}>
            <div className="brt-third-label">Tercer Puesto</div>
            <div className="brt-third-date">{ROUND_DATES['3RD']}</div>
            <MatchCard match={thirdMatch} scale="md" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SF → F conector especial (2 SF → 1 F) ────────────────────────────────────
function SFtoFConnector({ sfMatches, finalMatch }: {
  sfMatches: BracketMatch[]; finalMatch?: BracketMatch
}) {
  const W = COL_GAP
  const H = treeHeight()
  if (!finalMatch) return <div style={{ width: COL_GAP, height: H }} />

  const finalTop = (H - CARD_H * 1.6) / 2 - 40
  const fMid = finalTop + CARD_H * 0.8

  const paths: string[] = []
  sfMatches.forEach((sfMatch, idx) => {
    const sfTop = calcTop(3, idx) // roundIndex 3 = SF
    const sfMid = sfTop + CARD_H / 2
    const isDone = sfMatch.status === 'done'
    const stroke = isDone ? 'var(--green)' : 'var(--border2)'
    paths.push(`<path d="M 0 ${sfMid} H ${W / 2} V ${fMid} H ${W}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="square"/>`)
  })

  return (
    <div className="brt-connector-col" style={{ width: COL_GAP, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: paths.join('') }} />
    </div>
  )
}

// ─── Árbol desktop (scroll horizontal contenido) ──────────────────────────────
function BracketTree({ bracket }: { bracket: BracketMatch[] }) {
  const byRound = (r: BracketRound) => bracket.filter(m => m.round === r)
  const r32 = byRound('R32')
  const r16 = byRound('R16')
  const qf  = byRound('QF')
  const sf  = byRound('SF')
  const finalMatch = bracket.find(m => m.round === 'F')
  const thirdMatch = bracket.find(m => m.round === '3RD')

  return (
    <div className="brt-scroll-wrap">
      <div className="brt-tree">
        {/* R32 */}
        <RoundColumn round="R32" matches={r32} roundIndex={0} />
        <ConnectorLayer fromRoundIndex={0} fromMatches={r32} toMatches={r16} />
        {/* R16 */}
        <RoundColumn round="R16" matches={r16} roundIndex={1} />
        <ConnectorLayer fromRoundIndex={1} fromMatches={r16} toMatches={qf} />
        {/* QF */}
        <RoundColumn round="QF" matches={qf} roundIndex={2} />
        <ConnectorLayer fromRoundIndex={2} fromMatches={qf} toMatches={sf} />
        {/* SF */}
        <RoundColumn round="SF" matches={sf} roundIndex={3} />
        <SFtoFConnector sfMatches={sf} finalMatch={finalMatch} />
        {/* FINAL + 3RD */}
        <FinalColumn finalMatch={finalMatch} thirdMatch={thirdMatch} />
      </div>
    </div>
  )
}

// ─── Vista mobile: tabs por ronda, lista de cards ─────────────────────────────
const MOBILE_ROUNDS: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F', '3RD']
const MOBILE_LABELS: Record<BracketRound, string> = {
  R32: '16avos', R16: 'Octavos', QF: 'Cuartos', SF: 'Semis', F: 'Final', '3RD': '3° Puesto'
}

function BracketMobileTabs({ bracket }: { bracket: BracketMatch[] }) {
  const [active, setActive] = useState<BracketRound>('R32')

  // auto-advance to most active round
  useEffect(() => {
    const order: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']
    const activeRound = order.find(r =>
      bracket.some(m => m.round === r && (m.status === 'pending' || m.status === 'live'))
    )
    if (activeRound) {
      setTimeout(() => {
        setActive(activeRound)
      }, 0)
    }
  }, [bracket])

  const matches = bracket.filter(m => m.round === active)
  const scale = ROUND_SCALE[active]

  return (
    <div className="brm-root">
      <div className="brm-tabs">
        {MOBILE_ROUNDS.map(r => {
          const isSelected = active === r
          return (
            <button
              key={r}
              className={`brm-tab${isSelected ? ' active' : ''}`}
              onClick={() => setActive(r)}
              style={{ position: 'relative', background: isSelected ? 'transparent' : undefined }}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>{MOBILE_LABELS[r]}</span>
              {isSelected && (
                <motion.span
                  layoutId="activeBracketTab"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--green)',
                    zIndex: 1,
                    borderRadius: 6,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
      <div className="brm-date">{ROUND_DATES[active]}</div>
      <div className="brm-matches">
        {matches.map(m => <MatchCard key={m.id} match={m} scale={scale} highlight={active === 'F'} />)}
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
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    } catch { /* mantiene bracket base */ }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      fetchAndRebuild()
    }, 0)
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
      {/* Desktop: árbol horizontal */}
      <div className="brt-desktop">
        <BracketTree bracket={bracket} />
      </div>
      {/* Mobile: tabs por ronda */}
      <div className="brt-mobile">
        <BracketMobileTabs bracket={bracket} />
      </div>
    </div>
  )
}
