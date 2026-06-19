'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Match, LiveResultsMap } from '@/types'
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
  initialMatches: Match[]
}

export function LiveTeamMatches({ initialMatches }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [hasLive, setHasLive] = useState(false)

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const results: LiveResultsMap = await res.json()
      const updated = applyResults(initialMatches, results)
      setMatches(updated)
      setHasLive(updated.some(m => m.status === 'live'))
      setLastUpdated(
        new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      )
    } catch { /* mantiene datos base */ }
  }, [initialMatches])

  useEffect(() => {
    fetchResults()
    const id = setInterval(fetchResults, 60_000)
    return () => clearInterval(id)
  }, [fetchResults])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="team-section-title">PARTIDOS — FASE DE GRUPOS</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {matches.map(m => (
          <MatchRow key={m.id} match={m} showGroup={false} />
        ))}
      </div>
    </>
  )
}
