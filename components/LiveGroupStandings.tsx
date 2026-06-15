'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Match, LiveResultsMap } from '@/types'
import type { TeamStanding } from '@/lib/standings'
import { calculateStandings } from '@/lib/standings'
import { StandingsTable } from './StandingsTable'
import { MatchRow } from './MatchRow'

function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

interface Props {
  groupLetter: string
  initialMatches: Match[]
}

export function LiveGroupStandings({ groupLetter, initialMatches }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [standings, setStandings] = useState<TeamStanding[]>(
    () => calculateStandings(groupLetter, initialMatches)
  )
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [hasLive, setHasLive] = useState(false)

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const results: LiveResultsMap = await res.json()
      const updated = applyResults(initialMatches, results)
      setMatches(updated)
      setStandings(calculateStandings(groupLetter, updated))
      setHasLive(updated.some(m => m.status === 'live'))
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    } catch { /* mantiene los datos base */ }
  }, [groupLetter, initialMatches])

  useEffect(() => {
    fetchResults()
    const id = setInterval(fetchResults, 60_000)
    return () => clearInterval(id)
  }, [fetchResults])

  const groupMatches = matches.filter(m => m.group === groupLetter)

  return (
    <>
      {/* TABLA DE POSICIONES */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="team-section-title">POSICIONES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasLive && <span className="live-dot" />}
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                Actualizado {lastUpdated}
              </span>
            )}
            <button
              onClick={fetchResults}
              style={{
                background: 'transparent', border: '1px solid var(--border2)',
                borderRadius: 7, color: 'var(--muted)', fontSize: 11,
                padding: '3px 9px', cursor: 'pointer',
              }}
            >
              ↻
            </button>
          </div>
        </div>
        <StandingsTable standings={standings} compact={false} />
      </div>

      {/* PARTIDOS */}
      <div>
        <div className="team-section-title">PARTIDOS</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groupMatches.map(m => (
            <MatchRow key={m.id} match={m} showGroup={false} />
          ))}
        </div>
      </div>
    </>
  )
}
