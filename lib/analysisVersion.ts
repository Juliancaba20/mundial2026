// ─── Versión del análisis IA ─────────────────────────────────────────────────
// Incrementar este número CADA VEZ que cambie:
//   - el prompt o las instrucciones de sistema (buildAnalysisPrompt)
//   - el modelo de Gemini utilizado
//   - el formato/estructura esperada del análisis (secciones, etc.)
//
// Cualquier archivo en `public/analisis/<matchId>.json` cuya `analysisVersion`
// no coincida con esta constante se considera desactualizado y
// `scripts/generate-analysis.ts` lo regenerará en la próxima corrida (o al
// forzarlo con --force), sin necesidad de borrar archivos a mano.
export const ANALYSIS_VERSION = 1
