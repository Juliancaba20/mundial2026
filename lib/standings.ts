import type { Match, TeamRef } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TeamStanding {
  team: TeamRef
  pj: number   // partidos jugados
  g:  number   // ganados
  e:  number   // empatados
  p:  number   // perdidos
  gf: number   // goles a favor
  gc: number   // goles en contra
  dg: number   // diferencia de goles
  pts: number  // puntos
  qualified: boolean  // clasifica a 16avos (top 2 del grupo)
}

// ─── Parser de score ─────────────────────────────────────────────────────────
// "2 – 1" → { home: 2, away: 1 }  |  null si no hay score todavía

function parseScore(score: string | undefined): { home: number; away: number } | null {
  if (!score) return null
  const parts = score.split('–').map(s => parseInt(s.trim(), 10))
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return { home: parts[0], away: parts[1] }
}

// ─── Acumulador base para un equipo ──────────────────────────────────────────

function emptyRow(team: TeamRef): TeamStanding {
  return { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0, qualified: false }
}

// ─── Criterios FIFA de desempate ─────────────────────────────────────────────
// Fuente: FIFA Regulations 2026, Art. 32
// 1. Puntos
// 2. Diferencia de goles
// 3. Goles a favor
// 4. (entre empatados) Puntos en enfrentamiento directo
// 5. (entre empatados) DG en enfrentamiento directo
// 6. (entre empatados) GF en enfrentamiento directo
// 7. Fair play (tarjetas) — no disponible en ESPN, se omite
// 8. Sorteo FIFA — no implementable

function compareStandings(
  a: TeamStanding,
  b: TeamStanding,
  allMatches: Match[],
): number {
  // 1. Puntos
  if (b.pts !== a.pts) return b.pts - a.pts
  // 2. Diferencia de goles global
  if (b.dg !== a.dg) return b.dg - a.dg
  // 3. Goles a favor global
  if (b.gf !== a.gf) return b.gf - a.gf

  // 4-6. Enfrentamiento directo entre estos dos equipos
  const h2h = allMatches.find(
    m =>
      m.status === 'done' &&
      ((m.home.slug === a.team.slug && m.away.slug === b.team.slug) ||
       (m.home.slug === b.team.slug && m.away.slug === a.team.slug))
  )
  if (h2h) {
    const sc = parseScore(h2h.score)
    if (sc) {
      const aIsHome = h2h.home.slug === a.team.slug
      const aGoals = aIsHome ? sc.home : sc.away
      const bGoals = aIsHome ? sc.away : sc.home

      // 4. Puntos H2H
      const aPtsH2H = aGoals > bGoals ? 3 : aGoals === bGoals ? 1 : 0
      const bPtsH2H = bGoals > aGoals ? 3 : aGoals === bGoals ? 1 : 0
      if (bPtsH2H !== aPtsH2H) return bPtsH2H - aPtsH2H

      // 5. DG H2H
      const aDgH2H = aGoals - bGoals
      const bDgH2H = bGoals - aGoals
      if (bDgH2H !== aDgH2H) return bDgH2H - aDgH2H

      // 6. GF H2H
      if (bGoals !== aGoals) return bGoals - aGoals
    }
  }

  // Empate total → mantener orden alfabético estable
  return a.team.name.localeCompare(b.team.name, 'es')
}

// ─── Función principal ────────────────────────────────────────────────────────

export function calculateStandings(
  groupLetter: string,
  matches: Match[],
): TeamStanding[] {
  const groupMatches = matches.filter(m => m.group === groupLetter)

  // Inicializar tabla con todos los equipos del grupo
  const table = new Map<string, TeamStanding>()

  for (const m of groupMatches) {
    if (!table.has(m.home.slug)) table.set(m.home.slug, emptyRow(m.home))
    if (!table.has(m.away.slug)) table.set(m.away.slug, emptyRow(m.away))

    if (m.status !== 'done') continue
    const sc = parseScore(m.score)
    if (!sc) continue

    const home = table.get(m.home.slug)!
    const away = table.get(m.away.slug)!

    // Partido jugado
    home.pj++; away.pj++

    // Goles
    home.gf += sc.home; home.gc += sc.away
    away.gf += sc.away; away.gc += sc.home

    // Resultado
    if (sc.home > sc.away) {
      home.g++; home.pts += 3
      away.p++
    } else if (sc.home < sc.away) {
      away.g++; away.pts += 3
      home.p++
    } else {
      home.e++; home.pts++
      away.e++; away.pts++
    }
  }

  // Calcular DG
  for (const row of table.values()) {
    row.dg = row.gf - row.gc
  }

  // Ordenar con criterios FIFA
  const sorted = [...table.values()].sort((a, b) =>
    compareStandings(a, b, groupMatches)
  )

  // Marcar los 2 primeros como clasificados
  sorted.forEach((row, i) => { row.qualified = i < 2 })

  return sorted
}

// ─── Helpers para mostrar valores con signo ───────────────────────────────────

export function formatDG(dg: number): string {
  if (dg > 0) return `+${dg}`
  return String(dg)
}
