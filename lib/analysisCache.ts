// ─── Caché del análisis IA de partidos ───────────────────────────────────────
// Evita regenerar (y recobrar de Gemini) el mismo análisis en cada visita a
// la subpágina de un partido. La clave incluye estado + marcador para que el
// análisis se regenere automáticamente cuando el partido avanza (gol, pasa a
// en vivo, finaliza), sin necesidad de invalidación manual.
//
// Nota: caché en memoria del proceso (module-level Map). Suficiente para un
// único servidor/instancia serverless de corta duración con revalidación de
// 60s en la fuente (ESPN). No sobrevive a un reinicio del proceso, lo cual es
// aceptable: en el peor caso se regenera una vez más.

interface CacheEntry {
  analysis: string
  expiresAt: number
}

const TTL_MS = 10 * 60 * 1000 // 10 minutos

const store = new Map<string, CacheEntry>()

export function buildAnalysisCacheKey(matchId: string, status: string, score?: string): string {
  return `${matchId}::${status}::${score ?? ''}`
}

export function getCachedAnalysis(key: string): string | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.analysis
}

export function setCachedAnalysis(key: string, analysis: string): void {
  store.set(key, { analysis, expiresAt: Date.now() + TTL_MS })
}
