import type { Metadata } from 'next'
import { MatchesClient } from '@/components/MatchesClient'

export const metadata: Metadata = {
  title: 'Partidos',
  description: 'Todos los partidos de la fase de grupos del Mundial 2026 con resultados en vivo.',
}

export default function PartidosPage() {
  return (
    <div className="content-area">
      <MatchesClient />
    </div>
  )
}
