import type { Match, BracketMatch, BracketRound, BracketSlot, TeamRef, KnockoutResultsMap } from '@/types'
import { calculateStandings } from './standings'
import { THIRD_PLACE_TABLE } from './thirdPlaceTable'

// ─── Slot vacío ───────────────────────────────────────────────────────────────

function emptySlot(label: string): BracketSlot {
  return { label, team: null }
}

function teamSlot(team: TeamRef, label: string): BracketSlot {
  return { label, team }
}

// ─── Mejores terceros (FIFA) ──────────────────────────────────────────────────
// De los 12 terceros de cada grupo, clasifican los 8 mejores
// Criterio: pts → dg → gf → orden alfabético

export function getBestThirds(matches: Match[]): Array<{ group: string; team: TeamRef | null }> {
  const thirds: Array<{ group: string; team: TeamRef | null; pts: number; dg: number; gf: number }> = []

  for (const letter of 'ABCDEFGHIJKL'.split('')) {
    const standings = calculateStandings(letter, matches)
    if (standings.length >= 3) {
      const third = standings[2]
      thirds.push({
        group: letter,
        team: third.team,
        pts: third.pts,
        dg: third.dg,
        gf: third.gf,
      })
    } else {
      thirds.push({ group: letter, team: null, pts: 0, dg: 0, gf: 0 })
    }
  }

  // Ordenar por pts → dg → gf para determinar los 8 mejores
  return thirds
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
    .map(t => ({ group: t.group, team: t.team }))
}

// ─── Asignación oficial de los 8 mejores terceros (Anexo C, Reglamento FIFA) ──
// Qué grupo enfrenta a qué tercero depende de CUÁLES 8 grupos (de los 12)
// aportan un tercero clasificado. FIFA publicó las 495 combinaciones posibles
// en el Anexo C del reglamento. THIRD_PLACE_TABLE contiene esa tabla completa.
// Devuelve, para cada uno de los 8 grupos ganadores (A,B,D,E,G,I,K,L), el grupo
// de origen del tercero que le toca enfrentar, según la combinación real.

function resolveThirdPlaceMatchups(
  bestThirds: Array<{ group: string; team: TeamRef | null }>
): Record<'A' | 'B' | 'D' | 'E' | 'G' | 'I' | 'K' | 'L', string | null> {
  const qualifiedGroups = bestThirds
    .slice(0, 8)
    .map(t => t.group)
    .filter(g => bestThirds.find(t => t.group === g)?.team != null)
    .sort()

  // Si todavía no hay 8 terceros con equipo real (fase de grupos incompleta),
  // no se puede resolver la fila exacta del Anexo C todavía.
  if (qualifiedGroups.length !== 8) {
    return { A: null, B: null, D: null, E: null, G: null, I: null, K: null, L: null }
  }

  const row = THIRD_PLACE_TABLE.find(
    r => r.groups.length === qualifiedGroups.length && r.groups.every((g, i) => g === qualifiedGroups[i])
  )

  if (!row) {
    // No debería ocurrir: las 495 combinaciones cubren todos los choose(12,8) casos.
    return { A: null, B: null, D: null, E: null, G: null, I: null, K: null, L: null }
  }

  return row.vs as Record<'A' | 'B' | 'D' | 'E' | 'G' | 'I' | 'K' | 'L', string>
}

// ─── Propagación de ganadores entre rondas ────────────────────────────────────
// Dado un BracketMatch con ambos equipos ya conocidos, busca en
// KnockoutResultsMap (indexado por slug de equipo) el resultado de ESE cruce
// específico — confirmando que el rival que ESPN reportó para cada equipo
// coincide con el rival real del partido — y devuelve:
//   - { kind:'done',  winner, homeScore, awayScore } si terminó con ganador
//     → propaga el ganador a la ronda siguiente.
//   - { kind:'live',  homeScore, awayScore, clock } si está en juego
//     → marca score + EN VIVO, pero NO propaga ganador (no terminó).
//   - null si no hay datos, no coincide el cruce, o el resultado no es útil.

type ResolvedResult =
  | { kind: 'done'; winner: TeamRef; homeScore: string; awayScore: string }
  | { kind: 'live'; homeScore: string; awayScore: string; clock: string }

function resolveMatchResult(
  home: TeamRef,
  away: TeamRef,
  knockoutResults: KnockoutResultsMap
): ResolvedResult | null {
  const homeResult = knockoutResults[home.slug]
  const awayResult = knockoutResults[away.slug]

  // Preferimos el resultado visto desde el lado "home": si ESPN reportó que
  // el rival de `home` fue exactamente `away`, es el mismo partido.
  const fromHome = homeResult && homeResult.opponentSlug === away.slug ? homeResult : null
  const fromAway = awayResult && awayResult.opponentSlug === home.slug ? awayResult : null
  const result = fromHome ?? fromAway
  if (!result) return null

  const homeScoreStr = fromHome ? result.ownScore : result.opponentScore
  const awayScoreStr = fromHome ? result.opponentScore : result.ownScore

  // En vivo: mostramos marcador parcial + clock, sin propagar ganador.
  if (result.status === 'live') {
    return { kind: 'live', homeScore: homeScoreStr, awayScore: awayScoreStr, clock: result.clock }
  }

  // Solo propagamos ganador cuando el partido terminó con resultado válido.
  if (result.status !== 'done') return null

  const homeScoreNum = parseInt(homeScoreStr, 10)
  const awayScoreNum = parseInt(awayScoreStr, 10)
  if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) return null
  if (homeScoreNum === awayScoreNum) return null // empate sin penales resueltos aún: no propagar

  const winner = homeScoreNum > awayScoreNum ? home : away
  return {
    kind: 'done',
    winner,
    homeScore: String(homeScoreNum),
    awayScore: String(awayScoreNum),
  }
}

// Aplica los resultados conocidos a una ronda ya construida, completando
// `score`/`status` en sus partidos, y empuja al ganador de cada partido
// terminado al slot correspondiente de la ronda siguiente (según
// nextMatchId/nextPosition). Devuelve la ronda siguiente ya actualizada,
// para encadenar ronda tras ronda (R32→R16→QF→SF→F/3RD).

function propagateRound(
  currentRound: BracketMatch[],
  nextRound: BracketMatch[],
  knockoutResults: KnockoutResultsMap
): { current: BracketMatch[]; next: BracketMatch[] } {
  const updatedCurrent = currentRound.map(m => ({
    ...m,
    home: { ...m.home },
    away: { ...m.away },
  }))
  const updatedNext = nextRound.map(m => ({
    ...m,
    home: { ...m.home },
    away: { ...m.away },
  }))

  for (const match of updatedCurrent) {
    if (!match.home.team || !match.away.team) continue // slot aún no resuelto

    const result = resolveMatchResult(match.home.team, match.away.team, knockoutResults)
    if (!result) continue

    // En vivo: marcador parcial + clock, SIN propagar ganador (no terminó).
    if (result.kind === 'live') {
      match.home.score = result.homeScore
      match.away.score = result.awayScore
      match.status = 'live'
      match.clock = result.clock
      continue
    }

    // Finalizado: marcador definitivo + propagar ganador al slot siguiente.
    match.home.score = result.homeScore
    match.away.score = result.awayScore
    match.status = 'done'
    match.clock = undefined

    if (!match.nextMatchId || !match.nextPosition) continue
    const target = updatedNext.find(m => m.id === match.nextMatchId)
    if (!target) continue

    const label = target[match.nextPosition].label
    target[match.nextPosition] = teamSlot(result.winner, label)
  }

  return { current: updatedCurrent, next: updatedNext }
}

// ─── Cruces de 16avos según el cuadro oficial FIFA World Cup 26 ──────────────
// Partidos 73-88 del calendario oficial. 8 cruces son 1°/2° o 2°/2° fijos;
// los otros 8 son "Ganador de Grupo vs Mejor 3°", resueltos vía Anexo C.

export function buildBracket(matches: Match[], knockoutResults: KnockoutResultsMap = {}): BracketMatch[] {
  // Calcular clasificados de cada grupo
  const groupStandings: Record<string, ReturnType<typeof calculateStandings>> = {}
  for (const letter of 'ABCDEFGHIJKL'.split('')) {
    groupStandings[letter] = calculateStandings(letter, matches)
  }

  function first(g: string): BracketSlot {
    const s = groupStandings[g]
    const team = s?.[0]?.team ?? null
    return team ? teamSlot(team, `1° Grupo ${g}`) : emptySlot(`1° Grupo ${g}`)
  }

  function second(g: string): BracketSlot {
    const s = groupStandings[g]
    const team = s?.[1]?.team ?? null
    return team ? teamSlot(team, `2° Grupo ${g}`) : emptySlot(`2° Grupo ${g}`)
  }

  const bestThirds = getBestThirds(matches)
  const thirdMatchups = resolveThirdPlaceMatchups(bestThirds)

  // Slot del "mejor 3°" que enfrenta al ganador de groupLetter, con el label
  // oficial (lista de grupos posibles) hasta que se resuelva, y el equipo real
  // una vez que el Anexo C ya determinó el origen exacto.
  function thirdVs(groupLetter: 'A' | 'B' | 'D' | 'E' | 'G' | 'I' | 'K' | 'L', possibleGroupsLabel: string): BracketSlot {
    const originGroup = thirdMatchups[groupLetter]
    if (!originGroup) return emptySlot(`Mejor 3° Grupo ${possibleGroupsLabel}`)
    const entry = bestThirds.find(t => t.group === originGroup)
    if (!entry?.team) return emptySlot(`Mejor 3° Grupo ${possibleGroupsLabel}`)
    return teamSlot(entry.team, `3° Grupo ${originGroup}`)
  }

  // ── 16avos (R32) — 16 partidos, cuadro oficial FIFA (partidos 73-88) ──────
  // nextMatchId/nextPosition verificados contra el cuadro oficial de octavos
  // (Yahoo Sports, partidos 89-96, 4 jul 2026): antes estaban mal armados
  // (ej. R32-2 alimentaba R16-1 junto con R32-1, cuando en realidad el ganador
  // de R32-2 —Alemania/Paraguay— juega contra el ganador de R32-5 —Francia—,
  // no contra el ganador de R32-1 —Sudáfrica/Canadá—).
  const r32: BracketMatch[] = [
    { id:'R32-1',  round:'R32', date:'28 jun', kickoff:'2026-06-28T19:00:00Z', home:second('A'), away:second('B'),                status:'pending', nextMatchId:'R16-1', nextPosition:'home' }, // M73  12:00 PDT → 19:00 UTC
    { id:'R32-2',  round:'R32', date:'29 jun', kickoff:'2026-06-29T20:30:00Z', home:first('E'),  away:thirdVs('E', 'A/B/C/D/F'),   status:'pending', nextMatchId:'R16-2', nextPosition:'home' }, // M74  16:30 EDT → 20:30 UTC
    { id:'R32-3',  round:'R32', date:'1 jul',  kickoff:'2026-07-01T01:00:00Z', home:first('F'),  away:second('C'),                 status:'pending', nextMatchId:'R16-1', nextPosition:'away' }, // M75  19:00 MDT → 01:00 UTC
    { id:'R32-4',  round:'R32', date:'29 jun', kickoff:'2026-06-29T17:00:00Z', home:first('C'),  away:second('F'),                 status:'pending', nextMatchId:'R16-3', nextPosition:'home' }, // M76  12:00 CDT → 17:00 UTC
    { id:'R32-5',  round:'R32', date:'30 jun', kickoff:'2026-06-30T21:00:00Z', home:first('I'),  away:thirdVs('I', 'C/D/F/G/H'),   status:'pending', nextMatchId:'R16-2', nextPosition:'away' }, // M77  17:00 EDT → 21:00 UTC
    { id:'R32-6',  round:'R32', date:'30 jun', kickoff:'2026-06-30T17:00:00Z', home:second('E'), away:second('I'),                 status:'pending', nextMatchId:'R16-3', nextPosition:'away' }, // M78  12:00 CDT → 17:00 UTC
    { id:'R32-7',  round:'R32', date:'1 jul',  kickoff:'2026-07-01T01:00:00Z', home:first('A'),  away:thirdVs('A', 'C/E/F/H/I'),   status:'pending', nextMatchId:'R16-4', nextPosition:'home' }, // M79  19:00 MDT → 01:00 UTC
    { id:'R32-8',  round:'R32', date:'1 jul',  kickoff:'2026-07-01T16:00:00Z', home:first('L'),  away:thirdVs('L', 'E/H/I/J/K'),   status:'pending', nextMatchId:'R16-4', nextPosition:'away' }, // M80  12:00 EDT → 16:00 UTC
    { id:'R32-9',  round:'R32', date:'1 jul',  kickoff:'2026-07-02T00:00:00Z', home:first('D'),  away:thirdVs('D', 'B/E/F/I/J'),   status:'pending', nextMatchId:'R16-6', nextPosition:'away' }, // M81  17:00 PDT → 00:00 UTC
    { id:'R32-10', round:'R32', date:'1 jul',  kickoff:'2026-07-01T20:00:00Z', home:first('G'),  away:thirdVs('G', 'A/E/H/I/J'),   status:'pending', nextMatchId:'R16-6', nextPosition:'home' }, // M82  13:00 PDT → 20:00 UTC
    { id:'R32-11', round:'R32', date:'2 jul',  kickoff:'2026-07-02T23:00:00Z', home:second('K'), away:second('L'),                 status:'pending', nextMatchId:'R16-5', nextPosition:'away' }, // M83  19:00 EDT → 23:00 UTC
    { id:'R32-12', round:'R32', date:'2 jul',  kickoff:'2026-07-02T19:00:00Z', home:first('H'),  away:second('J'),                 status:'pending', nextMatchId:'R16-5', nextPosition:'home' }, // M84  12:00 PDT → 19:00 UTC
    { id:'R32-13', round:'R32', date:'3 jul',  kickoff:'2026-07-03T03:00:00Z', home:first('B'),  away:thirdVs('B', 'E/F/G/I/J'),   status:'pending', nextMatchId:'R16-8', nextPosition:'home' }, // M85  20:00 PDT → 03:00 UTC
    { id:'R32-14', round:'R32', date:'3 jul',  kickoff:'2026-07-03T22:00:00Z', home:first('J'),  away:second('H'),                 status:'pending', nextMatchId:'R16-7', nextPosition:'away' }, // M86  18:00 EDT → 22:00 UTC
    { id:'R32-15', round:'R32', date:'4 jul',  kickoff:'2026-07-04T01:30:00Z', home:first('K'),  away:thirdVs('K', 'D/E/I/J/L'),   status:'pending', nextMatchId:'R16-8', nextPosition:'away' }, // M87  20:30 CDT → 01:30 UTC
    { id:'R32-16', round:'R32', date:'3 jul',  kickoff:'2026-07-03T18:00:00Z', home:second('D'), away:second('G'),                 status:'pending', nextMatchId:'R16-7', nextPosition:'home' }, // M88  13:00 CDT → 18:00 UTC
  ]

  // ── Octavos (R16) — 8 partidos, verificados 1 a 1 contra el cuadro oficial ──
  // R16-1 = M90 (Canadá/Marruecos), R16-2 = M89 (Paraguay/Francia),
  // R16-3 = M91 (Brasil/Noruega), R16-4 = M92 (México/Inglaterra),
  // R16-5 = M93 (España/Portugal), R16-6 = M94 (Bélgica/EE.UU.),
  // R16-7 = M95 (Egipto/Argentina), R16-8 = M96 (Suiza/Colombia).
  const r16: BracketMatch[] = [
    { id:'R16-1', round:'R16', date:'4 jul',  kickoff:'2026-07-04T17:00:00Z', home:emptySlot('G. R32-1'),  away:emptySlot('G. R32-3'),  status:'pending', nextMatchId:'QF-1', nextPosition:'home' }, // M90  12:00 CDT → 17:00 UTC
    { id:'R16-2', round:'R16', date:'4 jul',  kickoff:'2026-07-04T21:00:00Z', home:emptySlot('G. R32-2'),  away:emptySlot('G. R32-5'),  status:'pending', nextMatchId:'QF-1', nextPosition:'away' }, // M89  17:00 EDT → 21:00 UTC
    { id:'R16-3', round:'R16', date:'5 jul',  kickoff:'2026-07-05T20:00:00Z', home:emptySlot('G. R32-4'),  away:emptySlot('G. R32-6'),  status:'pending', nextMatchId:'QF-3', nextPosition:'home' }, // M91  16:00 EDT → 20:00 UTC
    { id:'R16-4', round:'R16', date:'6 jul',  kickoff:'2026-07-06T00:00:00Z', home:emptySlot('G. R32-7'),  away:emptySlot('G. R32-8'),  status:'pending', nextMatchId:'QF-3', nextPosition:'away' }, // M92  20:00 EDT (5 jul) → 00:00 UTC (6 jul)
    { id:'R16-5', round:'R16', date:'6 jul',  kickoff:'2026-07-06T19:00:00Z', home:emptySlot('G. R32-12'), away:emptySlot('G. R32-11'), status:'pending', nextMatchId:'QF-2', nextPosition:'home' }, // M93  15:00 EDT → 19:00 UTC
    { id:'R16-6', round:'R16', date:'7 jul',  kickoff:'2026-07-07T00:00:00Z', home:emptySlot('G. R32-10'), away:emptySlot('G. R32-9'),  status:'pending', nextMatchId:'QF-2', nextPosition:'away' }, // M94  20:00 EDT (6 jul) → 00:00 UTC (7 jul)
    { id:'R16-7', round:'R16', date:'7 jul',  kickoff:'2026-07-07T16:00:00Z', home:emptySlot('G. R32-16'), away:emptySlot('G. R32-14'), status:'pending', nextMatchId:'QF-4', nextPosition:'home' }, // M95  12:00 EDT → 16:00 UTC
    { id:'R16-8', round:'R16', date:'7 jul',  kickoff:'2026-07-07T20:00:00Z', home:emptySlot('G. R32-13'), away:emptySlot('G. R32-15'), status:'pending', nextMatchId:'QF-4', nextPosition:'away' }, // M96  16:00 EDT → 20:00 UTC
  ]

  // ── Cuartos (QF) — 4 partidos ─────────────────────────────────────────────
  // QF-1 = M97 (ganador M89/M90), QF-2 = M98 (ganador M93/M94),
  // QF-3 = M99 (ganador M91/M92), QF-4 = M100 (ganador M95/M96).
  const qf: BracketMatch[] = [
    { id:'QF-1', round:'QF', date:'9 jul',  kickoff:'2026-07-09T20:00:00Z', home:emptySlot('G. Oct. 1'), away:emptySlot('G. Oct. 2'), status:'pending', nextMatchId:'SF-1', nextPosition:'home' }, // M97  16:00 EDT → 20:00 UTC
    { id:'QF-2', round:'QF', date:'10 jul', kickoff:'2026-07-10T19:00:00Z', home:emptySlot('G. Oct. 5'), away:emptySlot('G. Oct. 6'), status:'pending', nextMatchId:'SF-1', nextPosition:'away' }, // M98  12:00 PDT → 19:00 UTC
    { id:'QF-3', round:'QF', date:'11 jul', kickoff:'2026-07-11T21:00:00Z', home:emptySlot('G. Oct. 3'), away:emptySlot('G. Oct. 4'), status:'pending', nextMatchId:'SF-2', nextPosition:'home' }, // M99  17:00 EDT → 21:00 UTC
    { id:'QF-4', round:'QF', date:'12 jul', kickoff:'2026-07-12T01:00:00Z', home:emptySlot('G. Oct. 7'), away:emptySlot('G. Oct. 8'), status:'pending', nextMatchId:'SF-2', nextPosition:'away' }, // M100 20:00 CDT → 01:00 UTC
  ]

  // ── Semifinales (SF) — 2 partidos ─────────────────────────────────────────
  const sf: BracketMatch[] = [
    { id:'SF-1', round:'SF', date:'14 jul', kickoff:'2026-07-14T19:00:00Z', home:emptySlot('G. Cto. 1'), away:emptySlot('G. Cto. 2'), status:'pending', nextMatchId:'F', nextPosition:'home' }, // M101 14:00 CDT → 19:00 UTC
    { id:'SF-2', round:'SF', date:'15 jul', kickoff:'2026-07-15T19:00:00Z', home:emptySlot('G. Cto. 3'), away:emptySlot('G. Cto. 4'), status:'pending', nextMatchId:'F', nextPosition:'away' }, // M102 15:00 EDT → 19:00 UTC
  ]

  // ── Final + 3er puesto ────────────────────────────────────────────────────
  const final: BracketMatch[] = [
    { id:'3RD', round:'3RD', date:'18 jul', kickoff:'2026-07-18T21:00:00Z', home:emptySlot('Perdedor SF-1'), away:emptySlot('Perdedor SF-2'), status:'pending' }, // M103 17:00 EDT → 21:00 UTC
    { id:'F',   round:'F',   date:'19 jul', kickoff:'2026-07-19T19:00:00Z', home:emptySlot('Ganador SF-1'), away:emptySlot('Ganador SF-2'),  status:'pending' }, // M104 15:00 EDT → 19:00 UTC
  ]

  // ── Propagar ganadores ronda por ronda ────────────────────────────────────
  // R32 ya tiene los slots resueltos por standings/Anexo C. A partir de acá,
  // cada ronda completa la siguiente según los resultados reales de ESPN.
  const step1 = propagateRound(r32, r16, knockoutResults)
  const step2 = propagateRound(step1.next, qf, knockoutResults)
  const step3 = propagateRound(step2.next, sf, knockoutResults)
  const step4 = propagateRound(step3.next, final, knockoutResults)

  const r32Filled = step1.current
  const r16Filled = step2.current
  const qfFilled = step3.current
  const sfFilled = step4.current
  const finalFilled = step4.next

  // El 3er puesto lo juegan los PERDEDORES de semis, no los ganadores: hay que
  // resolverlo aparte, porque propagateRound solo empuja ganadores.
  for (const sfMatch of sfFilled) {
    if (!sfMatch.home.team || !sfMatch.away.team) continue
    const result = resolveMatchResult(sfMatch.home.team, sfMatch.away.team, knockoutResults)
    if (!result || result.kind !== 'done') continue
    const loser = result.winner.slug === sfMatch.home.team.slug ? sfMatch.away.team : sfMatch.home.team
    const thirdMatch = finalFilled.find(m => m.id === '3RD')
    if (!thirdMatch) continue
    if (sfMatch.id === 'SF-1') thirdMatch.home = teamSlot(loser, thirdMatch.home.label)
    if (sfMatch.id === 'SF-2') thirdMatch.away = teamSlot(loser, thirdMatch.away.label)
  }

  return [...r32Filled, ...r16Filled, ...qfFilled, ...sfFilled, ...finalFilled]
}

// ─── Helpers para el componente ───────────────────────────────────────────────

export const ROUND_LABELS: Record<BracketRound, string> = {
  R32: '16avos',
  R16: 'Octavos',
  QF:  'Cuartos',
  SF:  'Semis',
  F:   'Final',
  '3RD': '3er Puesto',
}

export const ROUND_DATES: Record<BracketRound, string> = {
  R32: '28 jun – 3 jul',
  R16: '4 – 7 jul',
  QF:  '9 – 11 jul',
  SF:  '14 – 15 jul',
  '3RD': '18 jul · Dallas',
  F:   '19 jul · MetLife Stadium',
}

export const BRACKET_ROUNDS: BracketRound[] = ['R32', 'R16', 'QF', 'SF', 'F']
