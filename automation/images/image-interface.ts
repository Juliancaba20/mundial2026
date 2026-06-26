// automation/images/image-interface.ts
// ─── Interfaz común para proveedores de imágenes ─────────────────────────────

export interface ImageProvider {
  name: string
  /** Retorna buffer de imagen o null si falla */
  generate(prompt: string, width: number, height: number): Promise<Buffer | null>
}
