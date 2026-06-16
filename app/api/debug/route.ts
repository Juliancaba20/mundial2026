// RUTA DE DIAGNÓSTICO — solo disponible en desarrollo o con ?key=debug
// Visitar: https://tu-sitio.vercel.app/api/debug
// Muestra exactamente qué recibe ESPN y cómo se procesa

import { NextResponse } from 'next/server'
import { BASE_MATCHES } from '@/lib/data'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

const ESPN_ALIASES: Record<string, string> = {
  southafrica:'sudafrica', southkorea:'coreadelsur',
  czechrepublic:'repcheca', czechia:'repcheca',
  bosniaandherzegovina:'bosniayherz', switzerland:'suiza',
  brazil:'brasil', morocco:'marruecos', scotland:'escocia',
  unitedstates:'estadosunidos', usa:'estadosunidos', turkey:'turquia',
  germany:'alemania', curacao:'curazao', ivorycoast:'costademarfil',
  netherlands:'paisesbajos', japan:'japon', sweden:'suecia',
  tunisia:'tunez', belgium:'belgica', newzealand:'nuevazelanda',
  spain:'espana', capeverde:'caboverde', saudiarabia:'arabiasaudi',
  france:'francia', iraq:'irak', norway:'noruega', algeria:'argelia',
  jordan:'jordania', drcongo:'rdcongo', slovenia:'eslovenia',
  england:'inglaterra', croatia:'croacia', egypt:'egipto',
}

function matchTeamName(espnName: string, ourName: string): boolean {
  const e = normalize(espnName)
  const o = normalize(ourName)
  if (e === o) return true
  const ea = ESPN_ALIASES[e] ?? e
  const oa = ESPN_ALIASES[o] ?? o
  if (ea === oa) return true
  return ea.slice(0, 6) === oa.slice(0, 6)
}

export async function GET() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  const dates = [
    '20260611','20260612','20260613','20260614','20260615','20260616',
    '20260617','20260618','20260619','20260620',
  ].filter(d => d <= todayStr)

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    today: todayStr,
    datesQueried: dates,
    results: [],
    summary: {},
  }

  const results: unknown[] = []
  let totalEvents = 0, withScore = 0, matched = 0, unmatched = 0
  const unmatchedList: string[] = []

  for (const dateStr of dates) {
    const url = `${ESPN_BASE}?dates=${dateStr}&limit=20`
    let dateReport: Record<string, unknown> = { date: dateStr, url, status: 'pending', events: [] }

    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
      dateReport.httpStatus = res.status
      if (!res.ok) {
        dateReport.status = 'http_error'
        results.push(dateReport)
        continue
      }
      const data = await res.json() as { events?: unknown[] }
      const events = data.events ?? []
      dateReport.eventCount = events.length
      dateReport.status = 'ok'
      totalEvents += events.length

      const eventReports: unknown[] = []
      for (const ev of events as any[]) {
        const comp = ev.competitions?.[0]
        const ht = comp?.competitors?.find((c: any) => c.homeAway === 'home')
        const at = comp?.competitors?.find((c: any) => c.homeAway === 'away')
        const htName = ht?.team?.displayName ?? '?'
        const atName = at?.team?.displayName ?? '?'
        const statusName = ev.status?.type?.name ?? ''
        const isLive = statusName === 'STATUS_IN_PROGRESS'
        const isDone = statusName === 'STATUS_FINAL'
        const hasScore = ht?.score !== undefined && at?.score !== undefined

        let matchResult = 'skipped_pending'
        let ourMatch = null

        if ((isLive || isDone) && hasScore) {
          withScore++
          const m = BASE_MATCHES.find(m =>
            matchTeamName(htName, m.home.name) && matchTeamName(atName, m.away.name)
          )
          if (m) {
            matched++
            matchResult = 'matched'
            ourMatch = `${m.home.name} vs ${m.away.name}`
          } else {
            unmatched++
            matchResult = 'NO_MATCH'
            unmatchedList.push(`${htName} vs ${atName}`)
          }
        } else if (!isLive && !isDone) {
          matchResult = 'skipped_pending'
        } else {
          matchResult = 'skipped_no_score'
        }

        eventReports.push({
          espn: `${htName} vs ${atName}`,
          espnNorm: `${normalize(htName)} vs ${normalize(atName)}`,
          score: hasScore ? `${ht?.score}-${at?.score}` : null,
          status: statusName,
          matchResult,
          ourMatch,
        })
      }
      dateReport.events = eventReports
    } catch (err) {
      dateReport.status = 'network_error'
      dateReport.error = String(err)
    }
    results.push(dateReport)
  }

  report.results = results
  report.summary = {
    totalEvents,
    withScore,
    matched,
    unmatched,
    unmatchedList,
    matchRate: totalEvents > 0 ? `${Math.round(matched / Math.max(withScore, 1) * 100)}%` : 'n/a',
  }

  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
