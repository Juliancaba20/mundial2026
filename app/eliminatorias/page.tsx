import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eliminatorias',
  description: 'Cuadro de las fases eliminatorias del Mundial 2026: 16avos, octavos, cuartos, semifinales y final.',
}

const PHASES = [
  {
    name: 'Ronda de 32 — 16avos de final',
    date: '28 jun – 3 jul',
    final: false,
    slots: [
      ['1° Grupo A','2° Grupo B'],['1° Grupo B','2° Grupo A'],
      ['1° Grupo C','2° Grupo D'],['1° Grupo D','2° Grupo C'],
      ['1° Grupo E','2° Grupo F'],['1° Grupo F','2° Grupo E'],
      ['1° Grupo G','2° Grupo H'],['1° Grupo H','2° Grupo G'],
      ['1° Grupo I','2° Grupo J'],['1° Grupo J','2° Grupo I'],
      ['1° Grupo K','2° Grupo L'],['1° Grupo L','2° Grupo K'],
      ['Mejor 3° (1)','Mejor 3° (2)'],['Mejor 3° (3)','Mejor 3° (4)'],
      ['Mejor 3° (5)','Mejor 3° (6)'],['Mejor 3° (7)','Mejor 3° (8)'],
    ],
  },
  {
    name: 'Octavos de final',
    date: '4 – 7 jul',
    final: false,
    slots: [
      ['G. 16avos 1','G. 16avos 2'],['G. 16avos 3','G. 16avos 4'],
      ['G. 16avos 5','G. 16avos 6'],['G. 16avos 7','G. 16avos 8'],
      ['G. 16avos 9','G. 16avos 10'],['G. 16avos 11','G. 16avos 12'],
      ['G. 16avos 13','G. 16avos 14'],['G. 16avos 15','G. 16avos 16'],
    ],
  },
  {
    name: 'Cuartos de final',
    date: '9 – 11 jul',
    final: false,
    slots: [
      ['G. Octavo 1','G. Octavo 2'],['G. Octavo 3','G. Octavo 4'],
      ['G. Octavo 5','G. Octavo 6'],['G. Octavo 7','G. Octavo 8'],
    ],
  },
  {
    name: 'Semifinales',
    date: '14 – 15 jul',
    final: false,
    slots: [
      ['G. Cuarto 1','G. Cuarto 2'],['G. Cuarto 3','G. Cuarto 4'],
    ],
  },
  {
    name: 'Gran Final ⭐',
    date: '19 de julio · MetLife Stadium, Nueva York/NJ',
    final: true,
    slots: [['Semifinalista 1','Semifinalista 2']],
  },
]

export default function EliminatoriasPage() {
  return (
    <div className="content-area">
      <div className="page-header">
        <div className="page-title">ELIMINATORIAS</div>
        <div className="page-sub">Ronda de 32 → Octavos → Cuartos → Semis → Final · 19 jul, MetLife Stadium</div>
      </div>

      {PHASES.map(phase => (
        <div key={phase.name} className="ko-phase">
          <div className="ko-phase-header">
            <div className="ko-phase-name">{phase.name}</div>
            <div className="ko-phase-date">{phase.date}</div>
          </div>
          <div className="ko-grid">
            {phase.slots.map((slot, i) => (
              <div key={i} className={`ko-card${phase.final ? ' final-card' : ''}`}>
                <div className="ko-team-row">
                  <span>⚽</span>
                  <span className="ko-slot-text">{slot[0]}</span>
                </div>
                <div className="ko-team-row">
                  <span>⚽</span>
                  <span className="ko-slot-text">{slot[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
