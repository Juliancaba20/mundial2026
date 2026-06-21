import Link from 'next/link'
import type { TeamStanding } from '@/lib/standings'
import { formatDG } from '@/lib/standings'
import { TeamFlag } from './TeamFlag'

interface Props {
  standings: TeamStanding[]
  compact?: boolean  // true → versión reducida para la grilla de /grupos
  // slugs de terceros que YA clasificaron (verde); si se pasa el set completo de terceros
  // y el equipo no está en él → rojo. Si es undefined → color estático por posición.
  qualifiedThirdSlugs?: Set<string>
  // true cuando todos los grupos han terminado y ya se conocen los 8 mejores terceros
  thirdsResolved?: boolean
}

// Devuelve la clase CSS de color para cada fila según su posición y estado
function getRowClass(
  i: number,
  slug: string,
  anyPlayed: boolean,
  qualifiedThirdSlugs?: Set<string>,
  thirdsResolved?: boolean,
): string {
  if (!anyPlayed) return 'st-row'

  if (i === 0 || i === 1) return 'st-row st-pos-top'       // verde
  if (i === 3) return 'st-row st-pos-fourth'               // rojo siempre

  // Posición 3 (i === 2)
  if (thirdsResolved && qualifiedThirdSlugs !== undefined) {
    if (qualifiedThirdSlugs.has(slug)) return 'st-row st-pos-third-in'   // verde
    return 'st-row st-pos-third-out'                                       // rojo
  }
  return 'st-row st-pos-third'                             // amarillo (pendiente)
}

export function StandingsTable({ standings, compact = false, qualifiedThirdSlugs, thirdsResolved }: Props) {
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
              className={getRowClass(i, row.team.slug, anyPlayed, qualifiedThirdSlugs, thirdsResolved)}
            >
              <td className="st-pos">
                <span className="st-pos-num">{i + 1}</span>
              </td>
              <td className="st-team">
                <Link href={`/equipo/${row.team.slug}`} className="st-team-link">
                  <TeamFlag code={row.team.flagCode} name={row.team.name} size={16} className="st-flag-img" />
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
          <span className="st-legend-dot st-legend-green" /> Clasifica
          <span className="st-legend-dot st-legend-yellow" style={{ marginLeft: 10 }} /> 3° (pendiente)
          <span className="st-legend-dot st-legend-red" style={{ marginLeft: 10 }} /> Eliminado
        </div>
      )}
    </div>
  )
}
