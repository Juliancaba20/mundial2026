// automation/generators/groq-provider.ts
// ─── Implementación Groq (Llama 3.3 70B) ─────────────────────────────────────

import type { LLMProvider, LLMMessage, LLMOptions } from './llm-interface.ts'
import { CONFIG } from '../config.ts'
import { logger } from '../logger/index.ts'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export class GroqProvider implements LLMProvider {
  name = 'Groq (Llama 3.3 70B)'

  async complete(messages: LLMMessage[], opts: LLMOptions): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY no configurada')

    for (let attempt = 1; attempt <= CONFIG.llm.retries; attempt++) {
      try {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: CONFIG.llm.model,
            messages,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature,
          }),
        })

        if (res.status === 429) {
          // Rate limit — esperar más
          const wait = attempt * 5000
          logger.warn(`Rate limit Groq. Esperando ${wait}ms...`)
          await sleep(wait)
          continue
        }

        if (!res.ok) {
          const body = await res.text()
          throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`)
        }

        const data = await res.json() as {
          choices: Array<{ message: { content: string } }>
        }
        return data.choices[0]?.message?.content?.trim() ?? ''
      } catch (err) {
        if (attempt === CONFIG.llm.retries) throw err
        logger.warn(`Groq reintento ${attempt}/${CONFIG.llm.retries}`)
        await sleep(CONFIG.llm.retryDelayMs * attempt)
      }
    }

    throw new Error('Groq: todos los reintentos fallaron')
  }
}

// ─── Gemini provider stub ─────────────────────────────────────────────────────
// Para activar: cambiar CONFIG.llm.provider a 'gemini' y setear GEMINI_API_KEY

export class GeminiProvider implements LLMProvider {
  name = 'Google Gemini Flash'

  async complete(messages: LLMMessage[], opts: LLMOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    // Convertir formato OpenAI → Gemini
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))

    const systemInstruction = messages.find(m => m.role === 'system')?.content

    const body: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: opts.maxTokens, temperature: opts.temperature },
    }
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
    }
    return data.candidates[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLLMProvider(): LLMProvider {
  switch (CONFIG.llm.provider) {
    case 'groq':    return new GroqProvider()
    case 'gemini':  return new GeminiProvider()
    default:        return new GroqProvider()
  }
}
