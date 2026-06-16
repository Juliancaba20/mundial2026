// RUTA DE DIAGNÓSTICO — visitar /api/debug para ver el reporte completo
// de qué devuelve ESPN y cómo se procesa cada evento.

import { NextResponse } from 'next/server'
import { BASE_MATCHES } from '@/lib/data'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

const ESPN_ALIASES: Record<string, string> = {
  southafrica:'sudafrica', southkorea:'coreadelsur',
  czechrepublic:'repcheca', czechia:'repcheca',
  bosniaherzegovina:'bosniayherz', bosniaandherzegovina:'bosniayherz',
  switzerland:'suiza', brazil:'brasil', morocco:'marruecos', scotland:'escocia',
  unitedstates:'estadosunidos', usa:'estadosunidos',
  turkey:'turquia', turkiye:'turquia',
  germany:'alemania', curacao:'curazao',
  ivorycoast:'costademarfil', cotedivoire:'costademarfil',
  netherlands:'paisesbajos', japan:'japon', sweden:'suecia',
  tunisia:'tunez', belgium:'belgica', newzealand:'nuevazelanda',
  spain:'espana', capeverde:'caboverde', saudiarabia:'arabiasaudi',
  france:'francia', iraq:'irak', norway:'noruega', algeria:'argelia',
  jordan:'jordania', drcongo:'rdcongo', congodr:'rdcongo',
  slovenia:'eslovenia', england:'inglaterra', croatia:'croacia', egypt:'egipto',
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

// Mismos status reales que usa lib/espn.ts (confirmados en producción)
function classify(statusName: string): 'done' | 'live' | 'pending' {
  if (statusName === 'STATUS_FULL_TIME' || statusName === 'STATUS_FINAL' || statusName === 'STATUS_FULL_PEN') return 'done'
  if (statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_FIRST_HALF' || statusName === 'STATUS_SECOND_HALF' || statusName === 'STATUS_OVERTIME') return 'live'
  return 'pending'
}

export async function GET() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '')

  const allDates = [
    '20260611','20260612','20260613','20260614','20260615','20260616',
    '20260617','20260618','20260619','20260620','20260621','20260622',
    '20260623','20260624','20260625','20260626','20260627','20260628',
    '20260629','20260630',
  ]
  const dates = allDates.filter(d => d <= tomorrowStr)

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
  const statusesSeen = new Set<string>()

  for (const dateStr of dates) {
    const url = `${ESPN_BASE}?dates=${dateStr}&limit=20`
    const dateReport: Record<string, unknown> = { date: dateStr, url, status: 'pending', events: [] }

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
        statusesSeen.add(statusName)

        const classification = classify(statusName)
        const hasScore = ht?.score !== undefined && at?.score !== undefined

        let matchResult = 'skipped_pending'
        let ourMatch = null

        if (classification !== 'pending' && hasScore) {
          withScore++
          let m = BASE_MATCHES.find(m =>
            matchTeamName(htName, m.home.name) && matchTeamName(atName, m.away.name)
          )
          let reversed = false
          if (!m) {
            m = BASE_MATCHES.find(m =>
              matchTeamName(htName, m.away.name) && matchTeamName(atName, m.home.name)
            )
            reversed = true
          }
          if (m) {
            matched++
            matchResult = reversed ? 'matched_reversed' : 'matched'
            ourMatch = `${m.home.name} vs ${m.away.name}`
          } else {
            unmatched++
            matchResult = 'NO_MATCH'
            unmatchedList.push(`${htName} vs ${atName}`)
          }
        } else if (classification === 'pending') {
          matchResult = 'skipped_pending'
        } else {
          matchResult = 'skipped_no_score'
        }

        eventReports.push({
          espn: `${htName} vs ${atName}`,
          espnNorm: `${normalize(htName)} vs ${normalize(atName)}`,
          score: hasScore ? `${ht?.score}-${at?.score}` : null,
          status: statusName,
          classification,
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
    statusesSeenInESPN: [...statusesSeen],
    matchRate: withScore > 0 ? `${Math.round(matched / withScore * 100)}%` : 'n/a',
  }

  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
