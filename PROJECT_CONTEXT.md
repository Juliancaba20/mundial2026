# PROJECT_CONTEXT.md — Mundial 2026

> Documento de referencia para cualquier agente (Claude, Codex, Cursor, etc.) que trabaje en este proyecto.
> Basado en el código real y en las decisiones tomadas durante el desarrollo.
> **Leer antes de hacer cualquier cambio.**

---

## Visión general

**Objetivo:** Sitio web completo de seguimiento del Mundial 2026 (FIFA World Cup 2026) con resultados en vivo, tabla de posiciones, fixture completo, bracket de eliminatorias y páginas individuales por equipo.

**Tecnologías:**
- Next.js (App Router, versión 15+) + TypeScript
- CSS custom (sin Tailwind ni CSS Modules generales — todo en `app/globals.css`)
- Vercel (deploy automático desde GitHub)
- ESPN Public API (datos de resultados en vivo)
- flagcdn.com (imágenes de banderas)

**Estructura de directorios:**
```
app/
  page.tsx              — Homepage con hero, countdown, partidos destacados
  globals.css           — TODO el CSS del proyecto (un solo archivo)
  layout.tsx            — Layout raíz (incluye Topbar)
  grupos/page.tsx       — Grid de los 12 grupos con tablas de posiciones
  grupo/[letra]/page.tsx — Página individual de grupo (standings + partidos)
  partidos/page.tsx     — Fixture completo con agrupación por fecha
  eliminatorias/page.tsx — Bracket visual de fase eliminatoria
  equipo/[slug]/page.tsx — Página individual de equipo
  api/resultados/route.ts — Endpoint que expone resultados ESPN al cliente
  api/debug/route.ts    — Endpoint de diagnóstico ESPN

components/
  Topbar.tsx            — Header con navegación
  Countdown.tsx         — Cuenta regresiva con detección de fase del torneo
  StandingsTable.tsx    — Tabla de posiciones con colores por posición
  LiveGroupStandings.tsx — Tabla de posiciones con polling en vivo (client)
  BracketView.tsx       — Visualización del bracket de eliminatorias
  MatchRow.tsx          — Fila de partido individual
  MatchesClient.tsx     — FeaturedMatchesClient + MatchStripClient (polling)
  LiveTeamMatches.tsx   — Partidos de equipo individual con polling
  TeamFlag.tsx          — Bandera de equipo vía flagcdn.com

lib/
  data.ts               — FUENTE DE VERDAD: equipos, grupos, partidos base, noticias
  espn.ts               — Integración ESPN: fetch, normalización, applyResults
  standings.ts          — Cálculo de posiciones con criterios FIFA
  bracket.ts            — Constructor del bracket de eliminatorias
  thirdPlaceTable.ts    — 495 combinaciones del Anexo C FIFA

types/
  index.ts              — Todos los tipos TypeScript del proyecto
```

---

## Integración ESPN

### Endpoint utilizado
```
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
```
Se consultan todas las fechas del torneo: 11 jun – 19 jul 2026, en paralelo.

### Flujo completo ESPN → render

```
ESPN API (39 fechas en paralelo)
  ↓
fetchLiveResults()        [lib/espn.ts] — server-side, ISR 60s
  ↓
LiveResultsMap            {key: "slug_home_slug_away" → {homeScore, awayScore, status, clock}}
  ↓
applyResults()            [lib/espn.ts] — fusiona resultados con BASE_MATCHES
  ↓
Match[] con score/status actualizados
  ↓
Server Components         (grupos/page.tsx, partidos/page.tsx, etc.)
  ↓
Client Components con polling   (LiveGroupStandings, MatchesClient, LiveTeamMatches)
  └→ /api/resultados cada 60s → mismo flujo, actualización sin reload
```

### fetchLiveResults()
```typescript
// lib/espn.ts
export async function fetchLiveResults(): Promise<{
  results: LiveResultsMap;
  knockoutResults: KnockoutResultsMap;
}>
```
- Hace fetch en paralelo de las 39 fechas del torneo
- Normaliza nombres de equipos con NFD (no ASCII stripping)
- Usa ESPN_ALIASES para variantes de escritura (southafrica→sudafrica, etc.)
- Detecta inversión home/away de ESPN y aplica score invertido si es necesario
- Retorna `LiveResultsMap` (grupos) y `KnockoutResultsMap` (eliminatorias, por slug de equipo)

### applyResults()
```typescript
// lib/espn.ts
export function applyResults(matches: Match[], results: LiveResultsMap): Match[]
```
- Fusiona BASE_MATCHES con los resultados ESPN
- La clave del mapa es `${home.slug}_${away.slug}`
- No muta el array original

### /api/resultados
- Llama a `fetchLiveResults()` y retorna el JSON completo
- Consumido por todos los componentes cliente cada 60 segundos
- Cache: `no-store` (siempre fresco)

### /api/debug
- Expone el procesamiento completo: qué recibió ESPN, qué se mapeó, qué falló
- Usar para diagnosticar cuando los resultados no aparecen
- Ejemplo de uso: pegar el output en el chat para diagnóstico colaborativo

### Cómo verificar que ESPN funciona
1. Abrir `/api/debug` en producción
2. Verificar que `matched` contenga partidos con score real
3. Si `unmatched` tiene partidos inesperados → revisar ESPN_ALIASES
4. Si no hay datos → verificar que las fechas en TOURNAMENT_DATES cubren el partido buscado

---

## Sistema de grupos

### Estructura
- 12 grupos (A-L), 4 equipos cada uno, 6 partidos por grupo
- Clasifican: 1° y 2° de cada grupo (24 equipos) + 8 mejores terceros = 32 equipos totales

### Cálculo de posiciones — calculateStandings()
```typescript
// lib/standings.ts
export function calculateStandings(groupLetter: string, matches: Match[]): TeamStanding[]
```

**Criterios FIFA en orden (Art. 32 del Reglamento):**
1. Puntos (G×3 + E×1)
2. Diferencia de goles global
3. Goles a favor global
4. Puntos en enfrentamiento directo
5. DG en enfrentamiento directo
6. GF en enfrentamiento directo
7. Fair play (tarjetas) — **NO implementado** (ESPN no provee datos)
8. Sorteo FIFA — **NO implementable**

**Nota importante:** El desempate por enfrentamiento directo está implementado solo para 2 equipos. Para 3+ equipos empatados, cae al orden del array (no FIFA-correcto). Es una limitación conocida y no crítica para el display general.

### Estado qualified
`TeamStanding.qualified = true` solo para i < 2 (top 2 por grupo).
Los terceros clasificados se calculan separadamente en `bracket.ts` via `getBestThirds()`.

---

## Mejores terceros

### getBestThirds()
```typescript
// lib/bracket.ts
export function getBestThirds(matches: Match[]): Array<{ group: string; team: TeamRef | null }>
```
- Calcula el 3° de cada uno de los 12 grupos
- Los ordena por pts → dg → gf para determinar los 8 mejores
- Retorna array de 12 items ordenado (los primeros 8 son los que clasifican)

### thirdPlaceTable.ts — Anexo C FIFA
- Contiene las **495 combinaciones posibles** de 8 grupos (elegidos de 12) que aportan terceros clasificados
- Cada combinación mapea qué tercero enfrenta a qué ganador de grupo en R32
- Los ganadores de grupo que reciben terceros son: A, B, D, E, G, I, K, L
- **RESTRICCIÓN CRÍTICA:** No modificar esta tabla. Fue construida manualmente desde el Reglamento FIFA 2026, Anexo C. Un error en ella rompe todo el bracket.

### resolveThirdPlaceMatchups()
- Busca en THIRD_PLACE_TABLE la fila exacta que coincide con los grupos clasificados
- Solo funciona cuando hay 8 terceros con equipo real (todos los grupos completaron 3 jornadas)

---

## Bracket FIFA

### Estructura de rondas
```
R32 (16avos)  → partidos 73–88  — Anexo C para terceros
R16 (8avos)   → partidos 89–96
QF  (cuartos) → partidos 97–100
SF  (semis)   → partidos 101–102
F   (final)   → partido 103
3P  (3er puesto) → partido 104
```

### buildBracket()
```typescript
// lib/bracket.ts
export function buildBracket(matches: Match[], knockoutResults: KnockoutResultsMap): BracketMatch[]
```
- Construye todos los cruces del bracket usando las reglas oficiales FIFA
- Emparejamientos R32: asimétricas según el reglamento (no simples 1°vs3°)
- Propaga ganadores: R32→R16→QF→SF→Final
- Si un partido no ha terminado, el slot del siguiente queda vacío (null)

### BracketView.tsx
- **Layout vertical único** — sin scroll horizontal, funciona igual en desktop, tablet y mobile
- `BracketVerticalWithRefs` renderiza cada ronda como sección apilada verticalmente
- `ROUND_COLS`: R32/R16/QF/SF → 2 columnas; F/3RD → 1 columna centrada
- `ROUND_SCALE`: escala progresiva de cards (sm → xl) por ronda
- Auto-scroll vertical a la ronda activa más avanzada usando `scrollIntoView`
- Grid CSS responsive: colapsa a 1 columna en pantallas < 560px
- Final con protagonismo visual especial (borde dorado, ícono 🏆, card xl centrada)
- Tercer Puesto como sección independiente debajo de la Final

### KnockoutResultsMap
```typescript
// types/index.ts
KnockoutResultsMap = Record<string, { opponent: string; homeScore: number; awayScore: number; status: string }>
```
- Clave: slug del equipo
- Valor: resultado del partido más reciente de ese equipo en eliminatorias
- **Limitación:** Solo guarda el último partido — no permite reconstrucción histórica por ronda
- Correcto para uso en vivo (siempre muestra el estado actual)

### Archivos involucrados
- `lib/bracket.ts` — lógica principal
- `lib/thirdPlaceTable.ts` — tabla Anexo C (NO TOCAR sin leer el Reglamento FIFA)
- `components/BracketView.tsx` — visualización
- `app/eliminatorias/page.tsx` — página que llama buildBracket()

---

## Flujo de resultados en vivo

### Componentes que consumen resultados
| Componente | Datos consumidos | Polling |
|---|---|---|
| LiveGroupStandings | grupos del grupo X | /api/resultados cada 60s |
| LiveTeamMatches | partidos del equipo Y | /api/resultados cada 60s |
| FeaturedMatchesClient | partidos destacados del home | /api/resultados cada 60s |
| MatchStripClient | strip horizontal del home | /api/resultados cada 60s |
| grupos/page.tsx | todos los grupos | Server, ISR 60s |
| eliminatorias/page.tsx | bracket completo | Server, ISR 60s |

### Errores históricos y cómo se resolvieron

**1. STATUS_FINAL vs STATUS_FULL_TIME**
- **Problema:** Partidos que ESPN marcaba como finalizados no cambiaban de estado en la web
- **Causa:** El código solo verificaba `STATUS_FINAL`; ESPN usa `STATUS_FULL_TIME` para este torneo
- **Solución:** `DONE_STATUSES` ahora incluye ambos. Ver `lib/espn.ts`

**2. Normalización de nombres con acentos**
- **Problema:** Equipos como México, Türkiye, Côte d'Ivoire no matcheaban con ESPN
- **Causa:** Se usaba `.replace(/[^\w]/g, '')` que no maneja NFD correctamente
- **Solución:** Usar `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` antes del toLowerCase

**3. ESPN invierte home/away en ciertos partidos**
- **Problema:** Score aparecía invertido para algunos partidos
- **Causa:** ESPN reporta el orden local (sede) que a veces invierte home/away respecto a nuestros datos
- **Solución:** Si no matchea por `home_away`, intentar `away_home` e invertir el score

**4. Date/timezone bug en /partidos**
- **Problema:** Los separadores de fecha mostraban "Miércoles 11 jun" pero los partidos debajo eran del 12
- **Causa:** `getLocalDateLabel()` se llamaba server-side en UTC
- **Solución:** Mover a cliente (`MatchesClient.tsx`) para usar la timezone del usuario

**5. Alias ESPN_ALIASES**
- **Problema:** Países como Bosnia-Herzegovina, Uzbekistán, Turkiye no matcheaban
- **Causa:** ESPN usa nombres que difieren de los slugs del proyecto
- **Solución:** Tabla explícita `ESPN_ALIASES` en `lib/espn.ts`. Mantener actualizada.

**6. Uzbekistán reemplaza Eslovenia en Grupo K**
- **Solución aplicada:** Datos corregidos en `lib/data.ts`. ESPN_ALIASES incluye `uzbekistan`.

### Cómo diagnosticar rápidamente
1. Abrir `/api/debug` en producción
2. Ver `matched` para confirmar qué partidos se procesaron
3. Ver `unmatched` para encontrar qué no pudo matchearse
4. Agregar el alias faltante en `ESPN_ALIASES` si el nombre difiere
5. Verificar `TOURNAMENT_DATES` si el partido es de una fecha no cubierta

---

## Arquitectura de datos

### Fuente de verdad única
**`lib/data.ts`** es el único lugar donde se definen datos estáticos:
- `TEAMS` — array de todos los equipos con slug, nombre, flagCode, etc.
- `TEAMS_BY_SLUG` — map slug → Team para acceso O(1)
- `GROUPS` — definición de los 12 grupos
- `BASE_MATCHES` — los 104 partidos del torneo con kickoffs
- `NEWS`, `FEATURED_TEAM_SLUGS` — contenido editorial

### kickoff como fuente temporal única
```typescript
interface RawMatch {
  id: string
  kickoff: string  // ISO 8601 UTC — ÚNICA fuente de verdad temporal
  // ... resto de campos
}
```
`date` y `dateSort` se derivan de `kickoff` vía `deriveDateFields()`.
**Nunca setear `date` manualmente** — siempre editar `kickoff`.

### TeamFlag.tsx
- Usa `flagcdn.com/h{height*2}/{code}.png` para banderas
- Fallback a rectángulo placeholder si la imagen falla
- `code` viene del campo `flagCode` en cada equipo (ISO 3166-1 alpha-2)

---

## Checklist obligatorio antes de cualquier deploy

```bash
# 1. TypeScript sin errores
npx tsc --noEmit

# 2. Build exitoso
npm run build

# 3. En producción, verificar:
# - /api/debug → revisar matched/unmatched
# - /grupos → todas las tablas cargan con colores correctos
# - /grupo/a → LiveGroupStandings hace polling y muestra resultados
# - /eliminatorias → bracket se renderiza correctamente
# - /partidos → fechas agrupadas correctamente en timezone local
# - Homepage → countdown muestra la fase correcta del torneo
```

---

## Archivos críticos — NO modificar sin leer completamente

| Archivo | Por qué es crítico |
|---|---|
| `lib/thirdPlaceTable.ts` | 495 combinaciones FIFA Anexo C. Un error rompe todos los cruces de R32 |
| `lib/espn.ts` | ESPN_ALIASES y normalización. Cambios pueden romper matching de equipos |
| `lib/data.ts` | Fuente de verdad. Slugs deben ser consistentes en todo el proyecto |
| `lib/standings.ts` | Criterios FIFA. Los desempates afectan clasificación real |
| `lib/bracket.ts` | Lógica de cruces oficial. Los emparejamientos R32 son exactos según FIFA |
| `types/index.ts` | Cambios aquí requieren actualizar todos los consumidores |
| `app/globals.css` | Todo el CSS en un archivo. Cambios de nombres de clase rompen componentes |

---

## Lecciones aprendidas

1. **ESPN_ALIASES es frágil:** Cada edición del torneo puede cambiar los nombres. Siempre validar con `/api/debug` después de agregar equipos.

2. **No usar ASCII stripping para normalización:** `.normalize('NFD')` es la única forma correcta de manejar diacríticos en JavaScript.

3. **ISR de Next.js y datos en vivo:** Con `revalidate = 60`, el server component puede servir datos con hasta 60s de retraso. Los client components con polling complementan esto para "near real-time".

4. **El bracket depende de que todos los grupos terminen:** `resolveThirdPlaceMatchups()` retorna nulls hasta que los 12 grupos completan las 3 jornadas. El bracket muestra slots vacíos hasta ese momento — comportamiento correcto.

5. **Slugs son la identidad:** Nunca cambiar un slug sin actualizar ESPN_ALIASES, BASE_MATCHES, todas las referencias en el bracket y las URLs de páginas ya indexadas.

6. **`@/` aliases no funcionan fuera de Next.js:** Para testing con `npx tsx`, usar rutas relativas.

7. **overflow: hidden puede ocultar contenido visual:** Antes de reportar "no se ve X", verificar que no hay un contenedor con overflow hidden cortando el contenido.

---

## Guía para futuros agentes

### Antes de hacer cualquier cambio importante:

**1. Leer este archivo completo.**

**2. Verificar el estado actual del torneo:**
- Abrir `/api/debug` para ver qué datos llegan de ESPN
- Ver `/grupos` para confirmar que las tablas cargan
- Ver `/eliminatorias` para confirmar que el bracket está bien

**3. Identificar exactamente qué archivos tocar:**
- Cambio visual/CSS → solo `app/globals.css` y el componente afectado
- Nuevo resultado → verificar `ESPN_ALIASES` en `lib/espn.ts`
- Nuevo equipo o partido → solo `lib/data.ts`
- Cambio en lógica de clasificación → `lib/standings.ts` (con mucho cuidado)
- Cambio en bracket → `lib/bracket.ts` (entender primero el Reglamento FIFA)

**4. Nunca tocar sin necesidad:**
- `lib/thirdPlaceTable.ts`
- Los slugs existentes en `lib/data.ts`
- La lógica de normalización en `lib/espn.ts`

**5. Siempre validar:**
```bash
npx tsc --noEmit && npm run build
```

**6. El proyecto sigue el patrón:**
- Server Components fetchean y aplican resultados → pasan datos iniciales a Client Components
- Client Components hacen polling a `/api/resultados` cada 60s para actualizar
- No romper este flujo agregando fetches directos a ESPN desde el cliente (CORS)

**7. Cambios visuales:**
- Identificar archivos afectados
- Plan en menos de 10 líneas
- Implementar
- Validar build
- Sin auditorías extensas salvo que afecte APIs, integración, clasificación o bracket

---

*Última actualización: junio 2026*
*Repo: https://github.com/Juliancaba20/mundial2026*
*Producción: https://mundial2026-blond-pi.vercel.app*
