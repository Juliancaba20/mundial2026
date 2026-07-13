// ─── Generador de análisis IA de partidos ────────────────────────────────────
//
// Reemplaza la caché en memoria (eliminada) que hacía que dos usuarios
// pudieran ver análisis distintos según a qué instancia serverless de Vercel
// llegara su request, y que se perdía en cada redeploy.
//
// Este script es la ÚNICA pieza del sistema que llama a Gemini. Corre fuera
// del ciclo de request de un usuario (cron de GitHub Actions o disparo manual
// vía `workflow_dispatch`), y escribe el resultado como archivos estáticos en
// `public/analisis/<matchId>.json`. Al ser archivos versionados en git y
// servidos como assets estáticos, TODOS los usuarios y TODAS las instancias
// de Vercel ven exactamente los mismos bytes — no hay forma de que diverjan.
//
// El análisis de un partido solo cambia cuando:
//   1) cambia su "fingerprint" (status + marcador) — ej. pasa a en vivo, hay
//      un gol, o finaliza — o
//   2) se corre este script con --force (regeneración manual explícita), o
//   3) se sube ANALYSIS_VERSION en lib/analysisVersion.ts (invalidación por
//      cambio de prompt/modelo).
// Un redeploy de Vercel NUNCA dispara una llamada a Gemini: solo vuelve a
// servir los archivos que ya existen en el commit desplegado.
//
// ── Rate limiting (plan gratuito de Gemini: 5 requests/minuto) ──────────────
// - Los partidos se procesan estrictamente en secuencia (nunca en paralelo).
// - Se respeta un espaciado mínimo entre llamadas reales a Gemini
//   (MIN_DELAY_BETWEEN_REQUESTS_MS), medido desde la última llamada,
//   independientemente de si fue un intento nuevo o un reintento.
// - Error 429 (RESOURCE_EXHAUSTED): se lee "retryDelay"/"Please retry in XXs"
//   del cuerpo del error de Gemini y se espera ese tiempo (con piso y techo
//   de seguridad) antes de reintentar el MISMO partido.
// - Error 503 (UNAVAILABLE / sobrecargado): backoff exponencial propio,
//   independiente del de 429.
// - MAX_ANALYSES_PER_RUN limita cuántos partidos se intentan generar por
//   corrida (éxito o no), para no acercarse nunca al límite del plan gratuito
//   incluso si hay muchos partidos desactualizados a la vez (ej. arranque en
//   frío). Lo que no entra en esta corrida queda pendiente para la próxima.
//
// Uso:
//   npx tsx scripts/generate-analysis.ts                  # todos los partidos con equipos definidos
//   npx tsx scripts/generate-analysis.ts --match=A1        # solo ese partido
//   npx tsx scripts/generate-analysis.ts --force           # ignora el fingerprint/versión y regenera igual
//   npx tsx scripts/generate-analysis.ts --dry-run         # no llama a Gemini ni escribe archivos, solo informa qué haría
//   MAX_ANALYSES_PER_RUN=10 npx tsx scripts/generate-analysis.ts   # override puntual del límite por corrida

import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import { getAllMatchesData, hasUndefinedTeams, type AnyMatch } from '@/lib/matches'
import { buildAnalysisPrompt, getMatchFingerprint, GEMINI_MODEL } from '@/lib/analysisPrompt'
import { ANALYSIS_VERSION } from '@/lib/analysisVersion'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'analisis')

// ─── Constantes de rate limiting / reintentos ────────────────────────────────
// Cuántos partidos se intentan (con éxito o no) por corrida. Es el freno
// principal contra el límite de 5 req/min del plan gratuito: aunque haya 50
// partidos desactualizados, esta corrida solo toca MAX_ANALYSES_PER_RUN.
const MAX_ANALYSES_PER_RUN = Number(process.env.MAX_ANALYSES_PER_RUN) || 5

// Límite real del plan gratuito de Gemini y espaciado mínimo derivado, con un
// colchón de seguridad extra (13s en vez de los 12s exactos de 60/5).
const GEMINI_RPM_LIMIT = 5
const MIN_DELAY_BETWEEN_REQUESTS_MS = Math.ceil(60000 / GEMINI_RPM_LIMIT) + 1000

const MAX_RETRIES_429 = 3
const MAX_RETRIES_503 = 4
const BASE_BACKOFF_503_MS = 2000
// Techo de seguridad para cualquier espera individual (ya sea por retryDelay
// de Gemini o por backoff propio), para no colgar la corrida indefinidamente.
const MAX_SINGLE_WAIT_MS = 45000

// Debe coincidir con el cron de .github/workflows/auto-analysis.yml — solo se
// usa para estimar en los logs cuándo se reintentarán los pendientes.
const CRON_INTERVAL_MINUTES = 20

interface AnalysisFile {
  matchId: string
  analysisVersion: number
  fingerprint: string
  text: string
  generatedAt: string
}

interface GeminiErrorInfo {
  status: number | null
  retryAfterSeconds: number | null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const matchArg = args.find(a => a.startsWith('--match='))
  return {
    matchId: matchArg ? matchArg.split('=')[1] : null,
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
  }
}

function readExisting(matchId: string): AnalysisFile | null {
  const file = path.join(OUTPUT_DIR, `${matchId}.json`)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Extrae el status HTTP y, si Gemini lo informa, el tiempo de espera sugerido
 * a partir de un error lanzado por el SDK @google/genai.
 *
 * El SDK serializa el cuerpo de error de Gemini como JSON dentro de
 * `error.message`, algo como:
 *   { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED",
 *       "message": "... Please retry in 20.5s.",
 *       "details": [{ "@type": "...RetryInfo", "retryDelay": "20s" }] } }
 * y expone el código HTTP en `error.status`. Se buscan ambas señales
 * (el campo estructurado "retryDelay" y el texto libre "retry in XXs") por
 * las dudas de que alguna de las dos no esté presente.
 */
function classifyGeminiError(err: unknown): GeminiErrorInfo {
  const statusRaw = (err as { status?: unknown } | null)?.status
  const status = typeof statusRaw === 'number' ? statusRaw : null
  const message = err instanceof Error ? err.message : String(err)

  let retryAfterSeconds: number | null = null

  const retryDelayMatch = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i)
  if (retryDelayMatch) {
    retryAfterSeconds = parseFloat(retryDelayMatch[1])
  }

  if (retryAfterSeconds === null) {
    const textMatch = message.match(/retry in\s+(\d+(?:\.\d+)?)\s*s/i)
    if (textMatch) {
      retryAfterSeconds = parseFloat(textMatch[1])
    }
  }

  return { status, retryAfterSeconds }
}

/** Estimación del próximo horario en que correrá el cron (redondeado hacia arriba). */
function estimateNextCronRun(intervalMinutes: number): string {
  const now = new Date()
  const minutes = now.getUTCMinutes()
  const remainder = minutes % intervalMinutes
  const toAdd = remainder === 0 ? intervalMinutes : intervalMinutes - remainder
  const next = new Date(now)
  next.setUTCMinutes(minutes + toAdd, 0, 0)
  return next.toISOString().replace('.000Z', 'Z')
}

// Timestamp (epoch ms) de la última llamada real a Gemini, compartido entre
// partidos y reintentos, para que el espaciado mínimo se respete siempre,
// sin importar si el próximo intento es un partido nuevo o un reintento.
let lastRequestAt = 0

async function waitForRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt
  if (lastRequestAt > 0 && elapsed < MIN_DELAY_BETWEEN_REQUESTS_MS) {
    await sleep(MIN_DELAY_BETWEEN_REQUESTS_MS - elapsed)
  }
}

type GenerateResult =
  | { ok: true; text: string }
  | { ok: false; reason: string }

async function generateForMatch(ai: GoogleGenAI, match: AnyMatch): Promise<GenerateResult> {
  let attempt429 = 0
  let attempt503 = 0

  for (;;) {
    await waitForRateLimit()
    lastRequestAt = Date.now()

    try {
      const { systemInstruction, prompt } = buildAnalysisPrompt(match)
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      })
      return { ok: true, text: response.text || 'No se pudo generar el análisis.' }
    } catch (err) {
      const info = classifyGeminiError(err)

      if (info.status === 429) {
        attempt429++
        if (attempt429 > MAX_RETRIES_429) {
          return { ok: false, reason: `429 (cuota excedida) tras ${MAX_RETRIES_429} reintentos` }
        }
        const suggestedMs = (info.retryAfterSeconds ?? MIN_DELAY_BETWEEN_REQUESTS_MS / 1000) * 1000
        const waitMs = clamp(suggestedMs, MIN_DELAY_BETWEEN_REQUESTS_MS, MAX_SINGLE_WAIT_MS)
        console.log(
          `[generate-analysis] 429 en ${match.id} (intento ${attempt429}/${MAX_RETRIES_429}). ` +
          `Gemini sugirió ${info.retryAfterSeconds ?? 'sin dato'}s de espera → esperando ${Math.round(waitMs / 1000)}s antes de reintentar...`
        )
        await sleep(waitMs)
        continue
      }

      if (info.status === 503) {
        attempt503++
        if (attempt503 > MAX_RETRIES_503) {
          return { ok: false, reason: `503 (servicio sobrecargado) tras ${MAX_RETRIES_503} reintentos` }
        }
        const backoffMs = clamp(BASE_BACKOFF_503_MS * 2 ** (attempt503 - 1), 0, MAX_SINGLE_WAIT_MS)
        console.log(
          `[generate-analysis] 503 en ${match.id} (intento ${attempt503}/${MAX_RETRIES_503}). ` +
          `Backoff exponencial: esperando ${Math.round(backoffMs / 1000)}s antes de reintentar...`
        )
        await sleep(backoffMs)
        continue
      }

      // Error no reconocido / no reintentable (ej. prompt inválido, red caída sin status).
      const msg = err instanceof Error ? err.message.slice(0, 300) : String(err)
      return { ok: false, reason: msg }
    }
  }
}

async function main() {
  const { matchId, force, dryRun } = parseArgs()

  if (!process.env.GEMINI_API_KEY) {
    console.error('[generate-analysis] Falta GEMINI_API_KEY en el entorno. Abortando.')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const { allMatches } = await getAllMatchesData()
  const targets = matchId ? allMatches.filter(m => m.id === matchId) : allMatches

  if (matchId && targets.length === 0) {
    console.error(`[generate-analysis] No existe ningún partido con id "${matchId}".`)
    process.exit(1)
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  let succeeded = 0
  let attempted = 0
  let skippedUpToDate = 0
  let skippedUndefined = 0
  const failedMatchIds: string[] = []
  const cappedMatchIds: string[] = []

  console.log(
    `[generate-analysis] Iniciando corrida. Límite por corrida: ${MAX_ANALYSES_PER_RUN} partido(s) · ` +
    `espaciado mínimo entre llamadas: ${Math.round(MIN_DELAY_BETWEEN_REQUESTS_MS / 1000)}s ` +
    `(≤ ${GEMINI_RPM_LIMIT} req/min)${dryRun ? ' · MODO DRY-RUN (sin llamadas reales)' : ''}`
  )

  for (const match of targets) {
    if (hasUndefinedTeams(match)) {
      skippedUndefined++
      continue
    }

    const fingerprint = getMatchFingerprint(match)
    const existing = readExisting(match.id)

    const isUpToDate = existing
      && existing.analysisVersion === ANALYSIS_VERSION
      && existing.fingerprint === fingerprint

    if (isUpToDate && !force) {
      skippedUpToDate++
      continue
    }

    // Partido a procesar, pero ya se llegó al límite de esta corrida: se
    // deja pendiente para la próxima ejecución del cron, sin gastar cuota.
    if (attempted >= MAX_ANALYSES_PER_RUN) {
      cappedMatchIds.push(match.id)
      continue
    }

    attempted++

    if (dryRun) {
      console.log(`[generate-analysis] (dry-run) Generaría análisis para ${match.id} (fingerprint: ${fingerprint})`)
      succeeded++
      continue
    }

    console.log(`[generate-analysis] Procesando ${match.id} (fingerprint: ${fingerprint}) — ${attempted}/${MAX_ANALYSES_PER_RUN} de esta corrida...`)

    const result = await generateForMatch(ai, match)

    if (result.ok) {
      const output: AnalysisFile = {
        matchId: match.id,
        analysisVersion: ANALYSIS_VERSION,
        fingerprint,
        text: result.text,
        generatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${match.id}.json`),
        JSON.stringify(output, null, 2),
        'utf8'
      )
      succeeded++
      console.log(`[generate-analysis] OK ${match.id}`)
    } else {
      failedMatchIds.push(match.id)
      console.error(`[generate-analysis] Falló ${match.id}: ${result.reason}`)
    }
  }

  const pendingTotal = cappedMatchIds.length + failedMatchIds.length

  console.log('─────────────────────────────────────────────────────────')
  console.log(
    `[generate-analysis] Resumen de la corrida:\n` +
    `  Generados con éxito:        ${succeeded}\n` +
    `  Intentados y fallidos:      ${failedMatchIds.length}\n` +
    `  Sin cambios (ya al día):    ${skippedUpToDate}\n` +
    `  Sin equipos definidos:      ${skippedUndefined}\n` +
    `  Pendientes por límite:      ${cappedMatchIds.length} (de ${MAX_ANALYSES_PER_RUN} máx. por corrida)\n` +
    `  Total pendiente para la próxima corrida: ${pendingTotal}`
  )

  if (cappedMatchIds.length > 0) {
    const preview = cappedMatchIds.slice(0, 20).join(', ')
    const extra = cappedMatchIds.length > 20 ? ` (+${cappedMatchIds.length - 20} más)` : ''
    console.log(`[generate-analysis] Pendientes por límite de corrida: ${preview}${extra}`)
  }

  if (failedMatchIds.length > 0) {
    const preview = failedMatchIds.slice(0, 20).join(', ')
    const extra = failedMatchIds.length > 20 ? ` (+${failedMatchIds.length - 20} más)` : ''
    console.log(`[generate-analysis] Fallidos tras reintentos: ${preview}${extra}`)
  }

  if (pendingTotal > 0 && !dryRun) {
    console.log(
      `[generate-analysis] Se reintentarán en la próxima corrida programada ` +
      `(cron cada ${CRON_INTERVAL_MINUTES} min) — estimado: ${estimateNextCronRun(CRON_INTERVAL_MINUTES)}`
    )
  }
  console.log('─────────────────────────────────────────────────────────')

  // Falla el workflow solo si hubo partidos a procesar y TODOS los intentos fallaron.
  if (attempted > 0 && succeeded === 0 && !dryRun) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('[generate-analysis] Error fatal:', err)
  process.exit(1)
})
