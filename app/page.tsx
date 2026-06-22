import type { Metadata } from 'next'
import Link from 'next/link'
import { Countdown } from '@/components/Countdown'
import { FeaturedMatchesClient, MatchStripClient } from '@/components/MatchesClient'
import { BASE_MATCHES, TEAMS, FEATURED_TEAM_SLUGS, TEAMS_BY_SLUG } from '@/lib/data'
import { TeamFlag } from '@/components/TeamFlag'
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
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            FIFA COPA MUNDIAL
          </div>
          <h1 className="hero-title">
            USA · MÉX<br /><span>CAN 2026</span>
          </h1>
          <p className="hero-subtitle">EE.UU · México · Canadá &nbsp;·&nbsp; 11 jun – 19 jul</p>

          <Countdown />

          <div className="hero-meta">
            <div className="hero-stat"><span className="hero-stat-num">48</span> selecciones</div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span className="hero-stat-num">104</span> partidos</div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span className="hero-stat-num">16</span> estadios</div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span className="hero-stat-num">3</span> países sede</div>
          </div>
        </div>
      </div>

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
          <div className="teams-scroll">
            {featuredTeams.map(t => (
              <Link key={t.slug} href={`/equipo/${t.slug}`} className={`team-card${t.isChampion ? ' arg' : ''}`}>
                <TeamFlag code={t.flagCode} name={t.name} size={36} className="tc-flag-img" />
                <div className="tc-name">{t.name}</div>
                <div className="tc-group">Grupo {t.group}</div>
                {t.isChampion && <div className="tc-badge">★ Campeona</div>}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
