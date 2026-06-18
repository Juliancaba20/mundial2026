import type { Metadata } from 'next'
import Link from 'next/link'
import { GROUPS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { calculateStandings } from '@/lib/standings'
import { applyResults, fetchLiveResults } from '@/lib/espn'
import { StandingsTable } from '@/components/StandingsTable'

export const metadata: Metadata = {
  title: 'Grupos',
  description: 'Tabla de posiciones de los 12 grupos del Mundial 2026. Actualizada con resultados en vivo.',
}

const GROUP_COLORS = [
  '#00A86B','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2',
  '#059669','#db2777','#64748b','#C9A84C','#16a34a','#6366f1',
]

export default async function GruposPage() {
  const liveResults = await fetchLiveResults()
  const matches = applyResults(BASE_MATCHES, liveResults)

  return (
    <div className="content-area">
      <div className="page-header">
        <div className="page-title">GRUPOS</div>
        <div className="page-sub">
          12 grupos · tabla de posiciones en tiempo real · clasifican los 2 primeros + 8 mejores terceros
        </div>
      </div>

      <div className="groups-grid">
        {GROUPS.map((group, gi) => {
          const fullTeams = group.teams.map(t => TEAMS_BY_SLUG[t.slug])
          const hasChamp = fullTeams.some(t => t?.isChampion)
          const color = GROUP_COLORS[gi]
          // Posiciones calculadas con los resultados reales de ESPN ya aplicados
          // (misma fuente de datos que usa /grupo/[letra])
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

              {/* TABLA DE POSICIONES COMPACTA */}
              <StandingsTable standings={standings} compact={true} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
