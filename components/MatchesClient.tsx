'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Match, BracketMatch, BracketRound, LiveResultsMap, KnockoutResultsMap } from '@/types'
import { BASE_MATCHES } from '@/lib/data'
import { buildBracket, ROUND_LABELS, ROUND_DATES } from '@/lib/bracket'
import { MatchRow } from './MatchRow'
import { BracketMatchRow } from './BracketMatchRow'
import { TeamFlag } from './TeamFlag'
import { motion } from 'motion/react'


// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortMode = 'date' | 'group'

function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

// ─── Pool combinado para la home: grupos + eliminatorias ──────────────────────
// Bug histórico: FeaturedMatchesClient/MatchStripClient solo miraban
// BASE_MATCHES (fase de grupos, terminada desde el 27 jun). Una vez que el
// torneo pasa a eliminatorias, "lo más reciente/próximo" siempre caía en un
// partido de grupos viejo porque los partidos de eliminatorias (que viven en
// buildBracket(), no en BASE_MATCHES) nunca entraban al cálculo. Esto arma un
// pool único con ambos, ya ordenado por kickoff, para que "hoy"/"en vivo"
// funcione automáticamente en cualquier fase del torneo sin tocar código.
function bracketMatchToFeatured(bm: BracketMatch): Match | null {
  if (!bm.home.team || !bm.away.team) return null // slot todavía no definido (TBD)
  const dateSort = bm.kickoff ? Number(bm.kickoff.slice(0, 10).replace(/-/g, '')) : 0
  return {
    id: bm.id,
    date: bm.date,
    dateSort,
    kickoff: bm.kickoff ?? '',
    group: ROUND_LABELS[bm.round] ?? bm.round, // ej. "Octavos" — se muestra sin el prefijo "Grupo"
    home: bm.home.team,
    away: bm.away.team,
    venue: '',
    city: '',
    score: bm.home.score !== undefined ? `${bm.home.score} – ${bm.away.score}` : undefined,
    status: bm.status,
    clock: bm.clock,
  }
}

function buildFeaturedPool(
  baseMatches: Match[],
  results: LiveResultsMap,
  knockoutResults: KnockoutResultsMap
): Match[] {
  const groupMatches = applyResults(baseMatches, results)
  const bracket = buildBracket(groupMatches, knockoutResults)
  const bracketMatches = bracket
    .map(bracketMatchToFeatured)
    .filter((m): m is Match => m !== null)
  return [...groupMatches, ...bracketMatches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  )
}

function getLocalDateLabel(kickoff: string): string {
  const d = new Date(kickoff)
  if (isNaN(d.getTime())) return ''
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return d.toLocaleDateString('es', {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
  })
}

// Clasifica un partido de fase de grupos en Fecha 1/2/3 según el kickoff UTC
function getMatchday(kickoff: string): 'Fecha 1' | 'Fecha 2' | 'Fecha 3' {
  const d = kickoff.slice(0, 10) // 'YYYY-MM-DD'
  if (d < '2026-06-18') return 'Fecha 1'
  if (d < '2026-06-24') return 'Fecha 2'
  return 'Fecha 3'
}

// Rondas de eliminatorias en orden cronológico para el calendario
const KO_ROUNDS: BracketRound[] = ['R32', 'R16', 'QF', 'SF', '3RD', 'F']

// ─── Componente principal MatchesClient ───────────────────────────────────────

interface Props {
  groupFilter?: string
}

export function MatchesClient({ groupFilter }: Props) {
  const [matches, setMatches] = useState<Match[]>(BASE_MATCHES)
  const [bracket, setBracket] = useState<BracketMatch[]>(() => buildBracket(BASE_MATCHES))
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [selectedGroup, setSelectedGroup] = useState(groupFilter ?? '')
  const [statusText, setStatusText] = useState('Cargando resultados…')
  const [apiError, setApiError] = useState(false)
  const [hasLive, setHasLive] = useState(false)
  const [localDateMap, setLocalDateMap] = useState<Record<string, string>>({})

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) throw new Error('API error')
      const data: { results: LiveResultsMap; knockoutResults: KnockoutResultsMap } = await res.json()
      const updated = applyResults(BASE_MATCHES, data.results ?? {})
      setMatches(updated)
      setBracket(buildBracket(updated, data.knockoutResults ?? {}))
      const liveCount = updated.filter(m => m.status === 'live').length
      const doneCount = updated.filter(m => m.status === 'done').length
      setHasLive(liveCount > 0)
      setApiError(false)
      const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      setStatusText(`Actualizado ${time} · ${doneCount} resultado${doneCount !== 1 ? 's' : ''} cargado${doneCount !== 1 ? 's' : ''}`)
      const topbarLive = document.getElementById('topbar-live')
      if (topbarLive) topbarLive.style.display = liveCount > 0 ? 'flex' : 'none'
    } catch {
      setApiError(true)
      setStatusText('Error al cargar resultados')
    }
  }, [])

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const m of BASE_MATCHES) {
      map[m.id] = getLocalDateLabel(m.kickoff)
    }
    setTimeout(() => {
      setLocalDateMap(map)
      fetchResults()
    }, 0)
    const id = setInterval(fetchResults, 60_000)
    return () => clearInterval(id)
  }, [fetchResults])

  const groupLetters = 'ABCDEFGHIJKL'.split('')

  function dateLabel(m: Match): string {
    return localDateMap[m.id] || m.date
  }

  // ── Renderizado de fase de grupos ─────────────────────────────────────────

  function renderGroupPhase() {
    const groupMatches = matches.filter(m => !selectedGroup || m.group === selectedGroup)

    if (!groupMatches.length) {
      return (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--faint)', fontSize: 14 }}>
          No hay partidos para este grupo.
        </div>
      )
    }

    if (sortMode === 'group') {
      return (
        <>
          {groupLetters.map(g => {
            const gMatches = groupMatches.filter(m => m.group === g)
            if (!gMatches.length) return null
            return (
              <div key={g}>
                <div className="day-label">
                  Grupo {g} <span className="day-count">{gMatches.length} partidos</span>
                </div>
                {gMatches.map(m => <MatchRow key={m.id} match={m} showGroup={false} />)}
              </div>
            )
          })}
        </>
      )
    }

    // sortMode === 'date' — agrupar por fecha local del kickoff
    const sorted = [...groupMatches].sort((a, b) => {
      if (a.dateSort !== b.dateSort) return a.dateSort - b.dateSort
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    })

    const days: string[] = []
    const seen = new Set<string>()
    for (const m of sorted) {
      const label = dateLabel(m)
      if (!seen.has(label)) { seen.add(label); days.push(label) }
    }

    return (
      <>
        {days.map(day => {
          const dayMatches = sorted.filter(m => dateLabel(m) === day)
          return (
            <div key={day}>
              <div className="day-label">
                {day} <span className="day-count">{dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}</span>
              </div>
              {dayMatches.map(m => <MatchRow key={m.id} match={m} showGroup={!selectedGroup} />)}
            </div>
          )
        })}
      </>
    )
  }

  // ── Renderizado de fase de grupos agrupado por jornada ────────────────────
  // (usado cuando no hay filtro de grupo activo y el modo es 'date')

  function renderGroupPhaseByMatchday() {
    const MATCHDAY_LABELS = { 'Fecha 1': 'Fecha 1', 'Fecha 2': 'Fecha 2', 'Fecha 3': 'Fecha 3' } as const
    const matchdays = ['Fecha 1', 'Fecha 2', 'Fecha 3'] as const

    return (
      <>
        {matchdays.map(md => {
          const mdMatches = matches
            .filter(m => getMatchday(m.kickoff) === md)
            .sort((a, b) => {
              if (a.dateSort !== b.dateSort) return a.dateSort - b.dateSort
              return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
            })
          if (!mdMatches.length) return null

          // Dentro de cada jornada, agrupa por día local
          const days: string[] = []
          const seen = new Set<string>()
          for (const m of mdMatches) {
            const label = dateLabel(m)
            if (!seen.has(label)) { seen.add(label); days.push(label) }
          }

          return (
            <div key={md} className="cal-phase-block">
              <div className="cal-phase-header">
                <span className="cal-phase-name">{MATCHDAY_LABELS[md]}</span>
                <span className="cal-phase-sub">Fase de grupos</span>
              </div>
              {days.map(day => {
                const dayMatches = mdMatches.filter(m => dateLabel(m) === day)
                return (
                  <div key={day}>
                    <div className="day-label">
                      {day} <span className="day-count">{dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}</span>
                    </div>
                    {dayMatches.map(m => <MatchRow key={m.id} match={m} showGroup={true} />)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </>
    )
  }

  // ── Renderizado de eliminatorias ──────────────────────────────────────────

  function renderKnockoutPhase() {
    // Si hay filtro de grupo activo, no mostrar eliminatorias
    if (selectedGroup) return null

    return (
      <>
        {KO_ROUNDS.map(round => {
          const roundMatches = bracket.filter(m => m.round === round)
          if (!roundMatches.length) return null
          const label = ROUND_LABELS[round]
          const dates = ROUND_DATES[round]
          const isFinalRound = round === 'F'
          const isThirdRound = round === '3RD'

          return (
            <div key={round} className="cal-phase-block">
              <div className={`cal-phase-header${isFinalRound ? ' cal-phase-header--final' : ''}${isThirdRound ? ' cal-phase-header--third' : ''}`}>
                <span className="cal-phase-name">{label}</span>
                <span className="cal-phase-sub">{dates}</span>
              </div>
              <div>
                {roundMatches
                  .slice()
                  .sort((a, b) => {
                    if (!a.kickoff || !b.kickoff) return 0
                    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
                  })
                  .map(m => (
                    <BracketMatchRow key={m.id} match={m} />
                  ))}
              </div>
            </div>
          )
        })}
      </>
    )
  }

  // ── Vista principal ───────────────────────────────────────────────────────

  const showFullCalendar = !selectedGroup && sortMode === 'date'

  return (
    <>
      <div className="matches-header">
        <div>
          <div className="page-title">PARTIDOS</div>
          <div className="page-sub">
            {showFullCalendar
              ? 'Calendario completo · fase de grupos y eliminatorias · resultados en vivo vía ESPN'
              : 'Fase de grupos · resultados en vivo vía ESPN'}
          </div>
        </div>
        <div className="toolbar">
          {!groupFilter && (
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
              <option value="">Todos los grupos</option>
              {groupLetters.map(g => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          )}
          <div className="sort-group">
            <button className={`sort-btn${sortMode === 'date' ? ' active' : ''}`} onClick={() => setSortMode('date')}>Por fecha</button>
            <button className={`sort-btn${sortMode === 'group' ? ' active' : ''}`} onClick={() => setSortMode('group')}>Por grupo</button>
          </div>
        </div>
      </div>

      <div className="status-row">
        <div className="status-msg">
          <span className="live-dot" />
          {statusText}
        </div>
        <button className="refresh-btn" onClick={fetchResults}>↻ Actualizar</button>
      </div>

      {apiError && (
        <div className="api-error">
          ⚠ No se pudieron cargar resultados en vivo.{' '}
          <button onClick={fetchResults} style={{ color: '#74b9ff', background: 'none', border: 'none', cursor: 'pointer' }}>Reintentar</button>
        </div>
      )}

      <div>
        {showFullCalendar ? (
          <>
            {renderGroupPhaseByMatchday()}
            {renderKnockoutPhase()}
          </>
        ) : (
          renderGroupPhase()
        )}
      </div>
    </>
  )
}

function HeroCard({ m }: { m: Match }) {
  const isLive = m.status === 'live'
  const isDone = m.status === 'done'
  const scoreText = m.status === 'pending' ? null : m.score
  // m.group es una letra (A-L) en fase de grupos, o el nombre de la ronda
  // (ej. "Octavos") para partidos de eliminatorias — sin el prefijo "Grupo".
  const groupLabel = m.group.length === 1 ? `Grupo ${m.group}` : m.group

  return (
    <motion.a
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      href="/partidos"
      className={`match-hero-card${isLive ? ' is-live' : ''}${isDone ? ' is-done-hero' : ''}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="mh-top">
        <span className="mh-group">{groupLabel}</span>
        {isLive && (
          <span className="mh-badge-live"><span className="live-dot" style={{ width: 6, height: 6 }} /> EN VIVO {m.clock}</span>
        )}
        {isDone && <span className="mh-badge-done">Partido finalizado</span>}
        {!isLive && !isDone && <span className="mh-badge-next">Próximo · {m.date}</span>}
      </div>

      <div className="mh-teams">
        <div className="mh-team">
          <TeamFlag code={m.home.flagCode} name={m.home.name} size={48} className="mh-flag" />
          <span className="mh-name">{m.home.name}</span>
        </div>

        <div className="mh-score-area">
          {scoreText
            ? <div className={`mh-score${isLive ? ' live' : ''}`}>{scoreText}</div>
            : <div className="mh-vs">VS</div>
          }
          {!isLive && !isDone && m.kickoff && (
            <div className="mh-kickoff-time">
              {new Date(m.kickoff).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
            </div>
          )}
        </div>

        <div className="mh-team right">
          <TeamFlag code={m.away.flagCode} name={m.away.name} size={48} className="mh-flag" />
          <span className="mh-name">{m.away.name}</span>
        </div>
      </div>

      <div className="mh-venue">{m.venue}</div>
    </motion.a>
  )
}

// ── Partido héroe + cards secundarias para la home ───────────────────────────
export function FeaturedMatchesClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  const fetchAndUpdate = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const data: { results: LiveResultsMap; knockoutResults?: KnockoutResultsMap } = await res.json()
      setMatches(buildFeaturedPool(initialMatches, data.results ?? {}, data.knockoutResults ?? {}))
    } catch { /* mantiene datos actuales */ }
  }, [initialMatches])

  useEffect(() => {
    setTimeout(() => {
      fetchAndUpdate()
    }, 0)
    const id = setInterval(fetchAndUpdate, 60_000)
    return () => clearInterval(id)
  }, [fetchAndUpdate])

  const live = matches.filter(m => m.status === 'live')
  const done = matches.filter(m => m.status === 'done')
  const upcoming = matches.filter(m => m.status === 'pending')

  const hero = live[0] ?? upcoming[0] ?? done[done.length - 1] ?? null

  const secondary = matches
    .filter(m => m.id !== hero?.id)
    .filter(m => {
      if (live.length) return m.status === 'live' || m.status === 'pending'
      return m.status === 'pending' || m.status === 'done'
    })
    .slice(0, 5)

  return (
    <div className="featured-section">
      {hero && <HeroCard m={hero} />}

      {secondary.length > 0 && (
        <div className="featured-matches">
          {secondary.map(m => {
            const badge = m.status === 'live'
              ? <div className="fm-badge-live"><span className="live-dot" style={{ width: 5, height: 5 }} />EN VIVO {m.clock}</div>
              : m.status === 'done'
                ? <div className="fm-badge-done">Final</div>
                : <div className="fm-badge-next">Próximo · {m.date}</div>

            const scoreEl = m.status === 'pending'
              ? <div className="fm-score-center pending">vs</div>
              : <div className={`fm-score-center${m.status === 'live' ? ' live' : ''}`}>{m.score}</div>

            return (
              <motion.a
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                href="/partidos"
                className={`fm-card${m.status === 'live' ? ' is-live' : ''}${m.status === 'done' ? ' is-done-card' : ''}`}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <div className="fm-top">
                  <span className="fm-group">{m.group.length === 1 ? `Grupo ${m.group}` : m.group}</span>
                  {badge}
                </div>
                <div className="fm-teams">
                  <div className="fm-team">
                    <TeamFlag code={m.home.flagCode} name={m.home.name} size={28} className="fm-flag-img" />
                    <div className="fm-team-name">{m.home.name}</div>
                  </div>
                  {scoreEl}
                  <div className="fm-team">
                    <TeamFlag code={m.away.flagCode} name={m.away.name} size={28} className="fm-flag-img" />
                    <div className="fm-team-name">{m.away.name}</div>
                  </div>
                </div>
                <div className="fm-venue">{m.venue}</div>
              </motion.a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Strip de partidos para el hero ───────────────────────────────────────────
export function MatchStripClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  const fetchAndUpdateStrip = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const data: { results: LiveResultsMap; knockoutResults?: KnockoutResultsMap } = await res.json()
      setMatches(buildFeaturedPool(initialMatches, data.results ?? {}, data.knockoutResults ?? {}))
    } catch { /* mantiene datos actuales */ }
  }, [initialMatches])

  useEffect(() => {
    setTimeout(() => {
      fetchAndUpdateStrip()
    }, 0)
    const id = setInterval(fetchAndUpdateStrip, 60_000)
    return () => clearInterval(id)
  }, [fetchAndUpdateStrip])

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const live = matches.filter(m => m.status === 'live')
  const doneSorted = matches.filter(m => m.status === 'done')       // orden ascendente por kickoff
  const pendingSorted = matches.filter(m => m.status === 'pending') // orden ascendente por kickoff

  // Objetivo: mostrar siempre 6 partidos (mezcla de los últimos jugados y los
  // próximos), no solo "los de hoy" — antes, si hoy había 2 partidos, el
  // marquee se quedaba con esos 2 nada más y se movía demasiado rápido.
  const TARGET = 6
  let toShow: Match[]

  if (live.length >= TARGET) {
    toShow = live
  } else {
    const remaining = TARGET - live.length
    const wantUpcoming = Math.ceil(remaining / 2)
    const wantRecent = remaining - wantUpcoming
    let upcomingPart = pendingSorted.slice(0, wantUpcoming)
    let recentPart = doneSorted.slice(Math.max(0, doneSorted.length - wantRecent))
    const short = remaining - upcomingPart.length - recentPart.length
    if (short > 0) {
      if (upcomingPart.length < wantUpcoming) {
        recentPart = doneSorted.slice(Math.max(0, doneSorted.length - (wantRecent + short)))
      } else if (recentPart.length < wantRecent) {
        upcomingPart = pendingSorted.slice(0, wantUpcoming + short)
      }
    }
    toShow = [...live, ...recentPart, ...upcomingPart].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )
  }

  if (!toShow.length) return null

  const hasToday = toShow.some(m => String(m.dateSort) === today)
  const allDone = toShow.every(m => m.status === 'done')
  const allPending = toShow.every(m => m.status === 'pending')
  const labelText = live.length ? 'EN VIVO' : hasToday ? 'HOY' : allDone ? 'ÚLTIMOS' : allPending ? 'PRÓXIMOS' : 'PARTIDOS'
  const isLiveLabel = live.length > 0

  // Para crear un bucle infinito continuo en el marquee, repetimos el array para que cubra todo el ancho de pantalla.
  // El número de repeticiones debe ser par para que la animación con translate3d(-50%, 0, 0) sea visualmente idéntica al inicio.
  const minItems = 12
  const rawRepeatTimes = Math.ceil(minItems / toShow.length) * 2
  const repeatTimes = rawRepeatTimes % 2 === 0 ? rawRepeatTimes : rawRepeatTimes + 1

  const marqueeItems: Match[] = []
  for (let i = 0; i < repeatTimes; i++) {
    marqueeItems.push(...toShow)
  }

  const showLabel = labelText !== 'ÚLTIMOS'

  return (
    <div className="hero-match-strip">
      <div className="hero-match-inner" style={{ padding: showLabel ? '0 0 0 24px' : '0', overflow: 'hidden' }}>
        {showLabel && (
          <div className={`hm-label${isLiveLabel ? ' live' : ''}`}>{labelText}</div>
        )}
        <div className="marquee-container">
          <div className="marquee-content" style={{ animationDuration: `${toShow.length * 5}s` }}>
            {marqueeItems.map((m, idx) => (
              <motion.a
                key={`${m.id}-${idx}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="/partidos"
                className={`hm-card${m.status === 'live' ? ' active-live' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="hm-team">
                  <TeamFlag code={m.home.flagCode} name={m.home.name} size={18} className="hm-flag-img" />
                  <span className="hm-name">{m.home.name}</span>
                </div>
                <div className="hm-score-box">
                  <div className={`hm-score${m.status === 'live' ? ' live-score' : ''}`}>{m.score ?? 'vs'}</div>
                  <div className={`hm-time${m.status === 'live' ? ' live-time' : ''}`}>{m.status === 'live' ? m.clock : m.date}</div>
                </div>
                <div className="hm-team right">
                  <TeamFlag code={m.away.flagCode} name={m.away.name} size={18} className="hm-flag-img" />
                  <span className="hm-name">{m.away.name}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
