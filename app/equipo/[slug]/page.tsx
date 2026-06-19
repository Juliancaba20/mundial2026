import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TEAMS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { LiveTeamMatches } from '@/components/LiveTeamMatches'

interface Props {
  params: Promise<{ slug: string }>
}

// Genera las 48 páginas de equipos en build time → Vercel las sirve estáticas
export function generateStaticParams() {
  return TEAMS.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const team = TEAMS_BY_SLUG[slug]
  if (!team) return { title: 'Equipo no encontrado' }
  return {
    title: team.name,
    description: team.description ?? `${team.name} en el Mundial 2026. Grupo ${team.group}.`,
    openGraph: { title: `${team.flag} ${team.name} — Mundial 2026` },
  }
}

const GROUP_COLORS: Record<string, string> = {
  A:'#00A86B', B:'#2563eb', C:'#dc2626', D:'#d97706',
  E:'#7c3aed', F:'#0891b2', G:'#059669', H:'#db2777',
  I:'#64748b', J:'#C9A84C', K:'#16a34a', L:'#6366f1',
}

export default async function EquipoPage({ params }: Props) {
  const { slug } = await params
  const team = TEAMS_BY_SLUG[slug]
  if (!team) notFound()

  const matches = BASE_MATCHES.filter(
    m => m.home.slug === slug || m.away.slug === slug
  )

  const groupColor = GROUP_COLORS[team.group] ?? 'var(--green)'

  return (
    <div className="content-area">
      <Link href="/grupos" className="back-link">
        ← Volver a grupos
      </Link>

      {/* HERO DEL EQUIPO */}
      <div className="team-hero">
        <div className="team-flag-lg">{team.flag}</div>
        <div>
          <div className="team-name-lg">{team.name.toUpperCase()}</div>
          <div className="team-meta-row">
            <Link
              href={`/grupo/${team.group.toLowerCase()}`}
              className="team-meta-pill"
              style={{ borderColor: groupColor, color: groupColor }}
            >
              Grupo {team.group}
            </Link>
            <span className="team-meta-pill">{team.confederation}</span>
            {team.isChampion && (
              <span className="team-champ-pill">★ Campeona del Mundo</span>
            )}
          </div>
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      {team.description && (
        <p className="team-description">{team.description}</p>
      )}

      {/* PARTIDOS — client island con resultados ESPN en vivo */}
      <LiveTeamMatches initialMatches={matches} />

      {/* OTROS EQUIPOS DEL GRUPO */}
      <div style={{ marginTop: 40 }}>
        <div className="team-section-title">GRUPO {team.group}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {TEAMS.filter(t => t.group === team.group && t.slug !== slug).map(t => (
            <Link
              key={t.slug}
              href={`/equipo/${t.slug}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', fontSize: 14,
                color: 'var(--text)', textDecoration: 'none', transition: 'border-color .15s',
              }}
            >
              <span style={{ fontSize: 20 }}>{t.flag}</span>
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
