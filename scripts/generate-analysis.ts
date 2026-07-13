// ─── Generador de análisis IA de partidos ────────────────────────────────────
//
// Reemplaza la caché en memoria (lib/analysisCache.ts, eliminada) que hacía
// que dos usuarios pudieran ver análisis distintos según a qué instancia
// serverless de Vercel llegara su request, y que se perdía en cada redeploy.
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
// Uso:
//   npx tsx scripts/generate-analysis.ts                  # todos los partidos con equipos definidos
//   npx tsx scripts/generate-analysis.ts --match=A1        # solo ese partido
//   npx tsx scripts/generate-analysis.ts --force           # ignora el fingerprint/versión y regenera igual
//   npx tsx scripts/generate-analysis.ts --dry-run         # no llama a Gemini ni escribe archivos, solo informa qué haría

import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import { getAllMatchesData, hasUndefinedTeams } from '@/lib/matches'
import { buildAnalysisPrompt, getMatchFingerprint, GEMINI_MODEL } from '@/lib/analysisPrompt'
import { ANALYSIS_VERSION } from '@/lib/analysisVersion'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'analisis')

interface AnalysisFile {
  matchId: string
  analysisVersion: number
  fingerprint: string
  text: string
  generatedAt: string
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

  let generated = 0
  let skipped = 0
  let skippedUndefined = 0
  let failed = 0

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
      skipped++
      continue
    }

    console.log(`[generate-analysis] ${dryRun ? '(dry-run) ' : ''}Generando análisis para ${match.id} (fingerprint: ${fingerprint})...`)

    if (dryRun) {
      generated++
      continue
    }

    try {
      const { systemInstruction, prompt } = buildAnalysisPrompt(match)
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 },
      })

      const text = response.text || 'No se pudo generar el análisis.'

      const output: AnalysisFile = {
        matchId: match.id,
        analysisVersion: ANALYSIS_VERSION,
        fingerprint,
        text,
        generatedAt: new Date().toISOString(),
      }

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${match.id}.json`),
        JSON.stringify(output, null, 2),
        'utf8'
      )
      generated++
    } catch (err) {
      failed++
      console.error(`[generate-analysis] Error generando ${match.id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(
    `[generate-analysis] Listo. Generados: ${generated} | Sin cambios: ${skipped} | ` +
    `Sin equipos definidos: ${skippedUndefined} | Con error: ${failed}`
  )

  // Falla el workflow solo si hubo partidos a procesar y TODOS fallaron.
  if (failed > 0 && generated === 0 && !dryRun) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('[generate-analysis] Error fatal:', err)
  process.exit(1)
})
