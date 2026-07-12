import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { TEAMS } from '@/lib/data'
import {
  getAllMatchesData,
  findMatchById,
  getTeamRefs,
  hasUndefinedTeams,
  getMatchScoreText,
  getPhaseLabel,
  getStadiumInfo,
} from '@/lib/matches'
import { buildAnalysisCacheKey, getCachedAnalysis, setCachedAnalysis } from '@/lib/analysisCache'

// Initialize the GoogleGenAI client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'La API Key de Gemini no está configurada en las variables de entorno.' },
        { status: 500 }
      )
    }

    // Fetch the latest real-time scores (pipeline cacheado por request)
    const { allMatches } = await getAllMatchesData()
    const match = findMatchById(allMatches, id)
    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado.' },
        { status: 404 }
      )
    }

    // Guard: si el cruce todavía no está definido (bracket sin resolver), no
    // tiene sentido pedirle a Gemini un análisis táctico de dos equipos
    // "Por definir" — es gasto de cuota sin valor real para el usuario.
    if (hasUndefinedTeams(match)) {
      return NextResponse.json(
        { error: 'El análisis estará disponible cuando se conozcan ambos equipos de este cruce.' },
        { status: 409 }
      )
    }

    const matchScore = getMatchScoreText(match)

    // Caché: evita regenerar el mismo análisis en cada visita. Se invalida
    // automáticamente cuando cambia el estado o el marcador del partido.
    const cacheKey = buildAnalysisCacheKey(match.id, match.status, matchScore)
    const cached = getCachedAnalysis(cacheKey)
    const forceRegenerate = req.nextUrl.searchParams.get('regenerate') === '1'
    if (cached && !forceRegenerate) {
      return NextResponse.json({ analysis: cached, cached: true })
    }

    // Retrieve teams additional metadata from TEAMS array safely
    const { home: homeTeamRef, away: awayTeamRef } = getTeamRefs(match)

    const homeName = homeTeamRef?.name ?? 'Por definir'
    const awayName = awayTeamRef?.name ?? 'Por definir'

    const homeTeamInfo = homeTeamRef ? TEAMS.find(t => t.slug === homeTeamRef.slug || t.name === homeTeamRef.name) : undefined
    const awayTeamInfo = awayTeamRef ? TEAMS.find(t => t.slug === awayTeamRef.slug || t.name === awayTeamRef.name) : undefined

    const homeCoach = homeTeamInfo?.coach ?? 'No especificado'
    const awayCoach = awayTeamInfo?.coach ?? 'No especificado'

    const homePlayers = homeTeamInfo?.squad?.slice(0, 10).map(p => `${p.name} (${p.position}${p.club ? ' - ' + p.club : ''})`).join(', ') ?? 'No especificado'
    const awayPlayers = awayTeamInfo?.squad?.slice(0, 10).map(p => `${p.name} (${p.position}${p.club ? ' - ' + p.club : ''})`).join(', ') ?? 'No especificado'

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

    // Construct the prompt context based on match state
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

    // Call the Gemini model using the official generateContent API
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    })

    const text = response.text || 'No se pudo generar el análisis.'

    setCachedAnalysis(cacheKey, text)

    return NextResponse.json({ analysis: text, cached: false })
  } catch (error: unknown) {
    console.error('[GEMINI_ANALYSIS_ERROR]', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el análisis: ' + errMsg },
      { status: 500 }
    )
  }
}
