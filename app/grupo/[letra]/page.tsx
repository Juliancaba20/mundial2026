import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GROUPS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { LiveGroupStandings } from '@/components/LiveGroupStandings'
import { TeamFlag } from '@/components/TeamFlag'

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
    description: `Tabla de posiciones y partidos del Grupo ${letter} — Mundial 2026.`,
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

  const color = GROUP_COLORS[letter] ?? 'var(--green)'
  const groupMatches = BASE_MATCHES.filter(m => m.group === letter)

  return (
    <>
      {/* BACK LINK — centrado arriba */}
      <div className="subpage-nav">
        <Link href="/grupos" className="back-link">← Volver a grupos</Link>
      </div>

      <div className="content-area">
        {/* HEADER con acento de color del grupo */}
        <div className="page-header-accent">
          <div className="page-header-stripe" style={{ background: color }} />
          <div className="page-header-inner">
            <div className="page-title">GRUPO {letter}</div>
            <div className="page-sub">Copa Mundial FIFA 2026 · clasifican los 2 primeros</div>
          </div>
        </div>

        {/* TABLA EN VIVO + PARTIDOS */}
        <LiveGroupStandings
          groupLetter={letter}
          initialMatches={groupMatches}
        />

        {/* EQUIPOS */}
        <div style={{ marginTop: 40 }}>
          <div className="team-section-title">SELECCIONES</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10, marginTop: 14,
          }}>
            {group.teams.map(t => {
              const full = TEAMS_BY_SLUG[t.slug]
              return (
                <Link
                  key={t.slug}
                  href={`/equipo/${t.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: full?.isChampion ? 'var(--arg)' : 'var(--surface)',
                    border: `1px solid ${full?.isChampion ? 'var(--arg-border)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    color: 'var(--text)', textDecoration: 'none',
                    transition: 'border-color .15s',
                  } as React.CSSProperties}
                >
                  <TeamFlag code={t.flagCode} name={t.name} size={28} style={{ borderRadius: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: full?.isChampion ? 700 : 500 }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {full?.confederation}
                    </div>
                  </div>
                  {full?.isChampion && (
                    <span className="champ-badge" style={{ marginLeft: 'auto' }}>★</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* NAVEGACIÓN ENTRE GRUPOS */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14,
          }}>
            Otros grupos
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {'ABCDEFGHIJKL'.split('').filter(l => l !== letter).map(l => (
              <Link
                key={l}
                href={`/grupo/${l.toLowerCase()}`}
                style={{
                  fontFamily: 'var(--display)', fontSize: 20, letterSpacing: '.04em',
                  width: 44, height: 44, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
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
    </>
  )
}
