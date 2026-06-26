// automation/images/pollinations-provider.ts
// ─── Implementación Pollinations.ai (gratuito, sin API key) ──────────────────

import type { ImageProvider } from './image-interface.ts'
import { logger } from '../logger/index.ts'

export class PollinationsProvider implements ImageProvider {
  name = 'Pollinations.ai'

  async generate(prompt: string, width: number, height: number): Promise<Buffer | null> {
    const encoded = encodeURIComponent(prompt)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logger.info(`Generando imagen (intento ${attempt}/3)...`)

        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 45_000) // 45s timeout — generación puede tardar

        const res = await fetch(url, { signal: ctrl.signal })
        clearTimeout(timer)

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const contentType = res.headers.get('content-type') ?? ''
        if (!contentType.includes('image')) {
          throw new Error(`Respuesta no es imagen: ${contentType}`)
        }

        const arrayBuffer = await res.arrayBuffer()
        return Buffer.from(arrayBuffer)
      } catch (err) {
        logger.warn(`Pollinations intento ${attempt} falló: ${(err as Error).message}`)
        if (attempt < 3) await sleep(3000 * attempt)
      }
    }

    logger.warn('Generación de imagen falló. Se usará emoji como fallback.')
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
