// automation/logger/index.ts
// ─── Logger estructurado con etapas ──────────────────────────────────────────

type Level = 'info' | 'warn' | 'error' | 'success'

function ts(): string {
  return new Date().toISOString().slice(11, 23) // HH:MM:SS.mmm
}

function color(level: Level): string {
  const colors: Record<Level, string> = {
    info:    '\x1b[36m',  // cyan
    warn:    '\x1b[33m',  // yellow
    error:   '\x1b[31m',  // red
    success: '\x1b[32m',  // green
  }
  return colors[level]
}

const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'
const DIM   = '\x1b[2m'

export const logger = {
  info(msg: string): void {
    console.log(`${DIM}[${ts()}]${RESET} ${color('info')}ℹ${RESET}  ${msg}`)
  },
  warn(msg: string): void {
    console.warn(`${DIM}[${ts()}]${RESET} ${color('warn')}⚠${RESET}  ${msg}`)
  },
  error(msg: string, err?: unknown): void {
    const detail = err instanceof Error ? `: ${err.message}` : err ? `: ${String(err)}` : ''
    console.error(`${DIM}[${ts()}]${RESET} ${color('error')}✖${RESET}  ${msg}${detail}`)
  },
  success(msg: string): void {
    console.log(`${DIM}[${ts()}]${RESET} ${color('success')}✔${RESET}  ${msg}`)
  },
  section(title: string): void {
    console.log(`\n${BOLD}${'─'.repeat(50)}${RESET}`)
    console.log(`${BOLD}  ${title}${RESET}`)
    console.log(`${BOLD}${'─'.repeat(50)}${RESET}`)
  },
  summary(published: number, total: number, skipped: number): void {
    console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`)
    console.log(`${BOLD}  RESUMEN${RESET}`)
    console.log(`  Publicadas : ${color('success')}${published}/${total}${RESET}`)
    if (skipped > 0) console.log(`  Omitidas   : ${color('warn')}${skipped}${RESET}`)
    console.log(`${BOLD}${'═'.repeat(50)}${RESET}\n`)
  },
}
