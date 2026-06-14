// ─── Equipos ─────────────────────────────────────────────────────────────────

export interface TeamRef {
  flag: string   // emoji
  name: string   // nombre en español
  slug: string   // URL-safe: "argentina", "estados-unidos"
}

export interface Team extends TeamRef {
  group: string           // "J"
  isChampion?: boolean
  confederation: string   // "CONMEBOL", "UEFA", etc.
  description?: string    // para página de equipo
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

export interface Group {
  letter: string     // "A" … "L"
  teams: TeamRef[]
}

// ─── Partidos ────────────────────────────────────────────────────────────────

export type MatchStatus = 'pending' | 'live' | 'done'

export interface Match {
  id: string              // "A-MEX-ZAF-1"
  date: string            // "11 jun"
  dateSort: number        // 20260611
  group: string           // "A"
  home: TeamRef
  away: TeamRef
  venue: string
  isArgentina?: boolean
  // Se populan desde la API ESPN en runtime
  score?: string          // "2 – 0"
  status: MatchStatus
  clock?: string          // "45'" durante partidos en vivo
}

// ─── Noticias ────────────────────────────────────────────────────────────────

export interface NewsArticle {
  slug: string
  tag: string
  headline: string
  excerpt: string
  body: string            // Markdown o HTML — listo para CMS futuro
  date: string
  emoji: string
  featured: boolean
  relatedTeamSlugs?: string[]
}

// ─── ESPN API ─────────────────────────────────────────────────────────────────

export interface ESPNCompetitor {
  homeAway: 'home' | 'away'
  score?: string
  team: {
    displayName: string
    name: string
  }
}

export interface ESPNEvent {
  id: string
  name: string
  date: string
  status: {
    type: { name: string }
    displayClock: string
  }
  competitions: Array<{
    competitors: ESPNCompetitor[]
  }>
}

export interface ESPNResponse {
  events: ESPNEvent[]
}

// ─── Resultado procesado (ESPN → app) ────────────────────────────────────────

export interface LiveResult {
  homeScore: string
  awayScore: string
  status: MatchStatus
  clock: string
}

export type LiveResultsMap = Record<string, LiveResult>
// key: "home-slug_away-slug" ej: "mexico_sudafrica"
