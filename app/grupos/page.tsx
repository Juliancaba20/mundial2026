import type { Metadata } from 'next'
import Link from 'next/link'
import { GROUPS, TEAMS_BY_SLUG } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Grupos',
  description: 'Los 12 grupos del Mundial 2026. 48 selecciones, clasifican los 2 primeros de cada grupo más los 8 mejores terceros.',
}

const GROUP_COLORS = [
  '#00A86B','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2',
  '#059669','#db2777','#64748b','#C9A84C','#16a34a','#6366f1',
]

export default function GruposPage() {
  return (
    <div className="content-area">
      <div className="page-header">
        <div className="page-title">GRUPOS</div>
        <div className="page-sub">12 grupos · 4 equipos cada uno · clasifican los 2 primeros + 8 mejores terceros</div>
      </div>

      <div className="groups-grid">
        {GROUPS.map((group, gi) => {
          const fullTeams = group.teams.map(t => TEAMS_BY_SLUG[t.slug])
          const hasChamp = fullTeams.some(t => t?.isChampion)
          const color = GROUP_COLORS[gi]

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
                  Ver grupo →
                </Link>
              </div>
              <div>
                {group.teams.map(t => {
                  const full = TEAMS_BY_SLUG[t.slug]
                  return (
                    <Link key={t.slug} href={`/equipo/${t.slug}`} className="g-team">
                      <span className="g-flag">{t.flag}</span>
                      <span className={`g-name${full?.isChampion ? ' bold' : ''}`}>{t.name}</span>
                      {full?.isChampion && <span className="champ-badge">★ Campeona</span>}
                      <span className="g-arrow">›</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
