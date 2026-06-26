# Sistema de Auto-publicación de Noticias — Mundial 2026

Sistema completamente automático que publica noticias del Mundial 2026 todos los días a las 08:00 AM (Argentina) sin ninguna intervención manual.

**Costo total: $0**

---

## Arquitectura

```
automation/
├── config.ts                   ← Toda la configuración centralizada
├── scheduler.ts                ← Orquestador principal
├── package.json                ← Dependencias propias (no afecta el proyecto Next.js)
├── tsconfig.json
├── fetch/
│   └── index.ts                ← Obtiene noticias desde RSS feeds
├── ranking/
│   └── index.ts                ← Puntúa y selecciona las mejores noticias
├── generators/
│   ├── llm-interface.ts        ← Interfaz común para proveedores LLM
│   ├── groq-provider.ts        ← Implementaciones: Groq + Gemini
│   └── article-generator.ts   ← Redacta artículos usando el LLM
├── markdown/
│   └── index.ts                ← Escribe index.md + metadata.json
├── images/
│   ├── image-interface.ts      ← Interfaz común para proveedores de imagen
│   ├── pollinations-provider.ts ← Implementación Pollinations.ai
│   └── index.ts                ← Orquestador de generación de imágenes
├── git/
│   └── index.ts                ← git add, commit, push
├── state/
│   ├── index.ts                ← Registro de slugs publicados
│   └── published.json          ← Estado persistente (se commitea al repo)
└── logger/
    └── index.ts                ← Logs con colores y timestamps
```

---

## Setup inicial (una sola vez)

### 1. Crear cuenta en Groq

1. Ir a [console.groq.com](https://console.groq.com)
2. Crear cuenta gratuita
3. Ir a **API Keys** → **Create API Key**
4. Copiar la key

### 2. Agregar la key como Secret en GitHub

1. En el repo de GitHub: **Settings** → **Secrets and variables** → **Actions**
2. Clic en **New repository secret**
3. Nombre: `GROQ_API_KEY`
4. Valor: la key de Groq
5. Guardar

### 3. Hacer push de los archivos

```bash
git add .
git commit -m "feat: sistema auto-publicación noticias"
git push
```

Listo. El sistema se ejecuta automáticamente todos los días a las 08:00 AM Argentina.

---

## Ejecución manual

### Desde GitHub (sin instalar nada local)

1. Ir a **Actions** → **Auto-publicar noticias Mundial 2026**
2. Clic en **Run workflow**

### Desde local (opcional)

```bash
cd automation
npm install
GROQ_API_KEY=tu_key npx tsx scheduler.ts
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GROQ_API_KEY` | ✅ Sí | API key de Groq (gratuito) |
| `GEMINI_API_KEY` | No | Solo si se cambia el provider a Gemini |

---

## Configuración

Toda la configuración vive en **`automation/config.ts`**. Los valores más comunes a modificar:

```typescript
// Cantidad de noticias
minArticles: 1,     // si hay menos noticias relevantes, no publicar
maxArticles: 5,     // máximo por ejecución

// Cuántas se marcan como "destacadas" en la home
featuredCount: 2,

// Proveedor LLM: 'groq' | 'gemini'
llm: { provider: 'groq' }

// Proveedor de imágenes: 'pollinations'
images: { provider: 'pollinations' }
```

### Cambiar el horario

Editar `.github/workflows/auto-news.yml`:

```yaml
- cron: '0 11 * * *'   # 11:00 UTC = 08:00 AM Argentina
- cron: '0 14 * * *'   # 14:00 UTC = 11:00 AM Argentina
```

---

## Agregar nuevas fuentes RSS

En `automation/config.ts`, agregar a `rssFeeds`:

```typescript
{
  name: 'Olé',
  url: 'https://www.ole.com.ar/rss/futbol/',
  weight: 1.3,  // mayor = más prioridad en el ranking
},
```

No se necesita modificar ningún otro archivo.

---

## Cambiar el proveedor LLM

### Usar Gemini en lugar de Groq

1. En `automation/config.ts`:
   ```typescript
   llm: { provider: 'gemini' }
   ```
2. En GitHub Secrets, agregar `GEMINI_API_KEY`
3. En `.github/workflows/auto-news.yml`, descomentar:
   ```yaml
   GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
   ```

### Agregar un provider nuevo

1. Crear `automation/generators/mi-provider.ts` implementando la interfaz `LLMProvider`
2. Agregar el caso en `createLLMProvider()` dentro de `groq-provider.ts`
3. Cambiar `CONFIG.llm.provider` en `config.ts`

---

## Cambiar el proveedor de imágenes

1. Crear `automation/images/mi-proveedor.ts` implementando la interfaz `ImageProvider`
2. Agregar el caso en `createImageProvider()` dentro de `images/index.ts`
3. Cambiar `CONFIG.images.provider` en `config.ts`

---

## Deduplicación (3 capas)

1. **`automation/state/published.json`** — registro persistente de slugs publicados. Se commitea al repo con cada publicación.
2. **Verificación de carpeta en disco** — antes de escribir, verifica que `content/noticias/<slug>/` no exista.
3. **Slug determinista** — el mismo evento siempre genera el mismo slug, causando una colisión que se detecta en la capa 1 o 2.

---

## Manejo de errores

| Fallo | Comportamiento |
|---|---|
| Una fuente RSS falla | Continúa con las demás fuentes |
| Todas las fuentes RSS fallan | Aborta sin commit |
| LLM falla en un artículo | Continúa con los siguientes |
| Imagen falla | Publica la noticia con emoji fallback |
| No hay noticias relevantes | Aborta sin commit (no publica basura) |
| Todos los artículos fallan | Aborta sin commit, GitHub notifica por email |

El sitio **nunca queda roto** porque si algo falla, no hay commit.

---

## Auditoría de contenido

Cada noticia genera un archivo `content/noticias/<slug>/metadata.json`:

```json
{
  "generatedAt": "2026-06-26T11:05:23.000Z",
  "sources": [
    {
      "title": "España golea a Arabia Saudita",
      "url": "https://www.marca.com/...",
      "sourceName": "Marca",
      "pubDate": "2026-06-26T09:30:00Z",
      "score": 47
    }
  ]
}
```

Este archivo **no es visible en la web** (Next.js no lo expone como ruta) pero sirve para verificar el origen de cada noticia.

---

## Reutilización para otros sitios de noticias

El sistema está desacoplado por diseño. Para adaptarlo a otro proyecto:

1. Copiar la carpeta `automation/` al nuevo proyecto
2. En `automation/config.ts`:
   - Cambiar `topic`, `categories`, `teamSlugs`, `rssFeeds`, `contentDir`, `publicDir`
3. Copiar `.github/workflows/auto-news.yml`
4. Configurar el Secret `GROQ_API_KEY` en GitHub
5. Listo

No hay ninguna dependencia hard-coded al Mundial 2026 más allá de `config.ts`.

---

## Pausar el sistema

Ir a GitHub → **Actions** → **Auto-publicar noticias Mundial 2026** → **...** → **Disable workflow**.

Un click. No se modifica ningún archivo.

---

## Logs de ejemplo

```
──────────────────────────────────────────────────
  Auto-publicación Mundial 2026 — 2026-06-27
──────────────────────────────────────────────────

[11:00:01.234] ℹ  Fetching RSS: FIFA
[11:00:02.891] ✔  FIFA: 3 artículos del Mundial
[11:00:02.892] ℹ  Fetching RSS: ESPN Deportes
[11:00:04.102] ✔  ESPN Deportes: 5 artículos del Mundial
[11:00:04.103] ℹ  Fetching RSS: Marca
[11:00:05.445] ✔  Marca: 4 artículos del Mundial
[11:00:05.446] ℹ  Total artículos únicos del Mundial: 11

[11:00:05.447] ℹ  Artículos viables (score ≥ 5): 8
[11:00:05.448] ℹ  Seleccionados para publicar: 5
[11:00:05.449] ℹ    [52 pts] Marca: Argentina clasifica a cuartos...
[11:00:05.450] ℹ    [48 pts] ESPN: Brasil golea y avanza invicto...

[11:00:06.100] ℹ  Redactando con Groq (Llama 3.3 70B): "Argentina clasifica..."
[11:00:08.234] ✔  Artículo generado: argentina-clasifica-cuartos-2026
[11:00:08.235] ℹ  Imagen — prompt: "FIFA World Cup 2026 stadium..."
[11:00:21.891] ✔  Imagen guardada: public/noticias/argentina-clasifica-cuartos-2026/cover.webp
[11:00:21.892] ✔  Escrito: content/noticias/argentina-clasifica-cuartos-2026/index.md

══════════════════════════════════════════════════
  RESUMEN
  Publicadas : 5/5
══════════════════════════════════════════════════
```
