// automation/git/index.ts
// ─── Git: add, commit y push ──────────────────────────────────────────────────
// Solo hace commit si hay cambios. Nunca rompe si no hay nada que commitear.

import { execSync } from 'node:child_process'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'

function git(cmd: string): string {
  return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim()
}

function hasChanges(): boolean {
  try {
    const status = git('status --porcelain')
    return status.length > 0
  } catch {
    return false
  }
}

export function commitAndPush(publishedCount: number, today: string): boolean {
  try {
    // Configurar autor
    git(`config user.name "${CONFIG.git.authorName}"`)
    git(`config user.email "${CONFIG.git.authorEmail}"`)

    // Stage solo los archivos de noticias y el estado
    git(`add ${CONFIG.contentDir}/ ${CONFIG.publicDir}/ ${CONFIG.stateFile}`)

    if (!hasChanges()) {
      logger.info('No hay cambios staged. Nada que commitear.')
      return false
    }

    const message = `${CONFIG.git.commitPrefix} ${today} (${publishedCount} noticias)`
    git(`commit -m "${message}"`)
    logger.success(`Commit: ${message}`)

    git(`push origin ${CONFIG.git.branch}`)
    logger.success(`Push a ${CONFIG.git.branch} exitoso`)

    return true
  } catch (err) {
    logger.error('Error en git commit/push', err)
    return false
  }
}
