import type { Metadata } from 'next'
import Link from 'next/link'
import { Countdown } from '@/components/Countdown'
import { HeroClient } from '@/components/HeroClient'
import { FeaturedTeamsClient } from '@/components/FeaturedTeamsClient'
import { FeaturedMatchesClient, MatchStripClient } from '@/components/MatchesClient'
import { BASE_MATCHES, FEATURED_TEAM_SLUGS, TEAMS_BY_SLUG } from '@/lib/data'
import { getAllNoticias } from '@/lib/noticias'
import { NoticiaCard } from '@/components/NoticiaCard'

export const metadata: Metadata = {
  title: 'Copa Mundial FIFA 2026',
  description: 'Fixture oficial, resultados en vivo, grupos y eliminatorias del Mundial 2026 — EE.UU, México y Canadá.',
}

export default function HomePage() {
  const featuredTeams = FEATURED_TEAM_SLUGS.map(s => TEAMS_BY_SLUG[s]).filter(Boolean)
  // Las 4 noticias más recientes (orden desc por fecha desde lib/noticias).
  const noticiasHome = getAllNoticias().slice(0, 4)

  return (
    <>
      {/* HERO */}
      <HeroClient countdown={<Countdown />} />

      {/* MATCH STRIP */}
      <MatchStripClient initialMatches={BASE_MATCHES} />

      <div className="home-body">

        {/* PARTIDOS DESTACADOS — sección primaria */}
        <div className="home-section">
          <div className="section-eyebrow">
            <div className="section-label primary">Partidos destacados</div>
            <Link href="/partidos" className="section-link">Ver todos →</Link>
          </div>
          <FeaturedMatchesClient initialMatches={BASE_MATCHES} />
        </div>

        {/* NOTICIAS */}
        <div className="home-section">
          <div className="section-eyebrow">
            <div className="section-label">Noticias del torneo</div>
            <Link href="/noticias" className="section-link">Ver todas →</Link>
          </div>
          <div className="news-grid">
            {noticiasHome.map(article => (
              <NoticiaCard key={article.slug} noticia={article} />
            ))}
          </div>
        </div>

        {/* SELECCIONES DESTACADAS */}
        <div className="home-section-sm">
          <div className="section-eyebrow">
            <div className="section-label">Selecciones destacadas</div>
            <Link href="/grupos" className="section-link">Ver grupos →</Link>
          </div>
          <FeaturedTeamsClient teams={featuredTeams} />
        </div>

      </div>
    </>
  )
}

