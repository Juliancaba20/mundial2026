import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GROUPS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { MatchRow } from '@/components/MatchRow'

interface Props {
  params: Promise<{ letra: string }>
}

export function generateStaticParams() {
  return 'ABCDEFGHIJKL'.split('').map(l => ({ letra: l.toLowerCase() }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letra } = await params
  const letter = letra.toUpperCase()
  return {
    title: `Grupo ${letter}`,
    description: `Equipos y partidos del Grupo ${letter} en el Mundial 2026.`,
  }
}

const GROUP_COLORS: Record<string, string> = {
  A:'#00A86B', B:'#2563eb', C:'#dc2626', D:'#d97706',
  E:'#7c3aed', F:'#0891b2', G:'#059669', H:'#db2777',
  I:'#64748b', J:'#C9A84C', K:'#16a34a', L:'#6366f1',
}

export default async function GrupoPage({ params }: Props) {
  const { letra } = await params
  const letter = letra.toUpperCase()
  const group = GROUPS.find(g => g.letter === letter)
  if (!group) notFound()

  const fullTeams = group.teams.map(t => TEAMS_BY_SLUG[t.slug]).filter(Boolean)
  const matches = BASE_MATCHES.filter(m => m.group === letter)
  const color = GROUP_COLORS[letter] ?? 'var(--green)'

  return (
    <div className="content-area">
      <Link href="/grupos" className="back-link">
        ← Volver a grupos
      </Link>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 6, borderRadius: 4,
          alignSelf: 'stretch', background: color, flexShrink: 0,
        }} />
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 56, letterSpacing: '.04em', color: 'var(--text)', lineHeight: 1 }}>
            GRUPO {letter}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Copa Mundial FIFA 2026 · clasifican los 2 primeros
          </div>
        </div>
      </div>

      {/* EQUIPOS */}
      <div style={{ marginBottom: 40 }}>
        <div className="team-section-title">SELECCIONES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
          {fullTeams.map(t => (
            <Link
              key={t.slug}
              href={`/equipo/${t.slug}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: t.isChampion ? 'var(--arg)' : 'var(--surface)',
                border: `1px solid ${t.isChampion ? 'var(--arg-border)' : 'var(--border)'}`,
                borderRadius: 12, padding: '14px 16px',
                color: 'var(--text)', textDecoration: 'none', transition: 'border-color .15s',
              } as React.CSSProperties}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{t.flag}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: t.isChampion ? 700 : 500 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t.confederation}</div>
              </div>
              {t.isChampion && (
                <span className="champ-badge" style={{ marginLeft: 'auto' }}>★</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* PARTIDOS */}
      <div>
        <div className="team-section-title">PARTIDOS</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {matches.map(m => (
            <MatchRow key={m.id} match={m} showGroup={false} />
          ))}
        </div>
      </div>

      {/* NAVEGACIÓN ENTRE GRUPOS */}
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
          Otros grupos
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {'ABCDEFGHIJKL'.split('').filter(l => l !== letter).map(l => (
            <Link
              key={l}
              href={`/grupo/${l.toLowerCase()}`}
              style={{
                fontFamily: 'var(--display)', fontSize: 20, letterSpacing: '.04em',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', textDecoration: 'none',
                transition: 'border-color .15s',
              }}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
