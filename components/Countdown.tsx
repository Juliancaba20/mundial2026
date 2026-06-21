'use client'

import { useEffect, useState } from 'react'

// La final del Mundial 2026 es el 19 de julio en Nueva Jersey
const FINAL_DATE = new Date('2026-07-19T18:00:00-04:00')
// Inicio del Mundial (partido inaugural)
const START_DATE = new Date('2026-06-11T19:00:00Z')

interface TimeLeft { d: string; h: string; m: string; s: string }

function calc(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { d: '00', h: '00', m: '00', s: '00' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

function getPhase(): 'before' | 'during' | 'after' {
  const now = Date.now()
  if (now < START_DATE.getTime()) return 'before'
  if (now < FINAL_DATE.getTime()) return 'during'
  return 'after'
}

export function Countdown() {
  const [t, setT] = useState<TimeLeft>({ d: '--', h: '--', m: '--', s: '--' })
  const [phase, setPhase] = useState<'before' | 'during' | 'after'>('before')

  useEffect(() => {
    const update = () => {
      const p = getPhase()
      setPhase(p)
      if (p === 'before') setT(calc(START_DATE))
      else if (p === 'during') setT(calc(FINAL_DATE))
      else setT({ d: '00', h: '00', m: '00', s: '00' })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (phase === 'after') {
    return (
      <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--green)', letterSpacing: '.04em' }}>
        ¡EL MUNDIAL HA TERMINADO!
      </div>
    )
  }

  const label = phase === 'before'
    ? 'para el partido inaugural'
    : 'para la Final · MetLife Stadium, Nueva Jersey'

  return (
    <div>
      <p className="cd-event-label">{label}</p>
      <div className="hero-countdown">
        <div className="cd-unit"><span className="cd-num">{t.d}</span><span className="cd-label">días</span></div>
        <span className="cd-sep">:</span>
        <div className="cd-unit"><span className="cd-num">{t.h}</span><span className="cd-label">horas</span></div>
        <span className="cd-sep">:</span>
        <div className="cd-unit"><span className="cd-num">{t.m}</span><span className="cd-label">minutos</span></div>
        <span className="cd-sep">:</span>
        <div className="cd-unit"><span className="cd-num">{t.s}</span><span className="cd-label">segundos</span></div>
      </div>
    </div>
  )
}
