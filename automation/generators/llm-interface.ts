// automation/generators/llm-interface.ts
// ─── Interfaz común para proveedores LLM ─────────────────────────────────────
// Cambiar de proveedor = cambiar CONFIG.llm.provider
// El resto del sistema no sabe qué LLM está usando.

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  maxTokens: number
  temperature: number
}

export interface LLMProvider {
  name: string
  complete(messages: LLMMessage[], opts: LLMOptions): Promise<string>
}
