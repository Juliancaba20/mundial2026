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
  date: string
  dateSort: number
  group: string
  home: TeamRef
  away: TeamRef
  venue: string
  isArgentina?: boolean
  score?: string
  status: MatchStatus
  clock?: string
}

// ─── Bracket ─────────────────────────────────────────────────────────────────

export interface BracketSlot {
  label: string          // "1° Grupo A" o nombre real del equipo
  team: TeamRef | null   // null mientras no se conoce el clasificado
  score?: string
  winner?: boolean       // true = ganador de este partido
}

export interface BracketMatch {
  id: string             // "R32-1", "R16-1", "QF-1", "SF-1", "F", "3RD"
  round: BracketRound
  date: string
  home: BracketSlot
  away: BracketSlot
  status: MatchStatus
  // índices del siguiente partido en el bracket (para dibujar líneas)
  nextMatchId?: string
  nextPosition?: 'home' | 'away'
}

export type BracketRound =
  | 'R32'   // 16avos
  | 'R16'   // octavos
  | 'QF'    // cuartos
  | 'SF'    // semis
  | 'F'     // final
  | '3RD'   // tercer puesto

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
