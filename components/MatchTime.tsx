'use client'

import { useEffect, useState } from 'react'
import type { MatchStatus } from '@/types'

interface Props {
  kickoff: string       // ISO 8601 UTC — "2026-06-11T20:00:00Z"
  status: MatchStatus
  clock?: string        // "67'" cuando está en vivo
  date: string          // fallback — "11 jun"
}

function pad(n: number) { return String(n).padStart(2, '0') }

function formatLocalTime(kickoff: string): { dayLabel: string; time: string } {
  const d = new Date(kickoff)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const dayLabel = d.toLocaleDateString('es', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const time = d.toLocaleTimeString('es', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  })

  return { dayLabel, time }
}

function getCountdown(kickoff: string): string | null {
  const diff = new Date(kickoff).getTime() - Date.now()
  if (diff <= 0) return null

  const totalMinutes = Math.floor(diff / 60000)
  const days    = Math.floor(totalMinutes / 1440)
  const hours   = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 1)  return `en ${days} días`
  if (days === 1) return `en 1 día`
  if (hours > 0) return `en ${hours}h ${pad(minutes)}min`
  if (totalMinutes > 0) return `en ${totalMinutes} min`
  return 'comienza ahora'
}

export function MatchTime({ kickoff, status, clock, date }: Props) {
  // Empieza con null para evitar mismatch SSR/cliente
  const [localTime, setLocalTime] = useState<{ dayLabel: string; time: string } | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    // Calcular hora local solo en el browser
    const local = formatLocalTime(kickoff)
    const initialCountdown = status === 'pending' ? getCountdown(kickoff) : null

    setTimeout(() => {
      setLocalTime(local)
      if (status === 'pending') {
        setCountdown(initialCountdown)
      }
    }, 0)

    if (status === 'pending') {
      const id = setInterval(() => setCountdown(getCountdown(kickoff)), 30_000)
      return () => clearInterval(id)
    }
  }, [kickoff, status])

  // ── Partido en vivo ────────────────────────────────────────────────────────
  if (status === 'live') {
    return (
      <div className="mt-live">
        <span className="mt-live-dot" />
        <span className="mt-live-text">EN VIVO</span>
        {clock && <span className="mt-live-clock">{clock}</span>}
      </div>
    )
  }

  // ── Partido finalizado ─────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="mt-done">
        <span className="mt-done-text">Finalizado</span>
        {localTime && <span className="mt-done-date">{localTime.dayLabel}</span>}
      </div>
    )
  }

  // ── Partido pendiente ──────────────────────────────────────────────────────
  // Mientras hidrata, muestra el fallback estático (no hay flash)
  if (!localTime) {
    return (
      <div className="mt-pending">
        <span className="mt-date">{date}</span>
      </div>
    )
  }

  const isImminent = countdown && countdown.startsWith('en') &&
    !countdown.includes('día') && !countdown.includes('h')

  return (
    <div className="mt-pending">
      <span className="mt-date">{localTime.dayLabel}</span>
      <span className="mt-sep">·</span>
      <span className="mt-time">{localTime.time} hs</span>
      {countdown && (
        <span className={`mt-countdown${isImminent ? ' mt-imminent' : ''}`}>
          {countdown}
        </span>
      )}
    </div>
  )
}
