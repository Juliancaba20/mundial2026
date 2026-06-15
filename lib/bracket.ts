import type { Match, BracketMatch, BracketRound, BracketSlot, TeamRef } from '@/types'
import { calculateStandings } from './standings'

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

function getBestThirds(matches: Match[]): Array<{ group: string; team: TeamRef | null }> {
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

// ─── Cruces de 16avos según reglamento FIFA 2026 ─────────────────────────────
// Los 24 clasificados directos (1° y 2° de cada grupo) se cruzan así:
// 1A vs 2B | 1B vs 2A | 1C vs 2D | 1D vs 2C
// 1E vs 2F | 1F vs 2E | 1G vs 2H | 1H vs 2G
// 1I vs 2J | 1J vs 2I | 1K vs 2L | 1L vs 2K
// Los 8 mejores terceros se asignan a los slots 13-16
// (la tabla oficial de asignación de terceros se publica post-grupos)

export function buildBracket(matches: Match[]): BracketMatch[] {
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

  function third(rank: number): BracketSlot {
    const entry = bestThirds[rank - 1]
    if (!entry) return emptySlot(`Mejor 3° (${rank})`)
    return entry.team
      ? teamSlot(entry.team, `3° Grupo ${entry.group}`)
      : emptySlot(`Mejor 3° (${rank})`)
  }

  // ── 16avos (R32) — 16 partidos ────────────────────────────────────────────
  const r32: BracketMatch[] = [
    // Mitad izquierda del bracket (partidos 1-8)
    { id:'R32-1',  round:'R32', date:'28 jun', home:first('A'),  away:second('B'), status:'pending', nextMatchId:'R16-1', nextPosition:'home' },
    { id:'R32-2',  round:'R32', date:'28 jun', home:first('B'),  away:second('A'), status:'pending', nextMatchId:'R16-1', nextPosition:'away' },
    { id:'R32-3',  round:'R32', date:'29 jun', home:first('C'),  away:second('D'), status:'pending', nextMatchId:'R16-2', nextPosition:'home' },
    { id:'R32-4',  round:'R32', date:'29 jun', home:first('D'),  away:second('C'), status:'pending', nextMatchId:'R16-2', nextPosition:'away' },
    { id:'R32-5',  round:'R32', date:'30 jun', home:first('E'),  away:second('F'), status:'pending', nextMatchId:'R16-3', nextPosition:'home' },
    { id:'R32-6',  round:'R32', date:'30 jun', home:first('F'),  away:second('E'), status:'pending', nextMatchId:'R16-3', nextPosition:'away' },
    { id:'R32-7',  round:'R32', date:'1 jul',  home:first('G'),  away:second('H'), status:'pending', nextMatchId:'R16-4', nextPosition:'home' },
    { id:'R32-8',  round:'R32', date:'1 jul',  home:first('H'),  away:second('G'), status:'pending', nextMatchId:'R16-4', nextPosition:'away' },
    // Mitad derecha del bracket (partidos 9-16)
    { id:'R32-9',  round:'R32', date:'2 jul',  home:first('I'),  away:second('J'), status:'pending', nextMatchId:'R16-5', nextPosition:'home' },
    { id:'R32-10', round:'R32', date:'2 jul',  home:first('J'),  away:second('I'), status:'pending', nextMatchId:'R16-5', nextPosition:'away' },
    { id:'R32-11', round:'R32', date:'3 jul',  home:first('K'),  away:second('L'), status:'pending', nextMatchId:'R16-6', nextPosition:'home' },
    { id:'R32-12', round:'R32', date:'3 jul',  home:first('L'),  away:second('K'), status:'pending', nextMatchId:'R16-6', nextPosition:'away' },
    { id:'R32-13', round:'R32', date:'28 jun', home:third(1),    away:third(2),    status:'pending', nextMatchId:'R16-7', nextPosition:'home' },
    { id:'R32-14', round:'R32', date:'29 jun', home:third(3),    away:third(4),    status:'pending', nextMatchId:'R16-7', nextPosition:'away' },
    { id:'R32-15', round:'R32', date:'30 jun', home:third(5),    away:third(6),    status:'pending', nextMatchId:'R16-8', nextPosition:'home' },
    { id:'R32-16', round:'R32', date:'1 jul',  home:third(7),    away:third(8),    status:'pending', nextMatchId:'R16-8', nextPosition:'away' },
  ]

  // ── Octavos (R16) — 8 partidos ────────────────────────────────────────────
  const r16: BracketMatch[] = [
    { id:'R16-1', round:'R16', date:'4 jul',  home:emptySlot('G. R32-1'),  away:emptySlot('G. R32-2'),  status:'pending', nextMatchId:'QF-1', nextPosition:'home' },
    { id:'R16-2', round:'R16', date:'5 jul',  home:emptySlot('G. R32-3'),  away:emptySlot('G. R32-4'),  status:'pending', nextMatchId:'QF-1', nextPosition:'away' },
    { id:'R16-3', round:'R16', date:'6 jul',  home:emptySlot('G. R32-5'),  away:emptySlot('G. R32-6'),  status:'pending', nextMatchId:'QF-2', nextPosition:'home' },
    { id:'R16-4', round:'R16', date:'7 jul',  home:emptySlot('G. R32-7'),  away:emptySlot('G. R32-8'),  status:'pending', nextMatchId:'QF-2', nextPosition:'away' },
    { id:'R16-5', round:'R16', date:'4 jul',  home:emptySlot('G. R32-9'),  away:emptySlot('G. R32-10'), status:'pending', nextMatchId:'QF-3', nextPosition:'home' },
    { id:'R16-6', round:'R16', date:'5 jul',  home:emptySlot('G. R32-11'), away:emptySlot('G. R32-12'), status:'pending', nextMatchId:'QF-3', nextPosition:'away' },
    { id:'R16-7', round:'R16', date:'6 jul',  home:emptySlot('G. R32-13'), away:emptySlot('G. R32-14'), status:'pending', nextMatchId:'QF-4', nextPosition:'home' },
    { id:'R16-8', round:'R16', date:'7 jul',  home:emptySlot('G. R32-15'), away:emptySlot('G. R32-16'), status:'pending', nextMatchId:'QF-4', nextPosition:'away' },
  ]

  // ── Cuartos (QF) — 4 partidos ─────────────────────────────────────────────
  const qf: BracketMatch[] = [
    { id:'QF-1', round:'QF', date:'9 jul',  home:emptySlot('G. Oct. 1'), away:emptySlot('G. Oct. 2'), status:'pending', nextMatchId:'SF-1', nextPosition:'home' },
    { id:'QF-2', round:'QF', date:'10 jul', home:emptySlot('G. Oct. 3'), away:emptySlot('G. Oct. 4'), status:'pending', nextMatchId:'SF-1', nextPosition:'away' },
    { id:'QF-3', round:'QF', date:'11 jul', home:emptySlot('G. Oct. 5'), away:emptySlot('G. Oct. 6'), status:'pending', nextMatchId:'SF-2', nextPosition:'home' },
    { id:'QF-4', round:'QF', date:'11 jul', home:emptySlot('G. Oct. 7'), away:emptySlot('G. Oct. 8'), status:'pending', nextMatchId:'SF-2', nextPosition:'away' },
  ]

  // ── Semifinales (SF) — 2 partidos ─────────────────────────────────────────
  const sf: BracketMatch[] = [
    { id:'SF-1', round:'SF', date:'14 jul', home:emptySlot('G. Cto. 1'), away:emptySlot('G. Cto. 2'), status:'pending', nextMatchId:'F', nextPosition:'home' },
    { id:'SF-2', round:'SF', date:'15 jul', home:emptySlot('G. Cto. 3'), away:emptySlot('G. Cto. 4'), status:'pending', nextMatchId:'F', nextPosition:'away' },
  ]

  // ── Final + 3er puesto ────────────────────────────────────────────────────
  const final: BracketMatch[] = [
    { id:'3RD', round:'3RD', date:'18 jul', home:emptySlot('Perdedor SF-1'), away:emptySlot('Perdedor SF-2'), status:'pending' },
    { id:'F',   round:'F',   date:'19 jul', home:emptySlot('Ganador SF-1'), away:emptySlot('Ganador SF-2'),  status:'pending' },
  ]

  return [...r32, ...r16, ...qf, ...sf, ...final]
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
