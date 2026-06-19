# PROJECT_CONTEXT.md — Mundial 2026

> Documento para agentes futuros (Claude, Codex, Cursor, etc.).
> Refleja el estado real del proyecto al 19 de junio de 2026.

---

## Visión general

**Objetivo:** Web del Mundial de Fútbol 2026 con resultados en vivo vía ESPN.
**Stack:** Next.js 16 (App Router) · TypeScript · CSS global (sin Tailwind)
**Deploy:** Vercel · Repo: `Juliancaba20/mundial2026`
**Producción:** `https://mundial2026-blond-pi.vercel.app/`

### Estructura de carpetas
```
app/
  page.tsx               — Home
  grupos/page.tsx         — Grilla de todos los grupos
  grupo/[letra]/page.tsx  — Grupo individual (A–L)
  equipo/[slug]/page.tsx  — Página de equipo (48 páginas SSG)
  partidos/page.tsx       — Todos los partidos fase de grupos
  eliminatorias/page.tsx  — Árbol de eliminatorias
  api/
    resultados/route.ts   — Proxy ESPN con caché 60s
    debug/route.ts        — Diagnóstico ESPN en producción
components/
  BracketView.tsx         — Árbol desktop + mobile
  LiveGroupStandings.tsx  — Tabla de grupo con resultados en vivo
  LiveTeamMatches.tsx     — Partidos de equipo con resultados en vivo
  MatchesClient.tsx       — Página /partidos con resultados en vivo
  MatchRow.tsx            — Fila de partido individual
lib/
  data.ts                 — BASE_MATCHES (72 partidos fase de grupos) + TEAMS
  espn.ts                 — fetchLiveResults(), applyResults(), normalización
  bracket.ts              — buildBracket(), propagateRound(), cruces FIFA
  thirdPlaceTable.ts      — Anexo C FIFA (mejores terceros)
types/index.ts            — Todos los tipos del proyecto
```

---

## Integración ESPN

### Endpoint
ESPN no tiene API pública oficial. Se usa scraping/proxy interno en:
`/api/resultados` → llama a la API privada de ESPN con fechas del torneo.

### Flujo completo
```
ESPN API
  → app/api/resultados/route.ts  (caché 60s en Vercel)
    → lib/espn.ts · fetchLiveResults()
      → normaliza equipos (NFD, aliases Bosnia/Türkiye, home/away invertido)
      → devuelve LiveResultsMap + KnockoutResultsMap
        → componentes client
          → applyResults(BASE_MATCHES, results)  ← aquí se aplican scores
            → buildBracket(updatedMatches, knockoutResults)  ← bracket
```

### `fetchLiveResults()`
Ubicación: `lib/espn.ts`. Itera `TOURNAMENT_DATES` (28 jun – 19 jul), fetcha cada fecha de ESPN, normaliza nombres con NFD Unicode y aliases, devuelve dos mapas:
- `LiveResultsMap`: `"slug_home_slug_away" → { homeScore, awayScore, status, clock }`
- `KnockoutResultsMap`: `"slug" → { round, opponent, homeScore, awayScore, status }`

### `applyResults()`
Ubicación: `lib/espn.ts`. Recorre `BASE_MATCHES`, busca cada partido en `LiveResultsMap` por clave `home.slug_away.slug`, también intenta la clave invertida (fallback home/away). Devuelve array de `Match` con `score`, `status` y `clock` actualizados.

### `/api/resultados`
Route Handler con `revalidate = 60`. Responde JSON:
```json
{ "results": LiveResultsMap, "knockoutResults": KnockoutResultsMap }
```

### `/api/debug`
Route Handler dinámico (`ƒ`). Muestra matchRate, partidos reconocidos/no reconocidos, raw ESPN. **Usar siempre en producción para diagnosticar ESPN** — el sandbox de desarrollo bloquea el dominio ESPN con 403.

### Verificar que ESPN funciona
1. Abrir `https://mundial2026-blond-pi.vercel.app/api/debug`
2. Pegar el JSON en el chat con el agente.
3. Confirmar `matchRate: 100%` y `status` reconocidos (`STATUS_FINAL`, `STATUS_IN_PROGRESS`, etc.).

---

## Sistema de grupos

### Datos base
`lib/data.ts` → `BASE_MATCHES`: 72 partidos (6 por grupo × 12 grupos A–L).
Cada equipo aparece exactamente 3 veces. Uzbekistán en Grupo K (no Eslovenia).

### Cálculo de posiciones
`LiveGroupStandings.tsx` calcula la tabla en el cliente tras aplicar resultados:
- Puntos (V=3, E=1, D=0)
- Diferencia de goles
- Goles a favor

### Desempates
Orden: puntos → diferencia de goles → goles a favor → enfrentamiento directo (no implementado aún — actualmente por orden de array).

### Clasificación
Top 2 de cada grupo + 8 mejores terceros → 32 equipos a 16avos.

---

## Mejores terceros (Anexo C FIFA)

### Archivo: `lib/thirdPlaceTable.ts`
Implementa la tabla oficial del Anexo C del reglamento FIFA 2026.
Determina cuáles de los 12 terceros clasifican y a qué cruces de R32 van.

### Restricción crítica
Los 8 mejores terceros se asignan a cruces específicos según la combinación de grupos que clasificaron. **No es orden de mérito libre** — FIFA pre-definió 126 combinaciones posibles. No modificar `thirdPlaceTable.ts` sin leer el Anexo C completo.

---

## Bracket FIFA

### Arquitectura
```
lib/bracket.ts
  buildBracket(matches, knockoutResults?)
    → classifyGroups(matches)     — top2 + mejores 3eros
    → thirdPlaceTable(thirds)     — Anexo C
    → R32_FIXTURES[0..15]        — 16 cruces oficiales con fechas reales
    → propagateRound(R32→R16)
    → propagateRound(R16→QF)
    → propagateRound(QF→SF)
    → propagateRound(SF→F)
    → extraerPerdedoresSF → 3RD
```

### Rondas y partidos
- **R32:** 16 partidos (73–88 del calendario FIFA), fixtures con fecha real del Anexo FIFA.
- **R16:** 8 partidos. IDs: R16-1..8.
- **QF:** 4 partidos. IDs: QF-1..4.
- **SF:** 2 partidos. IDs: SF-1 (mitad izquierda), SF-2 (mitad derecha).
- **F:** 1 partido. ID: F.
- **3RD:** 1 partido. ID: 3RD.

### Propagación de ganadores
`propagateRound()` lee `knockoutResults` (ESPN) o el ganador calculado del partido anterior. Escribe en `nextMatchId` + `nextPosition` ('home'|'away') del partido siguiente.

### `splitBracketHalves()` — en `BracketView.tsx`
Sigue la cadena `nextMatchId` de cada partido hasta SF-1 o SF-2 para asignar cada partido a la mitad izquierda o derecha del árbol visual. **No tocar** — resuelve el bug histórico de duplicación de ambos lados del bracket.

### Archivos involucrados
`lib/bracket.ts`, `lib/thirdPlaceTable.ts`, `components/BracketView.tsx`

---

## Flujo de resultados en vivo

### Componentes que consumen resultados

| Componente | Método | Polling |
|---|---|---|
| `LiveGroupStandings` | fetch `/api/resultados` en cliente | 60s |
| `LiveTeamMatches` | fetch `/api/resultados` en cliente | 60s |
| `MatchesClient` | fetch `/api/resultados` en cliente | 60s |
| `BracketView` | fetch `/api/resultados` en cliente | 60s |
| `app/grupos/page.tsx` | Server Component con revalidate 60s | No |

### Errores históricos y resoluciones

**Bug: Páginas /equipo/[slug] siempre en "pending"**
- Causa: Server Component estático renderizaba `BASE_MATCHES` sin ningún client island.
- Fix: Creado `LiveTeamMatches.tsx`, client component que fetchea `/api/resultados` al montar y pollea cada 60s.

**Bug: Ambos lados del bracket mostraban los mismos 16 partidos**
- Causa: `BracketDesktop` filtraba `bracket.filter(m => m.round === round)` para ambos lados sin dividir.
- Fix: `splitBracketHalves()` en `BracketView.tsx` usando cadena `nextMatchId`.

**Bug: Conectores del bracket desalineados**
- Causa: `justify-content: space-around` producía centros verticales incorrectos para los codos CSS.
- Fix: Posicionamiento absoluto con `top = slotHeight * i + slotHeight / 2`, reemplazando space-around.

**Bug: Conector SF→Final apuntaba al lugar incorrecto**
- Causa: El SVG de codo calculaba `V0`/`V704` dentro de la columna SF, pero la Final no está en esa columna.
- Fix: `br-sf-connector` — línea horizontal CSS simple en vez de codo SVG. La Final se posiciona en `top: treeHeight/2` absoluto dentro de `br-final-col`.

**ESPN devuelve 403 en sandbox de desarrollo**
- Causa: El proxy de red del entorno Claude/Anthropic bloquea el dominio ESPN.
- Fix: Toda verificación ESPN debe hacerse vía `/api/debug` en producción Vercel. El agente no puede verificar ESPN directamente.

**`next/font` falla en sandbox**
- Causa: El entorno sandbox no puede resolver fuentes de Google en build time.
- Fix: Fuentes cargadas via `<link>` en `layout.tsx`, no via `next/font`.

### Diagnóstico rápido
1. `/api/debug` en producción → ver `matchRate` y `unrecognized`.
2. Si `matchRate < 100%`: revisar aliases en `lib/espn.ts` (normalización NFD, `TEAM_ALIASES`).
3. Si resultados no aparecen en UI: verificar que el componente usa `applyResults()` y no `BASE_MATCHES` directo.
4. Si bracket no propaga ganadores: revisar `knockoutResults` en la respuesta de `/api/resultados`.

---

## Checklist obligatorio antes de cualquier deploy

```
□ npm run build           — debe terminar sin errores
□ npx tsc --noEmit        — cero errores de tipos
□ /api/debug en Vercel    — matchRate 100%, no unrecognized
□ /grupos                 — tabla de posiciones con resultados reales
□ /eliminatorias          — bracket renderiza sin duplicados, conectores alineados
□ /partidos               — resultados aparecen, polling activo
□ /equipo/[slug]          — al menos un equipo: resultados visibles, no "pending"
□ Mobile (/eliminatorias) — tabs de ronda funcionan, BracketMobile intacto
```

---

## Archivos críticos — no modificar sin leer antes

| Archivo | Por qué es crítico |
|---|---|
| `lib/bracket.ts` | Cruces FIFA, propagación de ganadores, Anexo C. Tocar sin conocer el Anexo C rompe los 16 cruces oficiales. |
| `lib/thirdPlaceTable.ts` | 126 combinaciones del Anexo C. Cualquier cambio puede alterar a qué cruce va cada tercer clasificado. |
| `lib/espn.ts` | Normalización, aliases, fallback home/away. Cambios pueden romper el match rate. |
| `lib/data.ts` | BASE_MATCHES es la fuente de verdad de los 72 partidos de grupos. 48 equipos × 3 partidos exactos. |
| `types/index.ts` | Tipos compartidos por todo el proyecto. Cambios en cascada. |
| `components/BracketView.tsx` → `splitBracketHalves()` | Sin esta función ambos lados del bracket se duplican. |
| `app/globals.css` → variables CSS raíz | Cambian todo el sistema de color/tipografía. |

---

## Guía para futuros agentes

### Antes de cualquier cambio importante

1. **Leer este archivo completo.**
2. **Identificar si el cambio toca algún archivo crítico** de la tabla anterior.
3. **Correr `npm run build` y `npx tsc --noEmit`** — si ya fallan antes de tu cambio, documentarlo.
4. **Para bugs de resultados ESPN:** pedir al usuario el JSON de `/api/debug` en producción. No intentar verificar ESPN desde el sandbox — siempre da 403.
5. **Para bugs del bracket:** no tocar `lib/bracket.ts`. El árbol visual está en `BracketView.tsx`. La lógica de cruces y propagación está correcta y validada.

### Regla de eficiencia (definida por el propietario)

Auditoría extensa solo si el cambio afecta: APIs, ESPN, clasificación, cálculo de grupos, mejores terceros, bracket FIFA, o persistencia de datos.

Para cambios visuales/CSS/UX: identificar archivos → plan en <10 líneas → implementar → validar build.

### Qué está pendiente (al 19 jun 2026)

- La fase de grupos aún no terminó. Los slots de R32 muestran placeholders ("Ganador Grupo A") hasta que ESPN devuelva clasificados reales — esto es comportamiento correcto, no un bug.
- Desempate por enfrentamiento directo no implementado en la tabla de grupos.
- `knockoutResults` solo guarda el último resultado por equipo — si un equipo juega varias rondas, las anteriores se pierden. Diseño intencional por ahora.

