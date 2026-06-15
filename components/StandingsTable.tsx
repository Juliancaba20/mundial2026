import Link from 'next/link'
import type { TeamStanding } from '@/lib/standings'
import { formatDG } from '@/lib/standings'

interface Props {
  standings: TeamStanding[]
  compact?: boolean  // true → versión reducida para la grilla de /grupos
}

export function StandingsTable({ standings, compact = false }: Props) {
  if (standings.length === 0) return null

  const anyPlayed = standings.some(s => s.pj > 0)

  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="st-pos">#</th>
            <th className="st-team">Equipo</th>
            <th className="st-num" title="Partidos jugados">PJ</th>
            <th className="st-num" title="Ganados">G</th>
            <th className="st-num" title="Empatados">E</th>
            <th className="st-num" title="Perdidos">P</th>
            {!compact && <th className="st-num st-hide-sm" title="Goles a favor">GF</th>}
            {!compact && <th className="st-num st-hide-sm" title="Goles en contra">GC</th>}
            <th className="st-num" title="Diferencia de goles">DG</th>
            <th className="st-num st-pts" title="Puntos">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.team.slug}
              className={`st-row${row.qualified && anyPlayed ? ' st-qualified' : ''}`}
            >
              <td className="st-pos">
                {row.qualified && anyPlayed
                  ? <span className="st-q-dot" title="Clasifica" />
                  : <span className="st-pos-num">{i + 1}</span>
                }
              </td>
              <td className="st-team">
                <Link href={`/equipo/${row.team.slug}`} className="st-team-link">
                  <span className="st-flag">{row.team.flag}</span>
                  <span className="st-name">{row.team.name}</span>
                </Link>
              </td>
              <td className="st-num">{row.pj}</td>
              <td className="st-num">{row.g}</td>
              <td className="st-num">{row.e}</td>
              <td className="st-num">{row.p}</td>
              {!compact && <td className="st-num st-hide-sm">{row.gf}</td>}
              {!compact && <td className="st-num st-hide-sm">{row.gc}</td>}
              <td className="st-num">{anyPlayed ? formatDG(row.dg) : '—'}</td>
              <td className="st-num st-pts">{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {anyPlayed && (
        <div className="st-legend">
          <span className="st-q-dot" /> Clasifica a 16avos de final
        </div>
      )}
    </div>
  )
}
