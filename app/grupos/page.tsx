import type { Metadata } from 'next'
import Link from 'next/link'
import { GROUPS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { calculateStandings } from '@/lib/standings'
import { applyResults, fetchLiveResults } from '@/lib/espn'
import { getBestThirds } from '@/lib/bracket'
import { StandingsTable } from '@/components/StandingsTable'

export const metadata: Metadata = {
  title: 'Grupos',
  description: 'Tabla de posiciones de los 12 grupos del Mundial 2026. Actualizada con resultados en vivo.',
}

const GROUP_COLORS = [
  '#00A86B','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2',
  '#059669','#db2777','#64748b','#C9A84C','#16a34a','#6366f1',
]

function computeQualifiedThirds(matches: ReturnType<typeof applyResults>): { slugs: Set<string>; resolved: boolean } {
  const thirds = getBestThirds(matches)
  const groupsComplete = 'ABCDEFGHIJKL'.split('').every(letter => {
    const s = calculateStandings(letter, matches)
    return s.length === 4 && s.every(row => row.pj === 3)
  })
  const top8 = thirds.slice(0, 8)
  const slugs = new Set(top8.map(t => t.team?.slug).filter(Boolean) as string[])
  return { slugs, resolved: groupsComplete }
}

export default async function GruposPage() {
  const { results: liveResults } = await fetchLiveResults()
  const matches = applyResults(BASE_MATCHES, liveResults)
  const { slugs: qualifiedThirdSlugs, resolved: thirdsResolved } = computeQualifiedThirds(matches)

  return (
    <div className="content-area">
      <div className="page-header-accent">
        <div className="page-header-stripe" style={{ background: '#00A86B' }} />
        <div className="page-header-inner">
          <div className="page-title">GRUPOS</div>
          <div className="page-sub">
            12 grupos · tabla de posiciones en tiempo real · clasifican los 2 primeros + 8 mejores terceros
          </div>
        </div>
      </div>

      <div className="groups-grid">
        {GROUPS.map((group, gi) => {
          const fullTeams = group.teams.map(t => TEAMS_BY_SLUG[t.slug])
          const hasChamp = fullTeams.some(t => t?.isChampion)
          const color = GROUP_COLORS[gi]
          const standings = calculateStandings(group.letter, matches)

          return (
            <div key={group.letter} className={`g-card${hasChamp ? ' arg-group' : ''}`}>
              <div className="g-head">
                <div className="g-head-left">
                  <div className="g-stripe" style={{ background: color }} />
                  <div className="g-head-letter">{group.letter}</div>
                </div>
                <Link
                  href={`/grupo/${group.letter.toLowerCase()}`}
                  style={{ color: 'var(--green)', fontSize: 11, fontWeight: 500 }}
                >
                  Ver en vivo →
                </Link>
              </div>
              <StandingsTable
                standings={standings}
                compact={true}
                qualifiedThirdSlugs={qualifiedThirdSlugs}
                thirdsResolved={thirdsResolved}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
