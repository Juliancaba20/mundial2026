import type { Metadata } from 'next'
import { BracketView } from '@/components/BracketView'

export const metadata: Metadata = {
  title: 'Eliminatorias',
  description: 'Bracket completo del Mundial 2026: 16avos, octavos, cuartos, semifinales, tercer puesto y final.',
}

export default function EliminatoriasPage() {
  return (
    <div className="content-area">
      <div className="page-header-accent">
        <div className="page-header-stripe" style={{ background: '#C9A84C' }} />
        <div className="page-header-inner">
          <div className="page-title">ELIMINATORIAS</div>
          <div className="page-sub">
            32 equipos · 5 rondas · Final 19 jul, MetLife Stadium, Nueva York/NJ
          </div>
        </div>
      </div>
      <BracketView />
    </div>
  )
}
