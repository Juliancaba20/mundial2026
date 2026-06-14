import type { Metadata } from 'next'
import './globals.css'
import { Topbar } from '@/components/Topbar'

export const metadata: Metadata = {
  title: { default: 'Copa Mundial FIFA 2026', template: '%s | Mundial 2026' },
  description: 'Fixture, resultados en vivo, grupos y eliminatorias de la Copa Mundial FIFA 2026 — EE.UU, México y Canadá.',
  openGraph: {
    title: 'Copa Mundial FIFA 2026',
    description: '48 selecciones. 104 partidos. 11 jun – 19 jul.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Topbar />
        {children}
      </body>
    </html>
  )
}
