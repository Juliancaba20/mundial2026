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
  'F': 'Final',
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
      return `${m.home.score} - ${m.away.score}`
    }
    return undefined
  }
  const matchScore = getMatchScoreText(match)
  const scoreText = match.status === 'pending' ? null : matchScore
  const isGroupPhase = !('round' in match)

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
    <main className="px-4 py-8 min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Volver */}
        <div className="mb-5">
          <Link href="/partidos" className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#7D8590] hover:text-[#E6EDF3] transition-colors uppercase tracking-wider">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver a Fixture & Partidos
          </Link>
        </div>

        {/* Scoreboard visual principal */}
        <section 
          className={`bg-[#161B22] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 sm:p-8 mb-6 relative overflow-hidden shadow-xl ${
            isLive ? 'border-[#E8003D]/35 bg-gradient-to-b from-[#161B22] to-[#E8003D]/[0.02]' : ''
          }`} 
          id="match-scoreboard"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-[#7D8590] uppercase tracking-wider">{groupLabel}</span>
            {isLive && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 bg-[#E8003D]/12 border border-[#E8003D]/30 text-[#E8003D]">
                <span className="w-1.5 height-1.5 bg-[#E8003D] rounded-full animate-pulse" style={{ width: 6, height: 6 }} /> EN VIVO {match.clock}
              </span>
            )}
            {isDone && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-[#7D8590]">
                Finalizado
              </span>
            )}
            {!isLive && !isDone && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase inline-flex items-center gap-1.5 bg-[#00A86B]/12 border border-[#00A86B]/30 text-[#00A86B]">
                Próximo Partido
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-8 my-4">
            {/* Local */}
            <div className="flex flex-col items-center text-center">
              {homeFlagCode ? (
                <TeamFlag code={homeFlagCode} name={homeName} size={64} className="mb-4 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" />
              ) : (
                <div className="w-[64px] h-[64px] rounded-full bg-white/5 border border-white/10 mb-4 flex items-center justify-center text-2xl text-[#7D8590]">❓</div>
              )}
              {homeSlug ? (
                <Link href={`/equipo/${homeSlug}`} className="no-underline group">
                  <h1 className="text-2xl sm:text-3xl tracking-tight text-[#E6EDF3] group-hover:text-[#00A86B] transition-colors" style={{ fontFamily: 'var(--display)' }}>
                    {homeName}
                  </h1>
                </Link>
              ) : (
                <h1 className="text-2xl sm:text-3xl tracking-tight text-[#7D8590]" style={{ fontFamily: 'var(--display)' }}>
                  {homeName}
                </h1>
              )}
              <span className="text-[10px] font-bold text-[#7D8590] tracking-widest mt-1">LOCAL</span>
            </div>

            {/* Marcador / VS */}
            <div className="flex flex-col items-center justify-center">
              {scoreText ? (
                <div className="bg-[#1C2330] border border-[rgba(255,255,255,0.08)] px-6 py-2 rounded-lg mb-3">
                  <span className={`text-4xl sm:text-5xl font-bold tracking-wider ${isLive ? 'text-[#E8003D]' : 'text-[#E6EDF3]'}`} style={{ fontFamily: 'var(--display)' }}>
                    {scoreText}
                  </span>
                </div>
              ) : (
                <div className="bg-white/4 border border-white/6 w-12 h-12 flex items-center justify-center rounded-full mb-3">
                  <span className="text-lg text-[#7D8590]" style={{ fontFamily: 'var(--display)' }}>VS</span>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-xs sm:text-sm text-[#7D8590] font-medium capitalize">{formattedDate}</p>
                <p className="text-[11px] text-[#7D8590] mt-0.5">{formattedTime} hs (Hora Arg)</p>
              </div>
            </div>

            {/* Visitante */}
            <div className="flex flex-col items-center text-center">
              {awayFlagCode ? (
                <TeamFlag code={awayFlagCode} name={awayName} size={64} className="mb-4 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" />
              ) : (
                <div className="w-[64px] h-[64px] rounded-full bg-white/5 border border-white/10 mb-4 flex items-center justify-center text-2xl text-[#7D8590]">❓</div>
              )}
              {awaySlug ? (
                <Link href={`/equipo/${awaySlug}`} className="no-underline group">
                  <h1 className="text-2xl sm:text-3xl tracking-tight text-[#E6EDF3] group-hover:text-[#00A86B] transition-colors" style={{ fontFamily: 'var(--display)' }}>
                    {awayName}
                  </h1>
                </Link>
              ) : (
                <h1 className="text-2xl sm:text-3xl tracking-tight text-[#7D8590]" style={{ fontFamily: 'var(--display)' }}>
                  {awayName}
                </h1>
              )}
              <span className="text-[10px] font-bold text-[#7D8590] tracking-widest mt-1">VISITANTE</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] flex justify-center">
            <div className="flex items-center text-xs sm:text-sm text-[#7D8590] font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C10.1 20 5 13.9 5 9.3c0-4.3 3.1-7.3 7-7.3s7 3 7 7.3c0 4.6-5.1 10.7-7 12.4z" />
              </svg>
              <span>{fullStadium}, {locationLabel}</span>
            </div>
          </div>
        </section>

        {/* Dos columnas de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          
          {/* Columna Izquierda: Gemini AI Analysis */}
          <div className="overflow-hidden">
            <MatchAnalysisClient matchId={match.id} />
          </div>

          {/* Columna Derecha: Contexto del torneo */}
          <div className="flex flex-col gap-5">
            
            {/* Si es Fase de Grupos: Tabla de Posiciones */}
            {isGroupPhase && groupStandings.length > 0 && (
              <div className="bg-[#161B22] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden" id="group-standings">
                <div className="bg-[#1C2330] px-[18px] py-3.5 border-b border-[rgba(255,255,255,0.06)]">
                  <h3 className="text-sm font-bold tracking-wider text-[#E6EDF3]" style={{ fontFamily: 'var(--display)' }}>
                    TABLA GRUPO {'group' in match ? match.group : ''}
                  </h3>
                  <span className="text-[10.5px] text-[#7D8590] block mt-0.5">Clasificación en tiempo real</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className="text-center text-[#7D8590] font-semibold pb-2.5 border-b border-[rgba(255,255,255,0.06)]">Pos</th>
                        <th className="text-left text-[#7D8590] font-semibold pb-2.5 border-b border-[rgba(255,255,255,0.06)]">Selección</th>
                        <th className="text-center text-[#7D8590] font-semibold pb-2.5 border-b border-[rgba(255,255,255,0.06)]">PJ</th>
                        <th className="text-center text-[#7D8590] font-semibold pb-2.5 border-b border-[rgba(255,255,255,0.06)]">DG</th>
                        <th className="text-center text-[#7D8590] font-semibold pb-2.5 border-b border-[rgba(255,255,255,0.06)]">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStandings.map((st, index) => {
                        const isHomeActive = homeTeamRef && st.team.slug === homeTeamRef.slug
                        const isAwayActive = awayTeamRef && st.team.slug === awayTeamRef.slug
                        const isActive = isHomeActive || isAwayActive
                        const isQualifyingZone = index < 2
                        
                        return (
                          <tr key={st.team.slug} className={`border-b border-[rgba(255,255,255,0.04)] ${isActive ? 'bg-[#00A86B]/[0.04]' : ''}`}>
                            <td className="text-center py-2.5">
                              <span className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded ${
                                isQualifyingZone ? 'bg-[#00A86B]/12 text-[#00A86B] border border-[#00A86B]/20' : 'bg-white/5 text-[#7D8590]'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <Link href={`/equipo/${st.team.slug}`} className="no-underline flex items-center group">
                                <TeamFlag code={st.team.flagCode} name={st.team.name} size={16} style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                                <span className={`text-[#7D8590] group-hover:text-[#E6EDF3] transition-colors ${isActive ? 'text-[#E6EDF3] font-semibold' : ''}`}>
                                  {st.team.name}
                                </span>
                              </Link>
                            </td>
                            <td className="text-center font-mono py-2.5 text-[#E6EDF3]">{st.pj}</td>
                            <td className={`text-center font-mono py-2.5 ${st.dg > 0 ? 'text-[#00A86B]' : st.dg < 0 ? 'text-[#E8003D]' : 'text-[#7D8590]'}`}>
                              {st.dg > 0 ? `+${st.dg}` : st.dg}
                            </td>
                            <td className="text-center font-bold font-mono py-2.5 text-[#E6EDF3]">{st.pts}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-[18px] py-3 bg-[#161B22] border-t border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-1.5 text-[10.5px] text-[#7D8590]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                    <span>Clasifican a 16avos de Final</span>
                  </div>
                </div>
              </div>
            )}

            {/* Si es Eliminatoria Directa */}
            {!isGroupPhase && (
              <div className="bg-[#161B22] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden" id="knockout-stage">
                <div className="bg-[#1C2330] px-[18px] py-3.5 border-b border-[rgba(255,255,255,0.06)]">
                  <h3 className="text-sm font-bold tracking-wider text-[#E6EDF3]" style={{ fontFamily: 'var(--display)' }}>
                    FASE DE ELIMINATORIAS
                  </h3>
                  <span className="text-[10.5px] text-[#7D8590] block mt-0.5">Formato de eliminación directa</span>
                </div>
                <div className="p-[18px]">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex gap-3 text-[12.5px]">
                      <div className="text-lg flex-shrink-0">🏆</div>
                      <div>
                        <h4 className="font-semibold text-[#E6EDF3] mb-1">Ronda: {'round' in match ? ROUND_NAMES[match.round] || match.round : ''}</h4>
                        <p className="text-[#7D8590] leading-relaxed">
                          Partido de eliminación directa. En caso de empate en el tiempo reglamentario, se disputarán 30 minutos de tiempo suplementario, y de persistir la igualdad, se definirá mediante tiros desde el punto del penal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Datos y estadísticas rápidas */}
            <div className="bg-[#161B22] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden" id="match-facts">
              <div className="bg-[#1C2330] px-[18px] py-3.5 border-b border-[rgba(255,255,255,0.06)]">
                <h3 className="text-sm font-bold tracking-wider text-[#E6EDF3]" style={{ fontFamily: 'var(--display)' }}>
                  FICHA TÉCNICA
                </h3>
                <span className="text-[10.5px] text-[#7D8590] block mt-0.5">Detalles oficiales del cotejo</span>
              </div>
              <div className="p-[18px]">
                <ul className="flex flex-col gap-3 list-none">
                  <li className="flex justify-between text-xs sm:text-sm py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 last:pb-0">
                    <span className="text-[#7D8590] font-medium">Estadio:</span>
                    <span className="text-[#E6EDF3] text-right font-medium">{fullStadium}</span>
                  </li>
                  <li className="flex justify-between text-xs sm:text-sm py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 last:pb-0">
                    <span className="text-[#7D8590] font-medium">Ciudad Sede:</span>
                    <span className="text-[#E6EDF3] text-right font-medium">{locationLabel}</span>
                  </li>
                  <li className="flex justify-between text-xs sm:text-sm py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 last:pb-0">
                    <span className="text-[#7D8590] font-medium">Fecha:</span>
                    <span className="text-[#E6EDF3] text-right font-medium capitalize">{formattedDate}</span>
                  </li>
                  <li className="flex justify-between text-xs sm:text-sm py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 last:pb-0">
                    <span className="text-[#7D8590] font-medium">Horario:</span>
                    <span className="text-[#E6EDF3] text-right font-medium">{formattedTime ? `${formattedTime} hs (Argentina)` : 'Por definir'}</span>
                  </li>
                  <li className="flex justify-between text-xs sm:text-sm py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 last:pb-0">
                    <span className="text-[#7D8590] font-medium">Estado:</span>
                    <span className={`text-right font-bold ${
                      isLive ? 'text-[#E8003D]' : isDone ? 'text-[#7D8590]' : 'text-[#00A86B]'
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
    </main>
  )
}
