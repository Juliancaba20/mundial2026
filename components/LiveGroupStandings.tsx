'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Match, LiveResultsMap } from '@/types'
import type { TeamStanding } from '@/lib/standings'
import { calculateStandings } from '@/lib/standings'
import { getBestThirds } from '@/lib/bracket'
import { StandingsTable } from './StandingsTable'
import { MatchRow } from './MatchRow'
import { BASE_MATCHES } from '@/lib/data'

function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return { ...m, score: `${live.homeScore} – ${live.awayScore}`, status: live.status, clock: live.clock }
  })
}

// Calcula qué slugs de terceros clasifican, usando todos los partidos
function computeQualifiedThirds(allMatches: Match[]): { slugs: Set<string>; resolved: boolean } {
  const thirds = getBestThirds(allMatches)
  // "resolved" = los 12 grupos tienen al menos 3 partidos jugados cada uno
  const groupsComplete = 'ABCDEFGHIJKL'.split('').every(letter => {
    const s = calculateStandings(letter, allMatches)
    return s.length === 4 && s.every(row => row.pj === 3)
  })
  const top8 = thirds.slice(0, 8)
  const slugs = new Set(top8.map(t => t.team?.slug).filter(Boolean) as string[])
  return { slugs, resolved: groupsComplete }
}

interface Props {
  groupLetter: string
  initialMatches: Match[]
}

export function LiveGroupStandings({ groupLetter, initialMatches }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [allMatches, setAllMatches] = useState<Match[]>(BASE_MATCHES)
  const [standings, setStandings] = useState<TeamStanding[]>(
    () => calculateStandings(groupLetter, initialMatches)
  )
  const [qualifiedThirdSlugs, setQualifiedThirdSlugs] = useState<Set<string>>(new Set())
  const [thirdsResolved, setThirdsResolved] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [hasLive, setHasLive] = useState(false)

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/resultados', { cache: 'no-store' })
      if (!res.ok) return
      const data: { results: LiveResultsMap } = await res.json()
      const updated = applyResults(initialMatches, data.results ?? {})
      const updatedAll = applyResults(BASE_MATCHES, data.results ?? {})
      setMatches(updated)
      setAllMatches(updatedAll)
      setStandings(calculateStandings(groupLetter, updated))
      setHasLive(updated.some(m => m.status === 'live'))
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      const { slugs, resolved } = computeQualifiedThirds(updatedAll)
      setQualifiedThirdSlugs(slugs)
      setThirdsResolved(resolved)
    } catch { /* mantiene los datos base */ }
  }, [groupLetter, initialMatches])

  useEffect(() => {
    setTimeout(() => {
      fetchResults()
    }, 0)
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
        <StandingsTable
          standings={standings}
          compact={false}
          qualifiedThirdSlugs={qualifiedThirdSlugs}
          thirdsResolved={thirdsResolved}
        />
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
