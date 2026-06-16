// ─── Equipos ─────────────────────────────────────────────────────────────────

export interface TeamRef {
  flag: string     // emoji (se mantiene para compatibilidad)
  flagCode: string // ISO 3166-1 alpha-2 para flagcdn.com — ej: "ar", "gb-sct"
  name: string
  slug: string
}

export interface Team extends TeamRef {
  group: string
  isChampion?: boolean
  confederation: string
  description?: string
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

export interface Group {
  letter: string
  teams: TeamRef[]
}

// ─── Partidos ────────────────────────────────────────────────────────────────

export type MatchStatus = 'pending' | 'live' | 'done'

export interface Match {
  id: string
  date: string        // "11 jun" — label de display fallback
  dateSort: number    // 20260611 — para ordenar
  kickoff: string     // ISO 8601 UTC — "2026-06-11T20:00:00Z" — fuente de verdad
  group: string
  home: TeamRef
  away: TeamRef
  venue: string       // "Ciudad, País" — display corto
  stadium?: string    // nombre completo del estadio
  city: string        // ciudad sede
  isArgentina?: boolean
  score?: string
  status: MatchStatus
  clock?: string
}

// ─── Bracket ─────────────────────────────────────────────────────────────────

export interface BracketSlot {
  label: string
  team: TeamRef | null
  score?: string
  winner?: boolean
}

export interface BracketMatch {
  id: string
  round: BracketRound
  date: string
  home: BracketSlot
  away: BracketSlot
  status: MatchStatus
  nextMatchId?: string
  nextPosition?: 'home' | 'away'
}

export type BracketRound =
  | 'R32'
  | 'R16'
  | 'QF'
  | 'SF'
  | 'F'
  | '3RD'

// ─── Noticias ────────────────────────────────────────────────────────────────

export interface NewsArticle {
  slug: string
  tag: string
  headline: string
  excerpt: string
  body: string
  date: string
  emoji: string
  featured: boolean
  relatedTeamSlugs?: string[]
}

// ─── ESPN API ─────────────────────────────────────────────────────────────────

export interface ESPNCompetitor {
  homeAway: 'home' | 'away'
  score?: string
  team: { displayName: string; name: string }
}

export interface ESPNEvent {
  id: string
  name: string
  date: string
  status: {
    type: { name: string }
    displayClock: string
  }
  competitions: Array<{ competitors: ESPNCompetitor[] }>
}

export interface ESPNResponse {
  events: ESPNEvent[]
}

export interface LiveResult {
  homeScore: string
  awayScore: string
  status: MatchStatus
  clock: string
}

export type LiveResultsMap = Record<string, LiveResult>
