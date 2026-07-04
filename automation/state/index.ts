// automation/state/index.ts
// ─── Registro persistente de noticias ya publicadas ──────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { CONFIG, ROOT_DIR } from '../config.ts'

interface PublishedState {
  slugs: string[]
  lastRun: string | null
}

function getStatePath(): string {
  return path.resolve(ROOT_DIR, CONFIG.stateFile)
}

export function loadState(): PublishedState {
  const p = getStatePath()
  if (!fs.existsSync(p)) {
    return { slugs: [], lastRun: null }
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as PublishedState
  } catch {
    return { slugs: [], lastRun: null }
  }
}

export function saveState(state: PublishedState): void {
  const p = getStatePath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + '\n', 'utf8')
}

export function isPublished(slug: string): boolean {
  const state = loadState()
  // Capa 1: registro persistente
  if (state.slugs.includes(slug)) return true
  // Capa 2: carpeta en disco
  const dir = path.resolve(ROOT_DIR, CONFIG.contentDir, slug)
  return fs.existsSync(dir)
}

export function markPublished(slugs: string[]): void {
  const state = loadState()
  const updated = Array.from(new Set([...state.slugs, ...slugs]))
  saveState({ slugs: updated, lastRun: new Date().toISOString() })
}

export function getPublishedSlugs(): string[] {
  return loadState().slugs
}
