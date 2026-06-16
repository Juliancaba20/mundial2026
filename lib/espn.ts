import type { ESPNResponse, LiveResult, LiveResultsMap, Match } from '@/types'
import { BASE_MATCHES } from '@/lib/data'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

const GROUP_STAGE_DATES = [
  '20260611','20260612','20260613','20260614','20260615','20260616',
  '20260617','20260618','20260619','20260620','20260621','20260622',
  '20260623','20260624','20260625','20260626','20260627','20260628',
  '20260629','20260630',
]

// ─── FIX PRINCIPAL ────────────────────────────────────────────────────────────
// Bug anterior: normalize() usaba replace(/[^a-z]/g, '') que ELIMINA los
// caracteres acentuados ('é','á','ó'...) en lugar de convertirlos a su base.
// Resultado: 'México' → 'mxico' en lugar de 'mexico', causando 10/24 fallos.
//
// Fix: usar unicode NFD (descomposición) para separar la letra base del acento,
// luego eliminar solo los caracteres de acento (categoría Mn), luego lowercase.
// Esto convierte 'México'→'mexico', 'Japón'→'japon', 'Túnez'→'tunez', etc.

function normalize(str: string): string {
  return str
    .normalize('NFD')                          // descomponer: 'é' → 'e' + acento
    .replace(/[\u0300-\u036f]/g, '')           // eliminar acentos combinados
    .toLowerCase()
    .replace(/[^a-z]/g, '')                    // solo letras a-z
}

// Alias completo ESPN (inglés) → slug nuestro (español normalizado)
// Cubre todos los casos donde el nombre ESPN difiere del nuestro después de normalizar
const ESPN_ALIASES: Record<string, string> = {
  // Traducciones directas
  southafrica:   'sudafrica',
  southkorea:    'coreadelsur',
  czechrepublic: 'repcheca',
  czechia:       'repcheca',
  bosniaandherzegovina: 'bosniayherz',
  switzerland:   'suiza',
  brazil:        'brasil',
  morocco:       'marruecos',
  scotland:      'escocia',
  unitedstates:  'estadosunidos',
  usa:           'estadosunidos',
  turkey:        'turquia',
  germany:       'alemania',
  curacao:       'curazao',
  ivorycoast:    'costademarfil',
  cotedivoire:   'costademarfil',
  netherlands:   'paisesbajos',
  japan:         'japon',
  sweden:        'suecia',
  tunisia:       'tunez',
  belgium:       'belgica',
  newzealand:    'nuevazelanda',
  spain:         'espana',
  capeverde:     'caboverde',
  saudiarabia:   'arabiasaudi',
  france:        'francia',
  iraq:          'irak',
  norway:        'noruega',
  algeria:       'argelia',
  jordan:        'jordania',
  drcongo:       'rdcongo',
  congodr:       'rdcongo',
  democraticrepublicofthecongo: 'rdcongo',
  slovenia:      'eslovenia',
  england:       'inglaterra',
  croatia:       'croacia',
  egypt:         'egipto',
  // Coinciden después de normalizar (no necesitan alias, pero los incluimos por claridad)
  mexico:        'mexico',
  canada:        'canada',
  haiti:         'haiti',
  iran:          'iran',
  ghana:         'ghana',
  panama:        'panama',
}

function matchTeamName(espnName: string, ourName: string): boolean {
  const e = normalize(espnName)
  const o = normalize(ourName)

  // 1. Coincidencia exacta después de normalizar
  if (e === o) return true

  // 2. Buscar alias del nombre ESPN
  const ea = ESPN_ALIASES[e] ?? e
  // 3. Normalizar nuestro nombre (ya está normalizado, pero aplicamos aliases por si acaso)
  const oa = ESPN_ALIASES[o] ?? o

  if (ea === oa) return true

  // 4. Fallback: primeros 6 caracteres (solo para casos no cubiertos)
  return ea.slice(0, 6) === oa.slice(0, 6)
}

async function fetchDateResults(dateStr: string): Promise<{ data: ESPNResponse | null; dateStr: string }> {
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
    const data = await res.json() as ESPNResponse
    return { data, dateStr }
  } catch (err) {
    console.warn(`[ESPN] Error de red para fecha ${dateStr}:`, err)
    return { data: null, dateStr }
  }
}

export async function fetchLiveResults(): Promise<LiveResultsMap> {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const relevantDates = GROUP_STAGE_DATES.filter(d => d <= todayStr)

  if (!relevantDates.length) {
    console.log('[ESPN] Torneo aún no comenzó')
    return {}
  }

  console.log(`[ESPN] Consultando ${relevantDates.length} fechas: ${relevantDates.join(', ')}`)

  const responses = await Promise.allSettled(
    relevantDates.map(d => fetchDateResults(d))
  )

  const results: LiveResultsMap = {}

  let totalEvents     = 0
  let eventsWithScore = 0
  let matched         = 0
  let unmatched       = 0
  const unmatchedNames: string[] = []

  for (const res of responses) {
    if (res.status !== 'fulfilled' || !res.value.data) continue
    const { data, dateStr } = res.value
    const events = data.events ?? []

    console.log(`[ESPN] Fecha ${dateStr}: ${events.length} eventos recibidos`)
    totalEvents += events.length

    for (const ev of events) {
      const comp = ev.competitions?.[0]
      if (!comp) continue
      const ht = comp.competitors?.find(c => c.homeAway === 'home')
      const at = comp.competitors?.find(c => c.homeAway === 'away')
      if (!ht || !at) continue

      const statusName = ev.status?.type?.name ?? ''
      const isLive = statusName === 'STATUS_IN_PROGRESS'
      const isDone = statusName === 'STATUS_FINAL'
      const htName = ht.team?.displayName ?? ht.team?.name ?? '?'
      const atName = at.team?.displayName ?? at.team?.name ?? '?'

      if (!isLive && !isDone) {
        console.log(`[ESPN]   SKIP (pendiente): ${htName} vs ${atName} [${statusName}]`)
        continue
      }
      if (ht.score === undefined || at.score === undefined) {
        console.log(`[ESPN]   SKIP (sin score): ${htName} vs ${atName}`)
        continue
      }

      eventsWithScore++
      console.log(`[ESPN]   Score: ${htName} ${ht.score}-${at.score} ${atName} [${statusName}]`)

      const match = BASE_MATCHES.find(m =>
        matchTeamName(htName, m.home.name) &&
        matchTeamName(atName, m.away.name)
      )

      if (match) {
        matched++
        const key = `${match.home.slug}_${match.away.slug}`
        results[key] = {
          homeScore: ht.score,
          awayScore: at.score,
          status: isDone ? 'done' : 'live',
          clock: ev.status?.displayClock ?? '',
        }
        console.log(`[ESPN]   ✓ Matched → ${match.home.name} vs ${match.away.name} [key: ${key}]`)
      } else {
        unmatched++
        unmatchedNames.push(`"${htName}" vs "${atName}"`)
        console.warn(`[ESPN]   ✗ NO MATCH: "${htName}" (${normalize(htName)}) vs "${atName}" (${normalize(atName)})`)
      }
    }
  }

  // Resumen final
  console.log([
    `[ESPN] RESUMEN:`,
    `  fechas consultadas  : ${relevantDates.length}`,
    `  eventos totales     : ${totalEvents}`,
    `  con score           : ${eventsWithScore}`,
    `  matcheados          : ${matched}`,
    `  sin match           : ${unmatched}`,
    unmatched > 0
      ? `  nombres sin match   : ${unmatchedNames.join(' | ')}`
      : `  todos los eventos matchearon correctamente`,
  ].join('\n'))

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
      clock:  live.clock,
    }
  })
}
