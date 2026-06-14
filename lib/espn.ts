import type { ESPNResponse, LiveResult, LiveResultsMap, Match } from '@/types'
import { BASE_MATCHES } from '@/lib/data'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// Todas las fechas de la fase de grupos
const GROUP_STAGE_DATES = [
  '20260611','20260612','20260613','20260614','20260616',
  '20260620','20260621','20260622','20260623','20260624',
  '20260625','20260626','20260627',
]

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z]/g, '')
}

const NAME_ALIASES: Record<string, string> = {
  unitedstates:'estadosunidos', usa:'estadosunidos',
  czechia:'repcheca', czechrepublic:'repcheca',
  ivorycoast:'costademarfil', cotedivoire:'costademarfil',
  bosniaandherzegovina:'bosniayherz',
  newzealand:'nuevazelanda',
  southkorea:'coreadelsur', korea:'coreadelsur',
  netherlands:'paisesbajos',
  saudiarabia:'arabiasaudi',
  drcongo:'rdcongo', congodr:'rdcongo', democraticrepublicofthecongo:'rdcongo',
  scotland:'escocia', england:'inglaterra', croatia:'croacia',
  algeria:'argelia', jordan:'jordania', sweden:'suecia',
  tunisia:'tunez', belgium:'belgica', egypt:'egipto',
  spain:'espana', capeverde:'caboverde', france:'francia',
  iraq:'irak', norway:'noruega', slovenia:'eslovenia',
  ghana:'ghana', panama:'panama', haiti:'haiti',
  morocco:'marruecos', turkey:'turquia',
  germany:'alemania', curacao:'curazao',
  switzerland:'suiza', canada:'canada',
  southafrica:'sudafrica', mexico:'mexico', brazil:'brasil',
}

function matchTeamName(espnName: string, ourName: string): boolean {
  const e = normalize(espnName)
  const o = normalize(ourName)
  if (e === o) return true
  const ea = NAME_ALIASES[e] ?? e
  const oa = NAME_ALIASES[o] ?? o
  if (ea === oa) return true
  return ea.slice(0, 6) === oa.slice(0, 6)
}

async function fetchDateResults(dateStr: string): Promise<ESPNResponse | null> {
  const url = `${ESPN_BASE}?dates=${dateStr}&limit=20`
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // ISR: cachear 60 segundos en Vercel
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    return res.json() as Promise<ESPNResponse>
  } catch {
    return null
  }
}

export async function fetchLiveResults(): Promise<LiveResultsMap> {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const relevantDates = GROUP_STAGE_DATES.filter(d => d <= todayStr)

  if (!relevantDates.length) return {}

  const results: LiveResultsMap = {}

  // Fetch en paralelo para mayor velocidad — Vercel maneja bien la concurrencia
  const responses = await Promise.allSettled(
    relevantDates.map(d => fetchDateResults(d))
  )

  for (const res of responses) {
    if (res.status !== 'fulfilled' || !res.value) continue
    const data = res.value

    for (const ev of data.events ?? []) {
      const comp = ev.competitions?.[0]
      if (!comp) continue
      const ht = comp.competitors?.find(c => c.homeAway === 'home')
      const at = comp.competitors?.find(c => c.homeAway === 'away')
      if (!ht || !at) continue

      const statusName = ev.status?.type?.name ?? ''
      const isLive = statusName === 'STATUS_IN_PROGRESS'
      const isDone = statusName === 'STATUS_FINAL'

      if ((!isLive && !isDone) || ht.score === undefined || at.score === undefined) continue

      // Encontrar el partido correspondiente en nuestros datos
      const match = BASE_MATCHES.find(m =>
        matchTeamName(ht.team?.displayName ?? '', m.home.name) &&
        matchTeamName(at.team?.displayName ?? '', m.away.name)
      )

      if (match) {
        const key = `${match.home.slug}_${match.away.slug}`
        results[key] = {
          homeScore: ht.score,
          awayScore: at.score,
          status: isDone ? 'done' : 'live',
          clock: ev.status?.displayClock ?? '',
        }
      }
    }
  }

  return results
}

// Merge resultados en vivo con los partidos base
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
