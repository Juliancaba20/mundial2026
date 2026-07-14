// ─── Construcción del prompt de análisis IA ──────────────────────────────────
// Extraído de la antigua ruta app/api/partidos/[id]/analysis/route.ts para que
// scripts/generate-analysis.ts (el único lugar que ahora llama a Gemini) pueda
// reusarlo sin duplicar la lógica del prompt.

import { TEAMS } from '@/lib/data'
import type { AnyMatch } from '@/lib/matches'
import { getTeamRefs, getMatchScoreText, getPhaseLabel, getStadiumInfo } from '@/lib/matches'

export const GEMINI_MODEL = 'gemini-3.5-flash'

export interface AnalysisPromptResult {
  systemInstruction: string
  prompt: string
  /** true = partido done/live: se debe usar Google Search grounding y basar
   *  el contenido en hechos reales verificables. false = pending: no hay
   *  nada que buscar todavía, la sección de pronóstico es explícitamente
   *  especulativa y se etiqueta como tal. */
  useGrounding: boolean
}

export function buildAnalysisPrompt(match: AnyMatch): AnalysisPromptResult {
  const { home: homeTeamRef, away: awayTeamRef } = getTeamRefs(match)

  const homeName = homeTeamRef?.name ?? 'Por definir'
  const awayName = awayTeamRef?.name ?? 'Por definir'

  const homeTeamInfo = homeTeamRef ? TEAMS.find(t => t.slug === homeTeamRef.slug || t.name === homeTeamRef.name) : undefined
  const awayTeamInfo = awayTeamRef ? TEAMS.find(t => t.slug === awayTeamRef.slug || t.name === awayTeamRef.name) : undefined

  const homeCoach = homeTeamInfo?.coach ?? 'No especificado'
  const awayCoach = awayTeamInfo?.coach ?? 'No especificado'

  const homePlayers = homeTeamInfo?.squad?.slice(0, 10).map(p => `${p.name} (${p.position}${p.club ? ' - ' + p.club : ''})`).join(', ') ?? 'No especificado'
  const awayPlayers = awayTeamInfo?.squad?.slice(0, 10).map(p => `${p.name} (${p.position}${p.club ? ' - ' + p.club : ''})`).join(', ') ?? 'No especificado'

  const matchScore = getMatchScoreText(match)

  const dateStr = match.kickoff ? new Date(match.kickoff).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  }) : match.date

  const phaseLabel = getPhaseLabel(match)
  const { stadium: stadiumName, location: cityName } = getStadiumInfo(match)

  let matchContext = `
INFORMACIÓN DEL PARTIDO:
- Partido ID: ${match.id}
- Fase/Grupo: ${phaseLabel}
- Local: ${homeName} (Confederación: ${homeTeamInfo?.confederation ?? 'N/A'}, DT: ${homeCoach})
- Visitante: ${awayName} (Confederación: ${awayTeamInfo?.confederation ?? 'N/A'}, DT: ${awayCoach})
- Estadio: ${stadiumName ?? 'No especificado'} (${cityName ?? 'Sede'})
- Fecha y Hora Local (Arg): ${dateStr}
- Estado del Partido: ${match.status === 'live' ? 'En Vivo' : match.status === 'done' ? 'Finalizado' : 'Pendiente'}
`

  if (match.status === 'live') {
    matchContext += `- Marcador en vivo: ${matchScore ?? '0 - 0'}\n- Minuto de juego: ${match.clock ?? 'En juego'}\n`
  } else if (match.status === 'done') {
    matchContext += `- Marcador final: ${matchScore ?? 'Resultado no disponible'}\n`
  }

  matchContext += `
PLANTELES Y JUGADORES CLAVE:
- Algunos jugadores destacados de ${homeName}: ${homePlayers}
- Algunos jugadores destacados de ${awayName}: ${awayPlayers}
`

  const useGrounding = match.status !== 'pending'

  const systemInstruction = useGrounding
    ? `Eres un analista de fútbol premium de la FIFA, experto, con un vocabulario futbolero extraordinario, técnico, pasional y objetivo. Te expresas en un español de fútbol impecable (utiliza términos como 'cotejo', 'dibujo táctico', 'transición ofensiva', 'fixture', 'penales', 'suplementario').

REGLA ABSOLUTA — VERACIDAD: Este partido ya se está jugando o ya finalizó. Usá la búsqueda de Google para encontrar información REAL y verificable sobre lo que efectivamente ocurrió en este partido específico (goles, autores, minutos, tarjetas, cambios, actuaciones destacadas). NUNCA inventes un hecho puntual (un gol, una jugada, una lesión, una expulsión) que no hayas podido confirmar mediante la búsqueda. Si no encontrás información confiable sobre algún hecho puntual, decilo explícitamente ("no se pudo confirmar el detalle de...") en lugar de imaginarlo o darlo por hecho. Es preferible un análisis más breve y honesto que uno completo pero con datos fabricados.`
    : `Eres un analista de fútbol premium de la FIFA, experto, con un vocabulario futbolero extraordinario, técnico, pasional y objetivo. Te expresas en un español de fútbol impecable (utiliza términos como 'cotejo', 'dibujo táctico', 'transición ofensiva', 'fixture', 'penales', 'suplementario').

REGLA ABSOLUTA — VERACIDAD: Este partido todavía no se jugó. No existe ningún hecho real que narrar todavía. Todo lo que escribas sobre el desarrollo del partido (duelos, marcador, jugadas) es un pronóstico especulativo, y debe quedar explícitamente marcado como tal — nunca redactado como si ya hubiera ocurrido. No inventes resultados de partidos anteriores entre estos equipos ni estadísticas que no te haya provisto el contexto.`

  const prompt = `Analiza el siguiente partido de la Copa Mundial FIFA 2026 basándote en la información provista${useGrounding ? ' y en los resultados de búsqueda reales sobre este partido' : ''}.
Por favor, genera un análisis bien estructurado en Markdown. Usa negritas y viñetas para que la lectura sea amena y elegante en la interfaz.

${matchContext}

Genera exactamente estas secciones utilizando encabezados de nivel 3 (###):

### 📋 Claves Tácticas del Cotejo
Explica la pizarra táctica de los entrenadores (${homeCoach} y ${awayCoach}). Plantea de 2 a 3 puntos críticos de cómo se neutralizan o superan mutuamente.${useGrounding ? ' Basate en lo que realmente ocurrió (buscalo) para explicar qué definió el marcador; si no encontrás el detalle táctico específico, hablá en términos generales sin inventar jugadas puntuales.' : ' Como el partido no se jugó, plantealo en términos de lo que se espera de cada planteo, sin narrar hechos como si ya hubiesen sucedido.'}

### ⭐️ Duelos Individuales y Figuras
${useGrounding
    ? `Buscá y contá qué jugadores realmente destacaron en este partido (goles, asistencias, actuación) usando los nombres provistos en la lista de plantel como referencia. Si no podés confirmar quién se destacó, decilo en vez de inventar un protagonista.`
    : `Comentá sobre los choques de jugadores clave que podrían marcar la diferencia, utilizando los nombres provistos en la lista de jugadores destacados. Dejá explícito que es una anticipación, no un hecho.`
  }

### 📈 Impacto en la Copa del Mundo
Explica detalladamente qué consecuencias tiene este resultado (o un potencial triunfo/empate si es pendiente) para el destino de ambas selecciones en esta Copa del Mundo, ya sea en la tabla del grupo o el camino en el bracket de eliminación directa.

${match.status === 'pending' ? `
### 🔮 Predicción y Marcador Estimado
Brinda un pronóstico detallado del trámite del partido y arriesga un marcador exacto con una breve justificación futbolística de por qué ocurrirá así. Dejá en claro que se trata de una predicción especulativa y no de un hecho.
` : `
### 📝 Crónica de la Jornada
Buscá y contá qué pasó realmente en este partido (o lo que va del mismo si está en vivo): el momento de mayor tensión, el/los gol/es y quién los convirtió. Si algún detalle puntual no lo podés confirmar con la búsqueda, decilo explícitamente en vez de narrar una jugada inventada.
`}`

  return { systemInstruction, prompt, useGrounding }
}

/** Fingerprint del estado del partido: si cambia, el análisis se considera desactualizado. */
export function getMatchFingerprint(match: AnyMatch): string {
  const score = getMatchScoreText(match) ?? ''
  return `${match.status}::${score}`
}
