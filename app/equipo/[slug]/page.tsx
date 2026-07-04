import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TEAMS, TEAMS_BY_SLUG, BASE_MATCHES } from '@/lib/data'
import { LiveTeamMatches } from '@/components/LiveTeamMatches'
import { TeamFlag } from '@/components/TeamFlag'
import { SquadSectionClient } from '@/components/SquadSectionClient'
import type { Player } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

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
    openGraph: { title: `${team.name} — Mundial 2026` },
  }
}

const GROUP_COLORS: Record<string, string> = {
  A:'#00A86B', B:'#2563eb', C:'#dc2626', D:'#d97706',
  E:'#7c3aed', F:'#0891b2', G:'#059669', H:'#db2777',
  I:'#64748b', J:'#C9A84C', K:'#16a34a', L:'#6366f1',
}

const POSITION_LABELS: Record<Player['position'], string> = {
  GK:  'Arqueros',
  DEF: 'Defensores',
  MID: 'Mediocampistas',
  FWD: 'Delanteros',
}

const POSITION_ORDER: Player['position'][] = ['GK', 'DEF', 'MID', 'FWD']

export default async function EquipoPage({ params }: Props) {
  const { slug } = await params
  const team = TEAMS_BY_SLUG[slug]
  if (!team) notFound()

  const matches = BASE_MATCHES.filter(
    m => m.home.slug === slug || m.away.slug === slug
  )

  const groupColor = GROUP_COLORS[team.group] ?? 'var(--green)'
  
  let squad = team.squad ?? []
  let coach = team.coach ?? 'Por confirmar'
  const isPlaceholder = squad.length === 0

  if (isPlaceholder) {
    coach = 'Por confirmar'
    squad = [
      // Arqueros
      { number: 1, name: 'Por confirmar', position: 'GK', club: '—' },
      { number: 12, name: 'Por confirmar', position: 'GK', club: '—' },
      { number: 23, name: 'Por confirmar', position: 'GK', club: '—' },
      // Defensores
      { number: 2, name: 'Por confirmar', position: 'DEF', club: '—' },
      { number: 3, name: 'Por confirmar', position: 'DEF', club: '—' },
      { number: 4, name: 'Por confirmar', position: 'DEF', club: '—' },
      { number: 6, name: 'Por confirmar', position: 'DEF', club: '—' },
      { number: 13, name: 'Por confirmar', position: 'DEF', club: '—' },
      // Mediocampistas
      { number: 5, name: 'Por confirmar', position: 'MID', club: '—' },
      { number: 8, name: 'Por confirmar', position: 'MID', club: '—' },
      { number: 10, name: 'Por confirmar', position: 'MID', club: '—' },
      { number: 14, name: 'Por confirmar', position: 'MID', club: '—' },
      { number: 16, name: 'Por confirmar', position: 'MID', club: '—' },
      // Delanteros
      { number: 7, name: 'Por confirmar', position: 'FWD', club: '—' },
      { number: 9, name: 'Por confirmar', position: 'FWD', club: '—' },
      { number: 11, name: 'Por confirmar', position: 'FWD', club: '—' },
      { number: 19, name: 'Por confirmar', position: 'FWD', club: '—' },
      { number: 21, name: 'Por confirmar', position: 'FWD', club: '—' },
    ]
  }

  const squadByPosition = POSITION_ORDER.reduce<Record<Player['position'], Player[]>>(
    (acc, pos) => {
      acc[pos] = squad.filter(p => p.position === pos)
      return acc
    },
    { GK: [], DEF: [], MID: [], FWD: [] }
  )

  return (
    <>
      <div className="subpage-nav">
        <Link href="/grupos" className="back-link">← Volver a grupos</Link>
      </div>

      <div className="content-area">
        {/* HERO */}
        <div className="team-hero">
          <TeamFlag code={team.flagCode} name={team.name} size={64} className="team-flag-lg-img" />
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
            {team.worldCupBest && (
              <div className="team-wcbest">{team.worldCupBest}</div>
            )}
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        {team.description && (
          <p className="team-description">{team.description}</p>
        )}

        {/* PARTIDOS */}
        <LiveTeamMatches initialMatches={matches} />

        {/* PLANTEL + DT */}
        <SquadSectionClient
          coach={coach}
          squadByPosition={squadByPosition}
          positionLabels={POSITION_LABELS}
          positionOrder={POSITION_ORDER}
          isPlaceholder={isPlaceholder}
        />

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
                <TeamFlag code={t.flagCode} name={t.name} size={20} style={{ borderRadius: 2 }} />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
