import type { ESPNResponse, LiveResult, LiveResultsMap, Match } from '@/types'
import { BASE_MATCHES } from '@/lib/data'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// Consultamos TODAS las fechas del torneo en rango amplio.
// ESPN usa la fecha UTC del estadio (hora local de la sede), que puede diferir
// de la fecha que nosotros mostramos al usuario. No filtramos por fecha aquí —
// dejamos que el matching por nombre de equipo identifique cada partido.
const GROUP_STAGE_DATES = [
  '20260611','20260612','20260613','20260614','20260615','20260616',
  '20260617','20260618','20260619','20260620','20260621','20260622',
  '20260623','20260624','20260625','20260626','20260627','20260628',
  '20260629','20260630',
]

// ─── normalize ───────────────────────────────────────────────────────────────
// Usa NFD para separar la letra base del acento, luego elimina solo los acentos.
// Convierte correctamente: 'México'→'mexico', 'Türkiye'→'turkiye', 'Curaçao'→'curacao'

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // eliminar diacríticos combinados
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

// ─── ESPN status que indican partido finalizado ───────────────────────────────
// Encontrado en producción via /api/debug:
//   STATUS_FINAL     — el que esperábamos
//   STATUS_FULL_TIME — el que ESPN realmente envía (bug anterior: no estaba)

const DONE_STATUSES = new Set([
  'STATUS_FINAL',
  'STATUS_FULL_TIME',
  'STATUS_FULL_PEN',      // finalizado en penales
  'STATUS_HALFTIME',      // descanso (score parcial disponible)
  'STATUS_OVERTIME',      // prórroga
  'STATUS_SECOND_HALF',   // segundo tiempo
  'STATUS_FIRST_HALF',    // primer tiempo
])

const LIVE_STATUSES = new Set([
  'STATUS_IN_PROGRESS',
  'STATUS_FIRST_HALF',
  'STATUS_SECOND_HALF',
  'STATUS_HALFTIME',
  'STATUS_OVERTIME',
])

// ─── Alias map ESPN → slug nuestro ───────────────────────────────────────────
// Generado a partir del JSON real de la API (ver /api/debug).
// Cubre: traducciones, variantes de escritura, grafías locales.

const ESPN_ALIASES: Record<string, string> = {
  // Traducciones directas
  southafrica:   'sudafrica',
  southkorea:    'coreadelsur',
  czechrepublic: 'repcheca',
  czechia:       'repcheca',

  // Bosnia — ESPN usa "Bosnia-Herzegovina" (sin "and") → normaliza a bosniaherzegovina
  bosniaherzegovina:    'bosniayherz',
  bosniaandherzegovina: 'bosniayherz',

  switzerland:  'suiza',
  brazil:       'brasil',
  morocco:      'marruecos',
  scotland:     'escocia',
  unitedstates: 'estadosunidos',
  usa:          'estadosunidos',

  // Turquía — ESPN usa "Türkiye" (grafía oficial turca) → normaliza a 'turkiye'
  turkey:       'turquia',
  turkiye:      'turquia',

  germany:      'alemania',
  curacao:      'curazao',
  ivorycoast:   'costademarfil',
  cotedivoire:  'costademarfil',
  netherlands:  'paisesbajos',
  japan:        'japon',
  sweden:       'suecia',
  tunisia:      'tunez',
  belgium:      'belgica',
  newzealand:   'nuevazelanda',
  spain:        'espana',
  capeverde:    'caboverde',
  saudiarabia:  'arabiasaudi',
  france:       'francia',
  iraq:         'irak',
  norway:       'noruega',
  algeria:      'argelia',
  jordan:       'jordania',
  drcongo:      'rdcongo',
  congodr:      'rdcongo',
  democraticrepublicofthecongo: 'rdcongo',
  england:      'inglaterra',
  croatia:      'croacia',
  egypt:        'egipto',
}

function matchTeamName(espnName: string, ourName: string): boolean {
  const e = normalize(espnName)
  const o = normalize(ourName)

  // 1. Coincidencia exacta tras normalizar
  if (e === o) return true

  // 2. Buscar alias
  const ea = ESPN_ALIASES[e] ?? e
  const oa = ESPN_ALIASES[o] ?? o
  if (ea === oa) return true

  // 3. Fallback primeros 6 chars (solo casos no cubiertos por alias)
  return ea.slice(0, 6) === oa.slice(0, 6)
}

async function fetchDateResults(
  dateStr: string
): Promise<{ data: ESPNResponse | null; dateStr: string }> {
  const url = `${ESPN_BASE}?dates=${dateStr}&limit=20`
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      console.warn(`[ESPN] HTTP ${res.status} para fecha ${dateStr}`)
      return { data: null, dateStr }
    }
    return { data: await res.json() as ESPNResponse, dateStr }
  } catch (err) {
    console.warn(`[ESPN] Error de red para fecha ${dateStr}:`, err)
    return { data: null, dateStr }
  }
}

export async function fetchLiveResults(): Promise<LiveResultsMap> {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  // +1 día extra para cubrir partidos nocturnos que ESPN pone en el día siguiente UTC
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '')

  const relevantDates = GROUP_STAGE_DATES.filter(d => d <= tomorrowStr)

  if (!relevantDates.length) {
    console.log('[ESPN] Torneo aún no comenzó')
    return {}
  }

  console.log(`[ESPN] Consultando ${relevantDates.length} fechas`)

  const responses = await Promise.allSettled(
    relevantDates.map(d => fetchDateResults(d))
  )

  const results: LiveResultsMap = {}
  let totalEvents = 0, withScore = 0, matched = 0, unmatched = 0
  const unmatchedNames: string[] = []

  for (const res of responses) {
    if (res.status !== 'fulfilled' || !res.value.data) continue
    const { data, dateStr } = res.value
    const events = data.events ?? []
    totalEvents += events.length

    for (const ev of events) {
      const comp = ev.competitions?.[0]
      if (!comp) continue
      const ht = comp.competitors?.find(c => c.homeAway === 'home')
      const at = comp.competitors?.find(c => c.homeAway === 'away')
      if (!ht || !at) continue

      const statusName = ev.status?.type?.name ?? ''
      const isLive = LIVE_STATUSES.has(statusName) &&
                     statusName !== 'STATUS_HALFTIME' // halftime = pausa, no "en vivo activo"
      const isDone = DONE_STATUSES.has(statusName) &&
                     !LIVE_STATUSES.has(statusName)  // no doble contar

      // STATUS_FULL_TIME = finalizado (el status real que devuelve ESPN)
      const actuallyDone = statusName === 'STATUS_FULL_TIME' ||
                           statusName === 'STATUS_FINAL' ||
                           statusName === 'STATUS_FULL_PEN'
      const actuallyLive = statusName === 'STATUS_IN_PROGRESS' ||
                           statusName === 'STATUS_FIRST_HALF' ||
                           statusName === 'STATUS_SECOND_HALF' ||
                           statusName === 'STATUS_OVERTIME'

      if (!actuallyDone && !actuallyLive) continue
      if (ht.score === undefined || at.score === undefined) continue

      withScore++
      const htName = ht.team?.displayName ?? ht.team?.name ?? ''
      const atName = at.team?.displayName ?? at.team?.name ?? ''

      // Buscar coincidencia directa (home=home, away=away)
      let match = BASE_MATCHES.find(m =>
        matchTeamName(htName, m.home.name) &&
        matchTeamName(atName, m.away.name)
      )
      let reversed = false

      // Fallback: ESPN puede invertir localía respecto a nuestros datos
      // (ej: ESPN reporta "Qatar vs Switzerland" cuando nuestro dato es
      // "Suiza vs Qatar"). El partido es el mismo, solo cambia quién es local.
      if (!match) {
        match = BASE_MATCHES.find(m =>
          matchTeamName(htName, m.away.name) &&
          matchTeamName(atName, m.home.name)
        )
        reversed = true
      }

      if (match) {
        matched++
        const key = `${match.home.slug}_${match.away.slug}`
        // No sobreescribir un resultado final con uno de halftime
        if (results[key]?.status === 'done' && !actuallyDone) continue
        results[key] = {
          // Si está invertido, los scores también hay que invertirlos
          // para que coincidan con home/away de nuestros datos
          homeScore: reversed ? at.score : ht.score,
          awayScore: reversed ? ht.score : at.score,
          status: actuallyDone ? 'done' : 'live',
          clock: ev.status?.displayClock ?? '',
        }
        console.log(`[ESPN] ✓ ${htName} ${ht.score}-${at.score} ${atName} [${statusName}]${reversed ? ' (localía invertida)' : ''}`)
      } else {
        unmatched++
        unmatchedNames.push(`"${htName}" vs "${atName}" [${normalize(htName)} / ${normalize(atName)}]`)
        console.warn(`[ESPN] ✗ NO MATCH: "${htName}" vs "${atName}"`)
      }
    }
  }

  console.log(
    `[ESPN] RESUMEN: ${totalEvents} eventos, ${withScore} con score, ` +
    `${matched} matcheados, ${unmatched} sin match` +
    (unmatchedNames.length ? ` → ${unmatchedNames.join(' | ')}` : '')
  )

  return results
}

export function applyResults(matches: Match[], results: LiveResultsMap): Match[] {
  return matches.map(m => {
    const key = `${m.home.slug}_${m.away.slug}`
    const live = results[key]
    if (!live) return m
    return {
      ...m,
      score: `${live.homeScore} – ${live.awayScore}`,
      status: live.status,
      clock: live.clock,
    }
  })
}
