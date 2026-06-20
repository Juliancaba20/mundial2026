'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Match, LiveResultsMap } from '@/types'
import { BASE_MATCHES } from '@/lib/data'
import { MatchRow } from './MatchRow'
import { TeamFlag } from './TeamFlag'


type SortMode = 'date' | 'group'

function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
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

interface Props {
  groupFilter?: string
}

export function MatchesClient({ groupFilter }: Props) {
  const [matches, setMatches] = useState<Match[]>(BASE_MATCHES)
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
      const data: { results: LiveResultsMap } = await res.json()
      const updated = applyResults(BASE_MATCHES, data.results ?? {})
      setMatches(updated)
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
    setLocalDateMap(map)
    fetchResults()
    const id = setInterval(fetchResults, 60_000)
    return () => clearInterval(id)
  }, [fetchResults])

  const list = matches.filter(m => !selectedGroup || m.group === selectedGroup)
  const groupLetters = 'ABCDEFGHIJKL'.split('')

  function dateLabel(m: Match): string {
    return localDateMap[m.id] || m.date
  }

  function renderList() {
    if (!list.length) return <div style={{ textAlign:'center', padding:'48px', color:'var(--faint)', fontSize:14 }}>No hay partidos para este grupo.</div>

    if (sortMode === 'date') {
      const sorted = [...list].sort((a, b) => {
        if (a.dateSort !== b.dateSort) return a.dateSort - b.dateSort
        return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      })

      const days: string[] = []
      const seen = new Set<string>()
      for (const m of sorted) {
        const label = dateLabel(m)
        if (!seen.has(label)) { seen.add(label); days.push(label) }
      }

      return days.map(day => {
        const dayMatches = sorted.filter(m => dateLabel(m) === day)
        return (
          <div key={day}>
            <div className="day-label">
              {day} <span className="day-count">{dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}</span>
            </div>
            {dayMatches.map(m => <MatchRow key={m.id} match={m} showGroup={!selectedGroup} />)}
          </div>
        )
      })
    }

    return groupLetters.map(g => {
      const gMatches = list.filter(m => m.group === g)
      if (!gMatches.length) return null
      return (
        <div key={g}>
          <div className="day-label">
            Grupo {g} <span className="day-count">{gMatches.length} partidos</span>
          </div>
          {gMatches.map(m => <MatchRow key={m.id} match={m} showGroup={false} />)}
        </div>
      )
    })
  }

  return (
    <>
      <div className="matches-header">
        <div>
          <div className="page-title">PARTIDOS</div>
          <div className="page-sub">Fase de grupos · resultados en vivo vía ESPN</div>
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
          <button onClick={fetchResults} style={{ color:'#74b9ff', background:'none', border:'none', cursor:'pointer' }}>Reintentar</button>
        </div>
      )}

      <div>{renderList()}</div>
    </>
  )
}

// ── Partido héroe + cards secundarias para la home ───────────────────────────
export function FeaturedMatchesClient({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  useEffect(() => {
    fetch('/api/resultados', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: { results: LiveResultsMap }) => {
        setMatches(applyResults(initialMatches, data.results ?? {}))
      })
      .catch(() => {})
  }, [initialMatches])

  const live = matches.filter(m => m.status === 'live')
  const done = matches.filter(m => m.status === 'done')
  const upcoming = matches.filter(m => m.status === 'pending')

  // Partido héroe: prioridad live > próximo inmediato > último finalizado
  const hero = live[0] ?? upcoming[0] ?? done[done.length - 1] ?? null

  // Cards secundarias: excluye el héroe, max 5
  const secondary = matches
    .filter(m => m.id !== hero?.id)
    .filter(m => {
      if (live.length) return m.status === 'live' || m.status === 'pending'
      return m.status === 'pending' || m.status === 'done'
    })
    .slice(0, 5)

  function HeroCard({ m }: { m: Match }) {
    const isLive = m.status === 'live'
    const isDone = m.status === 'done'
    const scoreText = m.status === 'pending' ? null : m.score

    return (
      <a href="/partidos" className={`match-hero-card${isLive ? ' is-live' : ''}${isDone ? ' is-done-hero' : ''}`} style={{ textDecoration: 'none' }}>
        <div className="mh-top">
          <span className="mh-group">Grupo {m.group}</span>
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
      </a>
    )
  }

  return (
    <div className="featured-section">
      {hero && <HeroCard m={hero} />}

      {secondary.length > 0 && (
        <div className="featured-matches">
          {secondary.map(m => {
            const badge = m.status === 'live'
              ? <div className="fm-badge-live"><span className="live-dot" style={{width:5,height:5}} />EN VIVO {m.clock}</div>
              : m.status === 'done'
                ? <div className="fm-badge-done">Final</div>
                : <div className="fm-badge-next">Próximo · {m.date}</div>

            const scoreEl = m.status === 'pending'
              ? <div className="fm-score-center pending">vs</div>
              : <div className={`fm-score-center${m.status === 'live' ? ' live' : ''}`}>{m.score}</div>

            return (
              <a key={m.id} href="/partidos" className={`fm-card${m.status === 'live' ? ' is-live' : ''}${m.status === 'done' ? ' is-done-card' : ''}`} style={{textDecoration:'none'}}>
                <div className="fm-top">
                  <span className="fm-group">Grupo {m.group}</span>
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
              </a>
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

  useEffect(() => {
    fetch('/api/resultados', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: { results: LiveResultsMap }) => setMatches(applyResults(initialMatches, data.results ?? {})))
      .catch(() => {})
  }, [initialMatches])

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const live = matches.filter(m => m.status === 'live')
  const todayMs = matches.filter(m => String(m.dateSort) === today && m.status !== 'live')
  const recent = matches.filter(m => m.status === 'done').slice(-6)
  const upcoming = matches.filter(m => m.status === 'pending').slice(0, 4)

  let toShow: Match[]
  let labelText: string
  let isLiveLabel = false

  if (live.length) { toShow = live; labelText = 'EN VIVO'; isLiveLabel = true }
  else if (todayMs.length) { toShow = todayMs.slice(0, 5); labelText = 'HOY' }
  else if (recent.length) { toShow = recent; labelText = 'ÚLTIMOS' }
  else { toShow = upcoming; labelText = 'PRÓXIMOS' }

  return (
    <div className="hero-match-strip">
      <div className="hero-match-inner">
        <div className={`hm-label${isLiveLabel ? ' live' : ''}`}>{labelText}</div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
          {toShow.map(m => (
            <a key={m.id} href="/partidos" className={`hm-card${m.status === 'live' ? ' active-live' : ''}`} style={{textDecoration:'none'}}>
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
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
