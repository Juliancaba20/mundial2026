import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BASE_MATCHES } from '@/lib/data'
import { buildBracket } from '@/lib/bracket'
import { calculateStandings } from '@/lib/standings'
import { TeamFlag } from '@/components/TeamFlag'
import { MatchAnalysisClient } from '@/components/MatchAnalysisClient'
import {
  ROUND_NAMES,
  getAllMatchesData,
  findMatchById,
  getTeamRefs,
  getMatchScoreText,
  getPhaseLabel,
  getStadiumInfo,
} from '@/lib/matches'

interface Props {
  params: Promise<{ id: string }>
}

// Pre-renderiza los 104 partidos conocidos del torneo (48 de grupos + 56 de
// eliminatorias) en build time. El bracket estructural (ids, rondas, fechas)
// es fijo independientemente del resultado en vivo, por lo que no necesita
// datos de ESPN para generarse — evita depender de la red en build.
export async function generateStaticParams() {
  const structuralBracket = buildBracket(BASE_MATCHES, {})
  const ids = [...BASE_MATCHES, ...structuralBracket].map(m => ({ id: m.id }))
  return ids
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { allMatches } = await getAllMatchesData()
  const match = findMatchById(allMatches, id)

  if (!match) {
    return {
      title: 'Partido no encontrado - Mundial 2026',
    }
  }

  const { home: homeTeamRef, away: awayTeamRef } = getTeamRefs(match)
  const homeName = homeTeamRef?.name ?? 'Por definir'
  const awayName = awayTeamRef?.name ?? 'Por definir'
  const roundName = getPhaseLabel(match)
  const title = `${homeName} vs ${awayName} - ${roundName} - Mundial 2026`
  const description = `Detalles, resultado en vivo, estadísticas y análisis táctico de inteligencia artificial Gemini para el partido de ${homeName} vs ${awayName} en el Mundial 2026.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_AR',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function PartidoDetailPage({ params }: Props) {
  const { id } = await params

  // Real-time server side data loading (cacheado por request con React.cache)
  const { groupMatches, allMatches } = await getAllMatchesData()

  const match = findMatchById(allMatches, id)
  if (!match) {
    notFound()
  }

  const { home: homeTeamRef, away: awayTeamRef } = getTeamRefs(match)

  const homeName = homeTeamRef?.name ?? 'Por definir'
  const awayName = awayTeamRef?.name ?? 'Por definir'
  const homeFlagCode = homeTeamRef?.flagCode
  const awayFlagCode = awayTeamRef?.flagCode
  const homeSlug = homeTeamRef?.slug
  const awaySlug = awayTeamRef?.slug

  const isLive = match.status === 'live'
  const isDone = match.status === 'done'

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
  const { stadium: fullStadium, location: locationLabel } = getStadiumInfo(match)

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

  const scoreboardStateClass = isLive ? 'is-live' : isDone ? 'is-done' : 'is-scheduled'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${homeName} vs ${awayName}`,
    startDate: match.kickoff || undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: fullStadium,
      address: locationLabel,
    },
    competitor: [
      { '@type': 'SportsTeam', name: homeName },
      { '@type': 'SportsTeam', name: awayName },
    ],
  }

  return (
    <div className="content-area">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Botón de retroceso */}
      <div className="match-back-wrap">
        <Link href="/partidos" className="match-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver a Fixture &amp; Partidos
        </Link>
      </div>

      {/* Marcador Principal */}
      <section className={`match-scoreboard ${scoreboardStateClass}`} id="match-scoreboard">
        <div className="match-scoreboard-glow" />

        <div className="match-scoreboard-header">
          <span className="match-phase-label">{groupLabel}</span>
          <div>
            {isLive && (
              <span className="match-status-badge is-live">
                <span className="match-status-dot" /> EN VIVO {match.clock}
              </span>
            )}
            {isDone && (
              <span className="match-status-badge is-done">Finalizado</span>
            )}
            {!isLive && !isDone && (
              <span className="match-status-badge is-scheduled">Programado</span>
            )}
          </div>
        </div>

        <div className="match-teams-grid">

          {/* Local */}
          <div className="match-team-col">
            {homeFlagCode ? (
              <div className="match-team-flag-wrap">
                <TeamFlag code={homeFlagCode} name={homeName} size={76} className="match-team-flag-img" />
              </div>
            ) : (
              <div className="match-team-flag-placeholder">❓</div>
            )}
            {homeSlug ? (
              <Link href={`/equipo/${homeSlug}`} className="match-team-name-link">
                <h2 className="match-team-name">{homeName}</h2>
              </Link>
            ) : (
              <h2 className="match-team-name is-muted">{homeName}</h2>
            )}
            <span className="match-team-tag">LOCAL</span>
          </div>

          {/* Marcador central */}
          <div className="match-center-col">
            {scoreText ? (
              <div className="match-score-box">
                <span className={`match-score-num ${isLive ? 'is-live' : ''}`}>{homeScoreVal}</span>
                <span className="match-score-sep">–</span>
                <span className={`match-score-num ${isLive ? 'is-live' : ''}`}>{awayScoreVal}</span>
              </div>
            ) : (
              <div className="match-vs-circle">
                <span className="match-vs-text">VS</span>
              </div>
            )}

            <div className="match-date-block">
              <p className="match-date-text">{formattedDate}</p>
              <p className="match-time-pill">{formattedTime ? `${formattedTime} hs (Hora Arg)` : 'Horario por definir'}</p>
            </div>
          </div>

          {/* Visitante */}
          <div className="match-team-col">
            {awayFlagCode ? (
              <div className="match-team-flag-wrap">
                <TeamFlag code={awayFlagCode} name={awayName} size={76} className="match-team-flag-img" />
              </div>
            ) : (
              <div className="match-team-flag-placeholder">❓</div>
            )}
            {awaySlug ? (
              <Link href={`/equipo/${awaySlug}`} className="match-team-name-link">
                <h2 className="match-team-name">{awayName}</h2>
              </Link>
            ) : (
              <h2 className="match-team-name is-muted">{awayName}</h2>
            )}
            <span className="match-team-tag">VISITANTE</span>
          </div>
        </div>

        {/* Ficha rápida de ubicación */}
        <div className="match-venue-row">
          <div className="match-venue-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="match-venue-icon">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21.7C10.1 20 5 13.9 5 9.3c0-4.3 3.1-7.3 7-7.3s7 3 7 7.3c0 4.6-5.1 10.7-7 12.4z" />
            </svg>
            <span>{fullStadium} <span className="match-venue-sep">|</span> {locationLabel}</span>
          </div>
        </div>
      </section>

      {/* Contenido en dos columnas.
          En mobile, la ficha/tabla (más rápida de escanear) va primero y el
          análisis de IA (más pesado de leer) va después; en desktop mantienen
          el orden visual original de dos columnas lado a lado. */}
      <div className="match-content-grid">

        {/* Columna principal: Análisis IA */}
        <div className="match-content-main">
          <MatchAnalysisClient matchId={match.id} />
        </div>

        {/* Columna lateral: contexto del torneo */}
        <div className="match-content-side">

          {/* Si es Fase de Grupos: Tabla de Posiciones */}
          {isGroupPhase && groupStandings.length > 0 && (
            <div className="match-card" id="group-standings">
              <div className="match-card-header">
                <h3 className="match-card-title">TABLA GRUPO {'group' in match ? match.group : ''}</h3>
                <span className="match-card-subtitle">Clasificación en tiempo real</span>
              </div>
              <div className="match-card-body match-standings-scroll">
                <table className="match-standings-table">
                  <thead>
                    <tr>
                      <th className="col-pos">Pos</th>
                      <th className="col-team">Selección</th>
                      <th className="col-num">PJ</th>
                      <th className="col-num">DG</th>
                      <th className="col-num">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings.map((st, index) => {
                      const isHomeActive = homeTeamRef && st.team.slug === homeTeamRef.slug
                      const isAwayActive = awayTeamRef && st.team.slug === awayTeamRef.slug
                      const isActive = isHomeActive || isAwayActive
                      const isQualifyingZone = index < 2

                      return (
                        <tr key={st.team.slug} className={isActive ? 'is-active-row' : ''}>
                          <td className="col-pos">
                            <span className={`match-standings-pos ${isQualifyingZone ? 'is-qualifying' : ''}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="col-team">
                            <Link href={`/equipo/${st.team.slug}`} className="match-standings-team-link">
                              <TeamFlag code={st.team.flagCode} name={st.team.name} size={18} className="match-standings-flag" />
                              <span className={isActive ? 'is-active-name' : ''}>{st.team.name}</span>
                            </Link>
                          </td>
                          <td className="col-num">{st.pj}</td>
                          <td className={`col-num ${st.dg > 0 ? 'is-positive' : st.dg < 0 ? 'is-negative' : ''}`}>
                            {st.dg > 0 ? `+${st.dg}` : st.dg}
                          </td>
                          <td className="col-num is-bold">{st.pts}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="match-card-footer">
                <span className="match-standings-dot" />
                <span>Clasifican a 16avos de Final</span>
              </div>
            </div>
          )}

          {/* Si es Eliminatoria Directa */}
          {!isGroupPhase && (
            <div className="match-card" id="knockout-stage">
              <div className="match-card-header">
                <h3 className="match-card-title">FASE DE ELIMINATORIAS</h3>
                <span className="match-card-subtitle">Formato de eliminación directa</span>
              </div>
              <div className="match-card-body">
                <div className="knockout-info-row">
                  <div className="knockout-icon">🏆</div>
                  <div>
                    <h4 className="knockout-title">Ronda de {'round' in match ? ROUND_NAMES[match.round] || match.round : ''}</h4>
                    <p className="knockout-text">
                      Partido único de eliminación directa. En caso de empate en el tiempo reglamentario, se disputarán 30 minutos de tiempo suplementario, y de persistir la igualdad, se definirá mediante tiros desde el punto del penal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ficha Técnica Detallada */}
          <div className="match-card" id="match-facts">
            <div className="match-card-header">
              <h3 className="match-card-title">FICHA TÉCNICA</h3>
              <span className="match-card-subtitle">Detalles oficiales del cotejo</span>
            </div>
            <div className="match-card-body">
              <ul className="match-facts-list">
                <li className="match-facts-row">
                  <span className="match-facts-label">Estadio:</span>
                  <span className="match-facts-value">{fullStadium}</span>
                </li>
                <li className="match-facts-row">
                  <span className="match-facts-label">Ciudad Sede:</span>
                  <span className="match-facts-value">{locationLabel}</span>
                </li>
                <li className="match-facts-row">
                  <span className="match-facts-label">Fecha:</span>
                  <span className="match-facts-value capitalize">{formattedDate}</span>
                </li>
                <li className="match-facts-row">
                  <span className="match-facts-label">Horario:</span>
                  <span className="match-facts-value">{formattedTime ? `${formattedTime} hs (Arg)` : 'Por definir'}</span>
                </li>
                <li className="match-facts-row is-last">
                  <span className="match-facts-label">Estado:</span>
                  <span className={`match-status-pill ${isLive ? 'is-live' : isDone ? 'is-done' : 'is-scheduled'}`}>
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
