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
  kickoff?: string   // ISO 8601 UTC — fuente de verdad para hora local en la card
  clock?: string     // "63'" cuando está en vivo
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
//
// El contenido editorial vive en `content/noticias/<slug>/index.md` como
// Markdown + frontmatter. `lib/noticias.ts` lo lee en build time y produce
// instancias de `Noticia`. Ver `NOTICIAS.md` en la raíz del proyecto.
//
// `NewsArticle` se conserva solo para referencia histórica/compatibilidad.
// El sistema actual usa exclusivamente `Noticia`.

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

// Modelo de noticia derivado de un archivo Markdown con frontmatter.
export interface Noticia {
  slug: string            // deriva del nombre de la carpeta — identidad permanente
  title: string           // frontmatter: title
  category: string        // frontmatter: category  (ej: "Análisis", "Sede")
  date: Date              // frontmatter: date (YYYY-MM-DD → medianoche UTC)
  excerpt: string         // frontmatter: excerpt — bajada para cards y meta
  body: string            // cuerpo Markdown crudo — se renderiza con react-markdown
  image?: string          // frontmatter: image — URL desde raíz: /noticias/<slug>/cover.webp
  imageAlt?: string       // frontmatter: imageAlt — descripción accesible
  emoji?: string          // frontmatter: emoji — fallback visual si no hay imagen
  featured: boolean       // frontmatter: featured — true destaca la card en grids
  relatedTeamSlugs?: string[] // frontmatter: relatedTeamSlugs — slugs de TEAMS para chips
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

// ─── Resultados de eliminatorias (por equipo, no por par fijo) ───────────────
// En knockout el rival de cada equipo no se conoce de antemano (depende del
// bracket calculado en runtime), así que no podemos indexar por "home_away"
// como en grupos. Indexamos por slug de equipo: cada equipo apunta a su
// partido de eliminatorias más reciente conocido por ESPN.

export interface KnockoutTeamResult {
  opponentSlug: string | null  // null si el rival no se reconoció como equipo propio
  opponentName: string         // nombre tal como lo reportó ESPN, para debug
  ownScore: string
  opponentScore: string
  status: MatchStatus
  clock: string
}

export type KnockoutResultsMap = Record<string, KnockoutTeamResult>
