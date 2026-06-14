'use client'

import { useEffect, useState } from 'react'

const FINAL_DATE = new Date('2026-07-19T18:00:00-04:00')

interface TimeLeft { d: string; h: string; m: string; s: string }

function calc(): TimeLeft {
  const diff = FINAL_DATE.getTime() - Date.now()
  if (diff <= 0) return { d: '00', h: '00', m: '00', s: '00' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

export function Countdown() {
  const [t, setT] = useState<TimeLeft>({ d: '--', h: '--', m: '--', s: '--' })

  useEffect(() => {
    setT(calc())
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  const ended = t.d === '00' && t.h === '00' && t.m === '00' && t.s === '00'

  if (ended) {
    return (
      <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--green)', letterSpacing: '.04em' }}>
        ¡EL MUNDIAL HA TERMINADO!
      </div>
    )
  }

  return (
    <div className="hero-countdown">
      <div className="cd-unit"><span className="cd-num">{t.d}</span><span className="cd-label">días</span></div>
      <span className="cd-sep">:</span>
      <div className="cd-unit"><span className="cd-num">{t.h}</span><span className="cd-label">horas</span></div>
      <span className="cd-sep">:</span>
      <div className="cd-unit"><span className="cd-num">{t.m}</span><span className="cd-label">minutos</span></div>
      <span className="cd-sep">:</span>
      <div className="cd-unit"><span className="cd-num">{t.s}</span><span className="cd-label">segundos</span></div>
    </div>
  )
}
