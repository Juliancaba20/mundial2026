// ─── Helpers compartidos de partidos ─────────────────────────────────────────
// Centraliza lógica que antes estaba duplicada entre
// `app/partidos/[id]/page.tsx` y `scripts/generate-analysis.ts`.
// Cualquier cambio en la forma de `Match`/`BracketMatch` solo debe tocarse acá.

import { cache } from 'react'
import type { Match, BracketMatch, TeamRef } from '@/types'
import { fetchLiveResults, applyResults } from '@/lib/espn'
import { BASE_MATCHES } from '@/lib/data'
import { buildBracket } from '@/lib/bracket'

export type AnyMatch = Match | BracketMatch

export const ROUND_NAMES: Record<string, string> = {
  R32: 'Dieciseisavos de Final',
  R16: 'Octavos de Final',
  QF: 'Cuartos de Final',
  SF: 'Semifinales',
  F: 'Gran Final',
  '3RD': 'Tercer Puesto',
}

/**
 * Pipeline completo de datos en vivo (ESPN → grupos → bracket), cacheado por
 * request con `React.cache()` para que `generateMetadata` y el componente de
 * página (o cualquier route handler) no lo ejecuten dos veces en el mismo
 * request.
 */
export const getAllMatchesData = cache(async () => {
  const { results, knockoutResults } = await fetchLiveResults()
  const groupMatches = applyResults(BASE_MATCHES, results)
  const bracketMatches = buildBracket(groupMatches, knockoutResults)
  const allMatches: AnyMatch[] = [...groupMatches, ...bracketMatches]
  return { groupMatches, bracketMatches, allMatches }
})

export function findMatchById(allMatches: AnyMatch[], id: string): AnyMatch | undefined {
  return allMatches.find(m => m.id === id)
}

export function isGroupPhase(match: AnyMatch): match is Match {
  return !('round' in match)
}

export function getTeamRefs(match: AnyMatch): { home: TeamRef | null; away: TeamRef | null } {
  const home = 'team' in match.home ? match.home.team : match.home
  const away = 'team' in match.away ? match.away.team : match.away
  return { home: home ?? null, away: away ?? null }
}

/** true si a alguno de los dos equipos todavía no se le conoce el rival (bracket sin resolver). */
export function hasUndefinedTeams(match: AnyMatch): boolean {
  const { home, away } = getTeamRefs(match)
  return !home || !away
}

export function getMatchScoreText(match: AnyMatch): string | undefined {
  if ('score' in match && match.score) {
    return match.score
  }
  const home = (match as BracketMatch).home
  const away = (match as BracketMatch).away
  if (home?.score !== undefined && away?.score !== undefined) {
    return `${home.score} – ${away.score}`
  }
  return undefined
}

export function getPhaseLabel(match: AnyMatch): string {
  if (isGroupPhase(match)) {
    return `Grupo ${match.group}`
  }
  return ROUND_NAMES[match.round] || match.round
}

export function getStadiumInfo(match: AnyMatch): { stadium: string; location: string } {
  const stadium = ('stadium' in match ? match.stadium : null) || 'Estadio de Eliminatorias'
  const location = ('city' in match ? match.city : null) || ('venue' in match ? (match as Match).venue : null) || 'Sede del Encuentro'
  return { stadium, location }
}
