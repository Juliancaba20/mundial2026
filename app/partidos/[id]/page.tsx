import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchLiveResults, applyResults } from '@/lib/espn'
import { BASE_MATCHES } from '@/lib/data'
import { buildBracket } from '@/lib/bracket'
import { calculateStandings } from '@/lib/standings'
import { TeamFlag } from '@/components/TeamFlag'
import { MatchAnalysisClient } from '@/components/MatchAnalysisClient'

interface Props {
  params: Promise<{ id: string }>
}

const ROUND_NAMES: Record<string, string> = {
  'R32': 'Dieciseisavos de Final',
  'R16': 'Octavos de Final',
  'QF': 'Cuartos de Final',
  'SF': 'Semifinales',
  'F': 'Gran Final',
  '3RD': 'Tercer Puesto'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { results, knockoutResults } = await fetchLiveResults()
  const groupMatches = applyResults(BASE_MATCHES, results)
  const bracketMatches = buildBracket(groupMatches, knockoutResults)
  const allMatches = [...groupMatches, ...bracketMatches]
  const match = allMatches.find(m => m.id === id)

  if (!match) {
    return {
      title: 'Partido no encontrado - Mundial 2026',
    }
  }

  const homeTeamRef = 'team' in match.home ? match.home.team : match.home
  const awayTeamRef = 'team' in match.away ? match.away.team : match.away

  const homeName = homeTeamRef?.name ?? 'Por definir'
  const awayName = awayTeamRef?.name ?? 'Por definir'

  const roundName = 'group' in match ? `Grupo ${match.group}` : (ROUND_NAMES[match.round] || match.round)
  return {
    title: `${homeName} vs ${awayName} - ${roundName} - Mundial 2026`,
    description: `Detalles, resultado en vivo, estadísticas y análisis táctico de inteligencia artificial Gemini para el partido de ${homeName} vs ${awayName} en el Mundial 2026.`,
  }
}

export default async function PartidoDetailPage({ params }: Props) {
  const { id } = await params
  
  // Real-time server side data loading
  const { results, knockoutResults } = await fetchLiveResults()
  const groupMatches = applyResults(BASE_MATCHES, results)
  const bracketMatches = buildBracket(groupMatches, knockoutResults)
  const allMatches = [...groupMatches, ...bracketMatches]

  const match = allMatches.find(m => m.id === id)
  if (!match) {
    notFound()
  }

  const homeTeamRef = 'team' in match.home ? match.home.team : match.home
  const awayTeamRef = 'team' in match.away ? match.away.team : match.away

  const homeName = homeTeamRef?.name ?? 'Por definir'
  const awayName = awayTeamRef?.name ?? 'Por definir'
  const homeFlagCode = homeTeamRef?.flagCode
  const awayFlagCode = awayTeamRef?.flagCode
  const homeSlug = homeTeamRef?.slug
  const awaySlug = awayTeamRef?.slug

  const isLive = match.status === 'live'
  const isDone = match.status === 'done'

  const getMatchScoreText = (m: any): string | undefined => {
    if ('score' in m) {
      return m.score
    }
    if (m.home?.score !== undefined && m.away?.score !== undefined) {
      return `${m.home.score} – ${m.away.score}`
    }
    return undefined
  }
  const matchScore = getMatchScoreText(match)
  const scoreText = match.status === 'pending' ? null : matchScore
  const isGroupPhase = !('round' in match)

  let homeScoreVal = ''
  let awayScoreVal = ''
  if (scoreText) {
    const parts = scoreText.includes('–') ? scoreText.split('–') : scoreText.split('-')
    homeScoreVal = parts[0]?.trim() ?? ''
    awayScoreVal = parts[1]?.trim() ?? ''
  }

  // Extract stadium name if not present
  const fullStadium = ('stadium' in match ? match.stadium : null) || 'Estadio de Eliminatorias'
  const locationLabel = ('city' in match ? match.city : null) || ('venue' in match ? match.venue : null) || 'Sede del Encuentro'

  // If group phase, calculate current standings for this group
  const groupStandings = isGroupPhase && ('group' in match) ? calculateStandings(match.group, groupMatches) : []

  // Kickoff Date format safely
  const formattedDate = match.kickoff 
    ? new Date(match.kickoff).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      })
    : match.date

  const formattedTime = match.kickoff
    ? new Date(match.kickoff).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
      })
    : ''

  // Group label
  const groupLabel = 'group' in match 
    ? `Fase de Grupos · Grupo ${match.group}` 
    : `Eliminatorias directas · ${ROUND_NAMES[match.round] || match.round}`

  return (
    <div className="content-area">
      {/* Botón de retroceso modernizado con estilo premium */}
      <div className="mb-6">
        <Link 
          href="/partidos" 
          className="inline-flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--border2)] rounded-lg transition-all uppercase tracking-wider shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver a Fixture & Partidos
        </Link>
      </div>

      {/* Marcador Principal Imponente y Premium */}
      <section 
        className={`relative border rounded-2xl p-6 sm:p-10 mb-8 overflow-hidden shadow-2xl transition-all duration-300 ${
          isLive 
            ? 'border-[rgba(232,0,61,0.3)] bg-gradient-to-b from-[var(--surface)] to-[rgba(232,0,61,0.03)] shadow-[0_12px_40px_rgba(232,0,61,0.08)]' 
            : 'border-[var(--border2)] bg-[var(--surface)]'
        }`} 
        id="match-scoreboard"
      >
        {/* Resplandor radial de fondo */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background: isLive
              ? 'radial-gradient(circle 400px at 50% 0%, rgba(232,0,61,0.12), transparent)'
              : isDone
              ? 'radial-gradient(circle 400px at 50% 0%, rgba(255,255,255,0.03), transparent)'
              : 'radial-gradient(circle 400px at 50% 0%, rgba(0,168,107,0.08), transparent)'
          }}
        />

        {/* Encabezado del marcador */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-3 pb-6 border-b border-white/[0.06] mb-8">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">{groupLabel}</span>
          <div>
            {isLive && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase inline-flex items-center gap-2 bg-[var(--red-dim)] border border-[rgba(232,0,61,0.3)] text-[var(--red)] animate-pulse">
                <span className="w-2 h-2 bg-[var(--red)] rounded-full" /> EN VIVO {match.clock}
              </span>
            )}
            {isDone && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.1] text-[var(--muted)]">
                Finalizado
              </span>
            )}
            {!isLive && !isDone && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 bg-[var(--green-dim)] border border-[rgba(0,168,107,0.3)] text-[var(--green)]">
                Programado
              </span>
            )}
          </div>
        </div>

        {/* Grilla de selecciones y resultado */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-center gap-8 md:gap-4 my-2">
          
          {/* Local */}
          <div className="flex flex-col items-center text-center">
            {homeFlagCode ? (
              <div className="relative p-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 shadow-lg transition-transform hover:scale-105 duration-300">
                <TeamFlag code={homeFlagCode} name={homeName} size={76} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              </div>
            ) : (
              <div className="w-[84px] h-[84px] rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 flex items-center justify-center text-3xl text-[var(--muted)]">❓</div>
            )}
            {homeSlug ? (
              <Link href={`/equipo/${homeSlug}`} className="no-underline group">
                <h2 className="text-3xl sm:text-4xl tracking-wide text-[var(--text)] group-hover:text-[var(--green)] transition-colors uppercase" style={{ fontFamily: 'var(--display)' }}>
                  {homeName}
                </h2>
              </Link>
            ) : (
              <h2 className="text-3xl sm:text-4xl tracking-wide text-[var(--muted)] uppercase" style={{ fontFamily: 'var(--display)' }}>
                {homeName}
              </h2>
            )}
            <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest mt-2 uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">LOCAL</span>
          </div>

          {/* Marcador central */}
          <div className="flex flex-col items-center justify-center py-4">
            {scoreText ? (
              <div className="flex items-center justify-center gap-4 bg-black/40 border border-white/[0.08] px-8 py-3 rounded-2xl shadow-inner mb-4">
                <span className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none ${isLive ? 'text-[var(--red)] drop-shadow-[0_0_12px_rgba(232,0,61,0.25)]' : 'text-[var(--text)]'}`} style={{ fontFamily: 'var(--display)' }}>
                  {homeScoreVal}
                </span>
                <span className="text-xl text-[var(--faint)] font-bold">–</span>
                <span className={`text-5xl sm:text-6xl font-bold tracking-tight leading-none ${isLive ? 'text-[var(--red)] drop-shadow-[0_0_12px_rgba(232,0,61,0.25)]' : 'text-[var(--text)]'}`} style={{ fontFamily: 'var(--display)' }}>
                  {awayScoreVal}
                </span>
              </div>
            ) : (
              <div className="bg-white/[0.04] border border-white/[0.08] w-14 h-14 flex items-center justify-center rounded-full shadow-lg mb-4">
                <span className="text-xl text-[var(--muted)] font-semibold" style={{ fontFamily: 'var(--display)', letterSpacing: '0.05em' }}>VS</span>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-xs sm:text-sm text-[var(--text)] font-semibold uppercase tracking-wider">{formattedDate}</p>
              <p className="text-[11px] text-[var(--muted)] font-mono mt-1 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/[0.04] inline-block">{formattedTime ? `${formattedTime} hs (Hora Arg)` : 'Horario por definir'}</p>
            </div>
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center text-center">
            {awayFlagCode ? (
              <div className="relative p-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 shadow-lg transition-transform hover:scale-105 duration-300">
                <TeamFlag code={awayFlagCode} name={awayName} size={76} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
              </div>
            ) : (
              <div className="w-[84px] h-[84px] rounded-full bg-white/[0.04] border border-white/[0.08] mb-4 flex items-center justify-center text-3xl text-[var(--muted)]">❓</div>
            )}
            {awaySlug ? (
              <Link href={`/equipo/${awaySlug}`} className="no-underline group">
                <h2 className="text-3xl sm:text-4xl tracking-wide text-[var(--text)] group-hover:text-[var(--green)] transition-colors uppercase" style={{ fontFamily: 'var(--display)' }}>
                  {awayName}
                </h2>
              </Link>
            ) : (
              <h2 className="text-3xl sm:text-4xl tracking-wide text-[var(--muted)] uppercase" style={{ fontFamily: 'var(--display)' }}>
                {awayName}
              </h2>
            )}
            <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest mt-2 uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">VISITANTE</span>
          </div>
        </div>

        {/* Ficha rápida de ubicación */}
        <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06] flex justify-center">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--muted)] font-medium bg-black/20 px-4 py-2 rounded-xl border border-white/[0.04]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--green)]">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21.7C10.1 20 5 13.9 5 9.3c0-4.3 3.1-7.3 7-7.3s7 3 7 7.3c0 4.6-5.1 10.7-7 12.4z" />
            </svg>
            <span>{fullStadium} <span className="text-white/20 mx-1.5">|</span> {locationLabel}</span>
          </div>
        </div>
      </section>

      {/* Contenido en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* Columna Izquierda: Gemini AI Analysis (Con márgenes óptimos) */}
        <div className="overflow-hidden mt-[-24px]">
          <MatchAnalysisClient matchId={match.id} />
        </div>

        {/* Columna Derecha: Información de contexto del torneo */}
        <div className="flex flex-col gap-6">
          
          {/* Si es Fase de Grupos: Tabla de Posiciones Cohesiva */}
          {isGroupPhase && groupStandings.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg" id="group-standings">
              <div className="bg-[var(--surface2)] px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-base font-bold tracking-wider text-[var(--text)] uppercase" style={{ fontFamily: 'var(--display)' }}>
                  TABLA GRUPO {'group' in match ? match.group : ''}
                </h3>
                <span className="text-[11px] text-[var(--muted)] block mt-0.5">Clasificación en tiempo real</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-center text-[var(--muted)] font-semibold pb-3 border-b border-[var(--border)] w-10">Pos</th>
                      <th className="text-left text-[var(--muted)] font-semibold pb-3 border-b border-[var(--border)]">Selección</th>
                      <th className="text-center text-[var(--muted)] font-semibold pb-3 border-b border-[var(--border)] w-10">PJ</th>
                      <th className="text-center text-[var(--muted)] font-semibold pb-3 border-b border-[var(--border)] w-10">DG</th>
                      <th className="text-center text-[var(--muted)] font-semibold pb-3 border-b border-[var(--border)] w-10">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings.map((st, index) => {
                      const isHomeActive = homeTeamRef && st.team.slug === homeTeamRef.slug
                      const isAwayActive = awayTeamRef && st.team.slug === awayTeamRef.slug
                      const isActive = isHomeActive || isAwayActive
                      const isQualifyingZone = index < 2
                      
                      return (
                        <tr key={st.team.slug} className={`border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01] transition-colors ${isActive ? 'bg-[var(--green-dim)]/15' : ''}`}>
                          <td className="text-center py-3">
                            <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded ${
                              isQualifyingZone ? 'bg-[var(--green-dim)] text-[var(--green)] border border-[rgba(0,168,107,0.2)]' : 'bg-white/5 text-[var(--muted)]'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3">
                            <Link href={`/equipo/${st.team.slug}`} className="no-underline flex items-center gap-2 group">
                              <TeamFlag code={st.team.flagCode} name={st.team.name} size={18} className="shadow-sm" />
                              <span className={`text-[var(--text)] group-hover:text-[var(--green)] transition-colors ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                                {st.team.name}
                              </span>
                            </Link>
                          </td>
                          <td className="text-center font-mono py-3 text-[var(--text)]">{st.pj}</td>
                          <td className={`text-center font-mono py-3 ${st.dg > 0 ? 'text-[var(--green)] font-semibold' : st.dg < 0 ? 'text-[var(--red)]' : 'text-[var(--muted)]'}`}>
                            {st.dg > 0 ? `+${st.dg}` : st.dg}
                          </td>
                          <td className="text-center font-bold font-mono py-3 text-[var(--text)]">{st.pts}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-[var(--surface2)] border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-[10.5px] text-[var(--muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                  <span>Clasifican a 16avos de Final</span>
                </div>
              </div>
            </div>
          )}

          {/* Si es Eliminatoria Directa */}
          {!isGroupPhase && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg" id="knockout-stage">
              <div className="bg-[var(--surface2)] px-5 py-4 border-b border-[var(--border)]">
                <h3 className="text-base font-bold tracking-wider text-[var(--text)] uppercase" style={{ fontFamily: 'var(--display)' }}>
                  FASE DE ELIMINATORIAS
                </h3>
                <span className="text-[11px] text-[var(--muted)] block mt-0.5">Formato de eliminación directa</span>
              </div>
              <div className="p-5">
                <div className="flex gap-3.5 items-start text-[13px] leading-relaxed text-[var(--muted)]">
                  <div className="text-2xl bg-white/[0.04] p-2 rounded-xl border border-white/[0.06] flex-shrink-0">🏆</div>
                  <div>
                    <h4 className="font-semibold text-[var(--text)] mb-1 text-[14px]">Ronda de {'round' in match ? ROUND_NAMES[match.round] || match.round : ''}</h4>
                    <p>
                      Partido único de eliminación directa. En caso de empate en el tiempo reglamentario, se disputarán 30 minutos de tiempo suplementario, y de persistir la igualdad, se definirá mediante tiros desde el punto del penal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ficha Técnica Detallada */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg" id="match-facts">
            <div className="bg-[var(--surface2)] px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-base font-bold tracking-wider text-[var(--text)] uppercase" style={{ fontFamily: 'var(--display)' }}>
                FICHA TÉCNICA
              </h3>
              <span className="text-[11px] text-[var(--muted)] block mt-0.5">Detalles oficiales del cotejo</span>
            </div>
            <div className="p-5">
              <ul className="flex flex-col gap-4 list-none">
                <li className="flex justify-between items-center text-xs sm:text-sm pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                  <span className="text-[var(--muted)] font-medium">Estadio:</span>
                  <span className="text-[var(--text)] text-right font-semibold">{fullStadium}</span>
                </li>
                <li className="flex justify-between items-center text-xs sm:text-sm pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                  <span className="text-[var(--muted)] font-medium">Ciudad Sede:</span>
                  <span className="text-[var(--text)] text-right font-semibold">{locationLabel}</span>
                </li>
                <li className="flex justify-between items-center text-xs sm:text-sm pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                  <span className="text-[var(--muted)] font-medium">Fecha:</span>
                  <span className="text-[var(--text)] text-right font-semibold capitalize">{formattedDate}</span>
                </li>
                <li className="flex justify-between items-center text-xs sm:text-sm pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                  <span className="text-[var(--muted)] font-medium">Horario:</span>
                  <span className="text-[var(--text)] text-right font-semibold">{formattedTime ? `${formattedTime} hs (Arg)` : 'Por definir'}</span>
                </li>
                <li className="flex justify-between items-center text-xs sm:text-sm last:border-0 last:pb-0">
                  <span className="text-[var(--muted)] font-medium">Estado:</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    isLive ? 'bg-[var(--red-dim)] text-[var(--red)]' : isDone ? 'bg-white/5 text-[var(--muted)]' : 'bg-[var(--green-dim)] text-[var(--green)]'
                  }`}>
                    {isLive ? 'En Curso' : isDone ? 'Finalizado' : 'Programado'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
