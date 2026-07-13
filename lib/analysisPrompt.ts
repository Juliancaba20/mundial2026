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

  const systemInstruction = `Eres un analista de fútbol premium de la FIFA, experto, con un vocabulario futbolero extraordinario, técnico, pasional y objetivo. Te expresas en un español de fútbol impecable (utiliza términos como 'cotejo', 'dibujo táctico', 'transición ofensiva', 'fixture', 'penales', 'suplementario'). Tu objetivo es brindar el análisis más completo e interesante posible para este partido de la Copa Mundial 2026.`

  const prompt = `Analiza el siguiente partido de la Copa Mundial FIFA 2026 basándote en la información provista.
Por favor, genera un análisis bien estructurado en Markdown. Usa negritas y viñetas para que la lectura sea amena y elegante en la interfaz.

${matchContext}

Genera exactamente estas secciones utilizando encabezados de nivel 3 (###):

### 📋 Claves Tácticas del Cotejo
Explica la pizarra táctica de los entrenadores (${homeCoach} y ${awayCoach}). Plantea de 2 a 3 puntos críticos de cómo se neutralizan o superan mutuamente. Si el partido ya finalizó, explica cuál fue la clave táctica que definió el marcador final.

### ⭐️ Duelos Individuales y Figuras
Comenta sobre los choques de jugadores clave y quiénes pueden marcar la diferencia (o quiénes la marcaron si ya terminó), utilizando los nombres provistos en la lista de jugadores destacados.

### 📈 Impacto en la Copa del Mundo
Explica detalladamente qué consecuencias tiene este resultado (o un potencial triunfo/empate si es pendiente) para el destino de ambas selecciones en esta Copa del Mundo, ya sea en la tabla del grupo o el camino en el bracket de eliminación directa.

${match.status === 'pending' ? `
### 🔮 Predicción y Marcador Estimado
Brinda un pronóstico detallado del trámite del partido y arriesga un marcador exacto con una breve justificación futbolística de por qué ocurrirá así.
` : `
### 📝 Crónica de la Jornada
Brinda una breve crónica y un resumen de las sensaciones futbolísticas que deja este encuentro en vivo o ya finalizado, destacando el momento de máxima tensión o el gol decisivo.
`}`

  return { systemInstruction, prompt }
}

/** Fingerprint del estado del partido: si cambia, el análisis se considera desactualizado. */
export function getMatchFingerprint(match: AnyMatch): string {
  const score = getMatchScoreText(match) ?? ''
  return `${match.status}::${score}`
}
