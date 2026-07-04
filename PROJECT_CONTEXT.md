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
- gray-matter + react-markdown + remark-gfm (contenido editorial en Markdown)

**Estructura de directorios:**
```
app/
  page.tsx              — Homepage con hero, countdown, partidos destacados, noticias
  globals.css           — TODO el CSS del proyecto (un solo archivo)
  layout.tsx            — Layout raíz (incluye Topbar)
  grupos/page.tsx       — Grid de los 12 grupos con tablas de posiciones
  grupo/[letra]/page.tsx — Página individual de grupo (standings + partidos)
  partidos/page.tsx     — Fixture completo con agrupación por fecha
  eliminatorias/page.tsx — Bracket visual de fase eliminatoria
  equipo/[slug]/page.tsx — Página individual de equipo
  noticias/page.tsx     — Índice de todas las noticias (orden por fecha desc)
  noticias/[slug]/page.tsx — Detalle de noticia individual (Markdown → HTML)
  api/resultados/route.ts — Endpoint que expone resultados ESPN al cliente
  api/debug/route.ts    — Endpoint de diagnóstico ESPN

components/
  Topbar.tsx            — Header con navegación (Inicio, Grupos, Partidos, Eliminatorias, Noticias)
  Countdown.tsx         — Cuenta regresiva con detección de fase del torneo
  NoticiaCard.tsx        — Card reutilizable de noticia (imagen o emoji fallback)
  StandingsTable.tsx    — Tabla de posiciones con colores por posición
  LiveGroupStandings.tsx — Tabla de posiciones con polling en vivo (client)
  BracketView.tsx       — Visualización del bracket de eliminatorias
  MatchRow.tsx          — Fila de partido individual
  MatchesClient.tsx     — FeaturedMatchesClient + MatchStripClient (polling)
  LiveTeamMatches.tsx   — Partidos de equipo individual con polling
  TeamFlag.tsx          — Bandera de equipo vía flagcdn.com

lib/
  data.ts               — FUENTE DE VERDAD: equipos, grupos, partidos base
  noticias.ts           — Lectura de noticias desde content/noticias/*.md (build-time)
  espn.ts               — Integración ESPN: fetch, normalización, applyResults
  standings.ts          — Cálculo de posiciones con criterios FIFA
  bracket.ts            — Constructor del bracket de eliminatorias
  thirdPlaceTable.ts    — 495 combinaciones del Anexo C FIFA

content/
  noticias/             — Contenido editorial (Markdown + frontmatter YAML)
    <slug>/index.md     — Un archivo por noticia (no se sirve como static)

public/
  noticias/<slug>/      — Imágenes de portada (cover.webp)
  flags/                — Banderas SVG de equipos

types/
  index.ts              — Todos los tipos TypeScript del proyecto

NOTICIAS.md             — Guía de autoría de noticias (paso a paso)

automation/              — Pipeline de auto-publicación de noticias (GitHub Actions, cron diario)
  config.ts              — Config central + ROOT_DIR (raíz real del repo, ver sección "Sistema de noticias automatizado")
  scheduler.ts            — Orquestador: fetch RSS → ranking → generación LLM → imagen → markdown → git push
  fetch/                 — Lectura de feeds RSS (FIFA, ESPN, Marca, AS, BBC Sport)
  ranking/                — Scoring de artículos candidatos
  generators/             — Generación de artículo vía Groq (Llama 3.3 70B)
  images/                 — Generación de cover.webp vía Pollinations.ai
  markdown/               — Escritura de content/noticias/<slug>/index.md
  git/                    — git add/commit/push automático
  state/                  — Registro de qué ya se publicó (dedupe)
  .github/workflows/auto-news.yml — cron diario 11:00 UTC (08:00 Argentina), working-directory: automation
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

**Importante — `/api/debug` solo testea el matching de fase de grupos (BASE_MATCHES,
pares fijos home/away). En eliminatorias NO hay par fijo — el matching real ocurre
por equipo individual vía `findOwnTeamBySlug()` dentro de `fetchLiveResults()`.
Por eso, durante eliminatorias, `/api/debug` va a marcar `NO_MATCH` en CASI TODOS
los partidos de knockout — eso es esperado y NO significa que el resultado en vivo
esté roto. Para diagnosticar eliminatorias hay que mirar los logs de `[ESPN]` en
Vercel (bucados por `knockoutMatched`), no la sección `matchResult` de `/api/debug`.**

`/api/debug` consulta el mismo rango de fechas que `TOURNAMENT_DATES` en `lib/espn.ts`
(11 jun – 19 jul). Si alguna vez se corta antes de tiempo, revisar que el array
`allDates` en `app/api/debug/route.ts` siga sincronizado con `TOURNAMENT_DATES`.

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
R32 (16avos)     → partidos 73–88  — Anexo C para terceros
R16 (8avos)      → partidos 89–96
QF  (cuartos)    → partidos 97–100
SF  (semis)      → partidos 101–102
3P  (3er puesto) → partido 103 (18 jul)
F   (final)      → partido 104 (19 jul)
```

### Tabla de referencia oficial del cuadro completo (verificada 4 jul 2026)
**No re-derivar esto a mano si hay que tocar `lib/bracket.ts` — copiar de acá.** Fuente:
numeración oficial de partidos (Yahoo Sports / FIFA), contrastada partido por partido contra
resultados reales de ESPN.

| R32 (id interno) | Cruce | Alimenta a | R16 (id interno) | Alimenta a | QF (id interno) | Alimenta a |
|---|---|---|---|---|---|---|
| R32-1 | 2°A vs 2°B | R16-1 home | R16-1 = M90 (Canadá/Marruecos) | QF-1 home | QF-1 = M97 | SF-1 home |
| R32-3 | 1°F vs 2°C | R16-1 away | | | | |
| R32-2 | 1°E vs 3° | R16-2 home | R16-2 = M89 (Paraguay/Francia) | QF-1 away | | |
| R32-5 | 1°I vs 3° | R16-2 away | | | | |
| R32-4 | 1°C vs 2°F | R16-3 home | R16-3 = M91 (Brasil/Noruega) | QF-3 home | QF-3 = M99 | SF-2 home |
| R32-6 | 2°E vs 2°I | R16-3 away | | | | |
| R32-7 | 1°A vs 3° | R16-4 home | R16-4 = M92 (México/Inglaterra) | QF-3 away | | |
| R32-8 | 1°L vs 3° | R16-4 away | | | | |
| R32-12 | 1°H vs 2°J | R16-5 home | R16-5 = M93 (España/Portugal) | QF-2 home | QF-2 = M98 | SF-1 away |
| R32-11 | 2°K vs 2°L | R16-5 away | | | | |
| R32-10 | 1°G vs 3° | R16-6 home | R16-6 = M94 (Bélgica/EE.UU.) | QF-2 away | | |
| R32-9 | 1°D vs 3° | R16-6 away | | | | |
| R32-16 | 2°D vs 2°G | R16-7 home | R16-7 = M95 (Egipto/Argentina) | QF-4 home | QF-4 = M100 | SF-2 away |
| R32-14 | 1°J vs 2°H | R16-7 away | | | | |
| R32-13 | 1°B vs 3° | R16-8 home | R16-8 = M96 (Suiza/Colombia) | QF-4 away | | |
| R32-15 | 1°K vs 3° | R16-8 away | | | | |

SF-1 (QF-1 home + QF-2 away) → Final home, 3RD home (si pierde)
SF-2 (QF-3 home + QF-4 away) → Final away, 3RD away (si pierde)

Este cruce R16→QF tuvo un bug real (corregido el 4 jul 2026, ver "Errores históricos" #10):
antes de la corrección, los R32 se agrupaban en pares consecutivos (R32-1+R32-2,
R32-3+R32-4, ...), lo cual NO refleja el cuadro real — el orden correcto es el de la tabla de
arriba. Si en el futuro un cruce se ve raro, comparar primero contra esta tabla antes de
volver a buscar fuentes oficiales desde cero.

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

## Sistema de noticias automatizado (`automation/`)

### Objetivo
Publicar noticias en `content/noticias/` automáticamente, sin intervención manual, vía un
cron diario de GitHub Actions. Stack 100% gratuito: RSS (fuentes) → Groq (redacción) →
Pollinations.ai (imagen de portada) → commit + push a `main` → Vercel redeploya solo.

### Flujo (`scheduler.ts`)
```
GitHub Actions cron (11:00 UTC / 08:00 Argentina, .github/workflows/auto-news.yml)
  ↓ (working-directory: automation)
scheduler.ts
  ↓
fetch/        — lee los 5 feeds RSS (FIFA, ESPN, Marca, AS, BBC Sport)
  ↓
ranking/      — score de cada artículo candidato (weight de la fuente + señales)
  ↓
state/        — descarta candidatos ya publicados (published.json + carpeta en disco)
  ↓
generators/   — Groq (Llama 3.3 70B) redacta el artículo en español, anti-alucinación
  ↓
images/       — Pollinations.ai genera cover.webp (fallback a emoji si falla)
  ↓
markdown/     — escribe content/noticias/<slug>/index.md + metadata.json
  ↓
git/          — git add + commit + push a main
  ↓
Vercel detecta el push → redeploy automático → noticia visible en /noticias
```

### ⚠️ Bug crítico ya resuelto — resolución de rutas por `process.cwd()` (4 jul 2026)

**Síntoma reportado:** "las noticias se crean pero no en la ubicación donde deberían estar,
lo que hace que nunca se vean en la web" y "las noticias automáticas no se están publicando".

**Causa raíz:** `.github/workflows/auto-news.yml` corre `npx tsx scheduler.ts` con
`working-directory: automation`. Eso significa que durante la ejecución real,
`process.cwd()` es la carpeta `automation/`, **no la raíz del repo**. Pero
`CONFIG.contentDir`, `CONFIG.publicDir` y `CONFIG.stateFile` en `automation/config.ts` están
escritos como rutas **relativas a la raíz del proyecto** (`content/noticias`,
`public/noticias`, `automation/state/published.json`).

Los módulos que resolvían esas rutas con `path.resolve(process.cwd(), CONFIG.xxx)`
(`markdown/index.ts`, `images/index.ts`, `state/index.ts`) terminaban escribiendo un nivel
de más adentro: `automation/content/noticias/<slug>/` en vez de `content/noticias/<slug>/`
(que es lo único que lee `lib/noticias.ts` en build time). El estado de publicados también
se escribía en `automation/automation/state/published.json` (doble `automation/`).

Además, `git/index.ts` corría `git add content/noticias/ public/noticias/
automation/state/published.json` con cwd = `automation/`, así que el pathspec del
`stateFile` apuntaba a una ruta inexistente (`automation/automation/state/published.json`).
`git add` fallaba, `execSync` tiraba una excepción, el `catch` de `commitAndPush()` la
atrapaba y solo logueaba el error — **nunca se hacía commit ni push**, aunque el artículo sí
se había generado (en la carpeta equivocada).

Evidencia encontrada en el proyecto: 3 artículos reales generados el 27 jun 2026
(`espana-juega-prime-time`, `empate-entre-egipto-y-iran`, `uruguay-eliminado-mundial`)
atrapados en `automation/content/noticias/` y `automation/public/noticias/`, con su estado
en `automation/automation/state/published.json` — nunca llegaron a `content/noticias/` ni se
commitearon.

**Solución aplicada:**
1. `automation/config.ts` ahora exporta `ROOT_DIR`, calculado desde la ubicación del propio
   archivo (`fileURLToPath(import.meta.url)` + `path.resolve(__dirname, '..')`) — **no**
   desde `process.cwd()`. Así siempre apunta a la raíz real del repo sin importar desde qué
   carpeta se invoque el script.
2. `markdown/index.ts`, `images/index.ts` y `state/index.ts` ahora resuelven
   `contentDir`/`publicDir`/`stateFile` con `path.resolve(ROOT_DIR, CONFIG.xxx, ...)` en vez
   de `process.cwd()`.
3. `git/index.ts` ahora ejecuta todos los comandos git con `{ cwd: ROOT_DIR }`, así los
   pathspecs de `git add` coinciden con rutas reales del working tree.
4. Los 3 artículos huérfanos se migraron a `content/noticias/` y `public/noticias/`, y
   `automation/state/published.json` (ruta correcta) se actualizó con sus slugs.
5. Se eliminaron los directorios espurios `automation/content/`, `automation/public/` y
   `automation/automation/`.

**Regla para el futuro:** cualquier módulo nuevo bajo `automation/` que necesite leer o
escribir algo en el repo (fuera de la carpeta `automation/` misma) **debe** importar
`ROOT_DIR` desde `automation/config.ts` y resolver la ruta con `path.resolve(ROOT_DIR, ...)`.
Nunca usar `process.cwd()` directamente — el working directory real en producción (GitHub
Actions) es `automation/`, no la raíz del repo.

### Cómo diagnosticar si el automation dejó de publicar
1. Ver la pestaña **Actions** del repo en GitHub → el run diario de "Auto-publicar noticias
   Mundial 2026" → revisar si terminó en verde y leer los logs de `scheduler.ts`.
2. Si terminó en verde pero no hay commit nuevo en `main` → sospechar que `git/index.ts`
   falló en silencio (revisar que sigue corriendo con `cwd: ROOT_DIR`).
3. Si hay commit pero la noticia no aparece en `/noticias` → verificar que el `index.md`
   quedó en `content/noticias/<slug>/` (raíz del repo), no en `automation/content/noticias/`.
4. `automation/state/published.json` (raíz del repo, no `automation/automation/...`) debe
   contener el slug de cada noticia ya publicada.

### Archivos del pipeline
- `automation/config.ts` — config central + `ROOT_DIR` (ver bug arriba)
- `automation/scheduler.ts` — orquestador principal
- `automation/fetch/` — lectura RSS
- `automation/ranking/` — scoring de candidatos
- `automation/generators/` — generación de artículo (Groq)
- `automation/images/` — generación de cover.webp (Pollinations.ai)
- `automation/markdown/` — escritura de index.md + metadata.json
- `automation/git/` — commit + push
- `automation/state/` — dedupe (published.json + chequeo de disco)
- `.github/workflows/auto-news.yml` — cron + `working-directory: automation`

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

**7. STATUS_FINAL_PEN no reconocido como partido terminado (4 jul 2026)**
- **Problema:** Partidos de eliminatorias decididos por penales (ej. Alemania vs Paraguay,
  Países Bajos vs Marruecos, 29 jun) nunca se marcaban como terminados: el resultado no
  llegaba en vivo y el ganador nunca se propagaba a la ronda siguiente del bracket. Esto se
  reportaba como "resultados en vivo no llegan" y "cruces del bracket mal armados" — pero el
  diseño de los cruces (Anexo C, emparejamientos R32) era correcto; el bug era puramente de
  reconocimiento de status.
- **Causa:** `actuallyDone` en `fetchLiveResults()` (y `classify()` en `/api/debug`) solo
  reconocía `STATUS_FULL_TIME`, `STATUS_FINAL`, `STATUS_FULL_PEN` y `STATUS_FULL_PENALTY`.
  ESPN, para este torneo, envía `STATUS_FINAL_PEN` (no `STATUS_FULL_PEN`) cuando un partido de
  eliminatoria se define por penales — confirmado en producción vía `/api/debug` el 4 jul 2026.
- **Solución:** Se agregó `'STATUS_FINAL_PEN'` a `DONE_STATUSES` y al chequeo `actuallyDone`
  en `lib/espn.ts`, y al `classify()` de `app/api/debug/route.ts`. Si en el futuro aparece
  otro status de penales no listado, agregarlo en ambos lugares (deben mantenerse
  sincronizados).
- **Verificación oficial:** Se contrastaron manualmente los cruces R32 de `lib/bracket.ts`
  contra resultados reales de ESPN y fuentes oficiales (CBS Sports, FOX Sports, Wikipedia) el
  4 jul 2026 — los 16 emparejamientos R32 (qué grupo enfrenta a qué grupo) coinciden
  exactamente con el bracket oficial FIFA. **Esto NO significa que todo el archivo estuviera
  bien** — ver bug #10 más abajo: el cruce R16→QF sí tenía un error real de diseño, separado
  de este.

**8. `/api/debug` con rango de fechas desactualizado**
- **Problema:** El endpoint de diagnóstico solo consultaba fechas hasta el 30 de junio, por lo
  que nunca mostraba nada de julio (16avos en adelante) aunque `lib/espn.ts` sí las consultaba
  correctamente. Esto hacía parecer que ESPN "no tenía datos" de eliminatorias cuando en
  realidad el debug tool simplemente no las pedía.
- **Solución:** `allDates` en `app/api/debug/route.ts` ahora cubre el mismo rango que
  `TOURNAMENT_DATES` en `lib/espn.ts` (11 jun – 19 jul). Si se agrega/cambia una fecha en uno,
  replicar en el otro.

**9. `STATUS_FINAL_AET` no reconocido (4 jul 2026)**
- **Problema:** Partidos de eliminatorias decididos en tiempo suplementario SIN penales (ej.
  Bélgica 3-2 Senegal, Argentina 3-2 Cabo Verde, 1-3 jul) usan el status `STATUS_FINAL_AET`,
  que tampoco estaba reconocido como "terminado". Mismo síntoma que el bug #7 (resultado no
  llega, ganador no propaga).
- **Solución:** Se agregó `'STATUS_FINAL_AET'` a `DONE_STATUSES`/`actuallyDone` en
  `lib/espn.ts` y a `classify()` en `app/api/debug/route.ts`, junto a `STATUS_FINAL_PEN`.
- **Regla:** cualquier status nuevo de ESPN no reconocido (visto en `statusesSeenInESPN` de
  `/api/debug`) que corresponda a un partido ya terminado debe agregarse en AMBOS lugares
  (`lib/espn.ts` y `app/api/debug/route.ts`) — se desincronizan fácil si se toca solo uno.

**10. Cruce R16→QF mal armado (4 jul 2026) — bug real de diseño, no solo de status**
- **Problema:** A diferencia de los bugs #7/#9 (que eran de reconocimiento de status), este
  SÍ era un error real en `lib/bracket.ts`: el `nextMatchId`/`nextPosition` de varios partidos
  de R32 apuntaba a la ronda de Octavos (R16) equivocada, y dos de los emparejamientos
  Octavos→Cuartos estaban invertidos. Ejemplo concreto reportado: la web mostraba "Paraguay
  vs. Canadá" en octavos, cuando el cruce real (confirmado oficialmente) es Paraguay vs.
  Francia.
- **Causa:** el código agrupaba los R32 en pares consecutivos (R32-1+R32-2, R32-3+R32-4, etc.)
  asumiendo que el orden de creación reflejaba el cuadro real. No es así: el cuadro oficial
  FIFA cruza los R32 en un orden específico que no es simplemente "consecutivo".
- **Verificación:** se contrastó 1 a 1 contra la numeración oficial de partidos de FIFA/Yahoo
  Sports (partidos 89 a 104) el 4 jul 2026, confirmando cada octavo, cuarto, semifinal, final
  y partido por el tercer puesto real jugado hasta esa fecha.
- **Solución:** se reescribió el `nextMatchId`/`nextPosition` de los 16 partidos de R32 y de
  los 8 de R16 en `lib/bracket.ts` para que coincidan exactamente con la tabla de abajo. Los
  Cuartos (QF), Semis (SF), Final y 3er puesto ya estaban bien armados (solo R32→R16 y el
  intercambio QF-2↔QF-3 estaban mal).
- **Tabla de referencia oficial del cuadro completo (no volver a re-derivar esto a mano —
  copiar de acá):**

| R32 (id interno) | Partido oficial (M#) | Alimenta a R16 | R16 (id interno) | Alimenta a QF | QF (id interno) | Alimenta a SF |
|---|---|---|---|---|---|---|
| R32-1 (2°A/2°B) | M73 | R16-1 home | R16-1 = M90 (Canadá/Marruecos) | QF-1 home | QF-1 = M97 | SF-1 home |
| R32-3 (1°F/2°C) | M75 | R16-1 away | | | | |
| R32-2 (1°E/3°) | M74 | R16-2 home | R16-2 = M89 (Paraguay/Francia) | QF-1 away | | |
| R32-5 (1°I/3°) | M77 | R16-2 away | | | | |
| R32-4 (1°C/2°F) | M76 | R16-3 home | R16-3 = M91 (Brasil/Noruega) | QF-3 home | QF-3 = M99 | SF-2 home |
| R32-6 (2°E/2°I) | M78 | R16-3 away | | | | |
| R32-7 (1°A/3°) | M79 | R16-4 home | R16-4 = M92 (México/Inglaterra) | QF-3 away | | |
| R32-8 (1°L/3°) | M80 | R16-4 away | | | | |
| R32-12 (1°H/2°J) | M84 | R16-5 home | R16-5 = M93 (España/Portugal) | QF-2 home | QF-2 = M98 | SF-1 away |
| R32-11 (2°K/2°L) | M83 | R16-5 away | | | | |
| R32-10 (1°G/3°) | M82 | R16-6 home | R16-6 = M94 (Bélgica/EE.UU.) | QF-2 away | | |
| R32-9 (1°D/3°) | M81 | R16-6 away | | | | |
| R32-16 (2°D/2°G) | M88 | R16-7 home | R16-7 = M95 (Egipto/Argentina) | QF-4 home | QF-4 = M100 | SF-2 away |
| R32-14 (1°J/2°H) | M86 | R16-7 away | | | | |
| R32-13 (1°B/3°) | M85 | R16-8 home | R16-8 = M96 (Suiza/Colombia) | QF-4 away | | |
| R32-15 (1°K/3°) | M87 | R16-8 away | | | | |

  Semis y final ya estaban bien armados: **SF-1** (QF-1 home + QF-2 away) = M101 (14 jul),
  **SF-2** (QF-3 home + QF-4 away) = M102 (15 jul), **3RD** = perdedores SF-1/SF-2 (18 jul),
  **F** = ganadores SF-1/SF-2 (19 jul). No tocar esa parte — solo R32→R16 y QF-2↔QF-3 estaban
  invertidos.

### Cómo diagnosticar rápidamente
1. Abrir `/api/debug` en producción
2. Ver `matched` para confirmar qué partidos se procesaron
3. Ver `unmatched` para encontrar qué no pudo matchearse
4. Agregar el alias faltante en `ESPN_ALIASES` si el nombre difiere
5. Verificar `TOURNAMENT_DATES` si el partido es de una fecha no cubierta

---

## Arquitectura de datos

### Fuente de verdad única
**`lib/data.ts`** es la fuente de verdad para datos deportivos:
- `TEAMS` — array de todos los equipos con slug, nombre, flagCode, etc.
- `TEAMS_BY_SLUG` — map slug → Team para acceso O(1)
- `GROUPS` — definición de los 12 grupos
- `BASE_MATCHES` — los 104 partidos del torneo con kickoffs
- `FEATURED_TEAM_SLUGS` — slugs de equipos destacados en la home

### Noticias — contenido editorial
Las noticias **no** viven en `lib/data.ts`. Usan archivos Markdown en `content/noticias/<slug>/index.md` con frontmatter YAML. Ver `NOTICIAS.md` para el flujo editorial completo.

- `lib/noticias.ts` — Lee `content/noticias/` en build time con `gray-matter`
- `getAllNoticias()` — Todas las noticias ordenadas por fecha DESC
- `getNoticiaBySlug(slug)` — Acceso O(1) por slug para la página de detalle
- `getNoticiaSlugs()` — Slugs para `generateStaticParams` (SSG)
- `getNoticiasRecientes(limit, excludeSlug?)` — Las N más recientes (home, relacionados)
- `formatFecha(date)` — Formatea `Date` a "13 jun 2026"
- `components/NoticiaCard.tsx` — Card reutilizable (imagen o emoji fallback)

**Flujo para agregar noticia:** crear carpeta → pegar `index.md` → (opcional) agregar `cover.webp` → commit. No se toca código.

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
# - /api/debug → revisar matched/unmatched (grupos) y statusesSeenInESPN
# - /grupos → todas las tablas cargan con colores correctos
# - /grupo/a → LiveGroupStandings hace polling y muestra resultados
# - /eliminatorias → bracket se renderiza correctamente y propaga ganadores
# - /partidos → fechas agrupadas correctamente en timezone local
# - Homepage → countdown muestra la fase correcta del torneo
# - /noticias → las últimas noticias generadas por el automation aparecen
# - GitHub Actions → el run de "Auto-publicar noticias" más reciente terminó en verde
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
| `automation/config.ts` | Define `ROOT_DIR`. Si se rompe, todo el pipeline de noticias escribe/commitea en la carpeta equivocada (ver bug histórico #7 en "Sistema de noticias automatizado") |
| `automation/git/index.ts` | Comandos git deben correr con `cwd: ROOT_DIR`, nunca con el cwd por defecto |
| `.github/workflows/auto-news.yml` | Define `working-directory: automation` — cualquier ruta nueva en `automation/` debe resolverse vía `ROOT_DIR`, no `process.cwd()` |

---

## Lecciones aprendidas

1. **ESPN_ALIASES es frágil:** Cada edición del torneo puede cambiar los nombres. Siempre validar con `/api/debug` después de agregar equipos.

2. **No usar ASCII stripping para normalización:** `.normalize('NFD')` es la única forma correcta de manejar diacríticos en JavaScript.

3. **ISR de Next.js y datos en vivo:** Con `revalidate = 60`, el server component puede servir datos con hasta 60s de retraso. Los client components con polling complementan esto para "near real-time".

4. **El bracket depende de que todos los grupos terminen:** `resolveThirdPlaceMatchups()` retorna nulls hasta que los 12 grupos completan las 3 jornadas. El bracket muestra slots vacíos hasta ese momento — comportamiento correcto.

5. **Slugs son la identidad:** Nunca cambiar un slug sin actualizar ESPN_ALIASES, BASE_MATCHES, todas las referencias en el bracket y las URLs de páginas ya indexadas.

6. **`@/` aliases no funcionan fuera de Next.js:** Para testing con `npx tsx`, usar rutas relativas.

7. **overflow: hidden puede ocultar contenido visual:** Antes de reportar "no se ve X", verificar que no hay un contenedor con overflow hidden cortando el contenido.

8. **Nunca usar `process.cwd()` dentro de `automation/`:** El workflow de GitHub Actions corre los scripts con `working-directory: automation`, así que `process.cwd()` NO es la raíz del repo ahí dentro. Siempre resolver rutas con `ROOT_DIR` (exportado desde `automation/config.ts`). Este bug hizo que 3 noticias reales se generaran pero nunca se publicaran (ver sección "Sistema de noticias automatizado").

9. **Un bracket que "se ve mal armado" puede ser dos cosas distintas — chequear ambas:** (a) un `status` de ESPN no reconocido que impide que un resultado ya jugado se propague (bugs #7, #9), o (b) un error real de `nextMatchId`/`nextPosition` en `lib/bracket.ts` que cruza rondas incorrectamente (bug #10, real, ya corregido el 4 jul 2026). Antes de tocar `lib/bracket.ts`, contrastar el cuadro contra una fuente oficial numerada (FIFA.com, o la numeración de partidos 73-104 de Yahoo/CBS/FOX Sports) — no asumir que los R32 se emparejan en orden consecutivo hacia R16. La tabla de referencia completa está en la sección "Bracket FIFA" más abajo.

---

## Guía para futuros agentes

### Antes de hacer cualquier cambio importante:

**1. Leer este archivo completo.**

**2. Verificar el estado actual del torneo:**
- Abrir `/api/debug` para ver qué datos llegan de ESPN (recordar: solo testea grupos, no eliminatorias — ver "Cómo verificar que ESPN funciona")
- Ver `/grupos` para confirmar que las tablas cargan
- Ver `/eliminatorias` para confirmar que el bracket está bien
- Ver la pestaña Actions de GitHub para confirmar que el automation de noticias sigue corriendo en verde

**3. Identificar exactamente qué archivos tocar:**
- Cambio visual/CSS → solo `app/globals.css` y el componente afectado
- Nuevo resultado → verificar `ESPN_ALIASES` en `lib/espn.ts`
- Nuevo equipo o partido → solo `lib/data.ts`
- Cambio en lógica de clasificación → `lib/standings.ts` (con mucho cuidado)
- Cambio en bracket → `lib/bracket.ts` (entender primero el Reglamento FIFA, y descartar antes un status de ESPN no reconocido)
- Cambio en el pipeline de noticias → cualquier ruta nueva debe resolverse con `ROOT_DIR` desde `automation/config.ts`, nunca `process.cwd()`

**4. Nunca tocar sin necesidad:**
- `lib/thirdPlaceTable.ts`
- Los slugs existentes en `lib/data.ts`
- La lógica de normalización en `lib/espn.ts`
- `automation/config.ts` (`ROOT_DIR`) sin entender el bug histórico que resolvió

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

*Última actualización: 4 jul 2026 (fix STATUS_FINAL_PEN/STATUS_FINAL_AET en eliminatorias, fix rutas del automation de noticias con ROOT_DIR, fix cruce R16→QF del bracket, tabla de referencia oficial del cuadro agregada)*
*Repo: https://github.com/Juliancaba20/mundial2026*
*Producción: https://mundial2026-blond-pi.vercel.app*
