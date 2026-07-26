# PROJECT_CONTEXT.md — Mundial 2026

> Documento de referencia canónico para cualquier agente (Claude, Codex, Cursor,
> OpenAI, etc.) que trabaje en este repositorio. Está basado en el código real
> tal como existe hoy, no en descripciones genéricas. Si el código cambia, este
> archivo debe actualizarse en el mismo commit/entrega.

---

## 1. Visión general

**Objetivo:** sitio web de seguimiento del Mundial 2026 (`mundial2026`) que cubre
los 104 partidos del torneo (fase de grupos + eliminatorias), con resultados en
vivo, tabla de posiciones por grupo, bracket de eliminatorias, perfiles de
equipo y un sistema de noticias generadas automáticamente.

**Tecnologías:**
- Next.js (App Router) + TypeScript
- CSS plano con custom properties (`globals.css`) — **Tailwind NO está
  instalado**. Cualquier clase de utilidad tipo `flex`, `p-4`, `text-sm` en un
  componente es ignorada silenciosamente por el navegador.
- Despliegue en Vercel (auto-deploy desde GitHub), automatización vía GitHub
  Actions (cron).
- Fuente de resultados: ESPN public scoreboard API.
- Contenido IA: Gemini (con Google Search grounding) para análisis de
  partidos; Groq (Llama 3.3 70B) para artículos de noticias.
- Imágenes de portada de noticias: Pollinations.ai.

**Estructura general (carpetas relevantes):**
```
app/                    → rutas Next.js (App Router)
  api/debug/route.ts    → diagnóstico crudo de la API de ESPN
  api/resultados/route.ts → endpoint que expone fetchLiveResults() al cliente
  api/partidos/[id]/analysis/ → sirve el análisis IA estático
  partidos/[id]/        → subpáginas de partido individual
  grupo/[letra]/        → tabla de posiciones por grupo
  equipo/[slug]/        → perfil de equipo
  eliminatorias/        → vista del bracket
  noticias/[slug]/      → artículos generados
components/             → BracketView.tsx, MatchesClient.tsx, etc.
lib/
  data.ts               → ÚNICA fuente de verdad de datos estáticos (equipos, partidos base)
  espn.ts               → fetch de ESPN + normalización + construcción de resultados
  bracket.ts            → construcción y propagación del bracket (buildBracket)
  standings.ts          → cálculo de posiciones de grupo (calculateStandings)
  thirdPlaceTable.ts    → Anexo C FIFA (495 combinaciones de mejores terceros)
  matches.ts            → helpers compartidos + pipeline getAllMatchesData() cacheado con React.cache()
  analysisCache.ts / analysisPrompt.ts / analysisVersion.ts → sistema de análisis IA
  noticias.ts           → helpers del sistema de noticias
automation/             → generación de noticias (Groq + RSS + Pollinations)
scripts/generate-analysis.ts → genera public/analisis/<matchId>.json (Gemini)
.github/workflows/
  auto-analysis.yml     → cron */20 min, análisis IA
  auto-news.yml         → cron diario (11:00 UTC), noticias
public/flags/           → SVGs de banderas servidas desde el propio dominio (flag-icons)
public/analisis/        → JSON estáticos de análisis por partido (servidos por CDN de Vercel)
```

---

## 2. Integración ESPN

**Endpoint usado:**
```
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD&limit=20
```
Se consulta un rango fijo de fechas (`TOURNAMENT_DATES` en `lib/espn.ts`, 11 jun
– 19 jul 2026, fase de grupos + eliminatorias completa), más un día extra para
cubrir partidos nocturnos que ESPN reporta con la fecha UTC del día siguiente.

**Flujo completo (ESPN → render):**
1. `fetchLiveResults()` (`lib/espn.ts`) pide todas las fechas en paralelo
   (`Promise.allSettled`), normaliza nombres de equipo, clasifica el status del
   partido y devuelve `{ results, knockoutResults }`.
   - `results` (`LiveResultsMap`): indexado por `home.slug_away.slug` — **solo
     para fase de grupos**, donde el par de equipos es fijo de antemano.
   - `knockoutResults` (`KnockoutResultsMap`): indexado por slug de equipo,
     **cada equipo guarda un HISTORIAL (array) de sus cruces de
     eliminatorias**, no un único resultado (ver §9, bug histórico).
2. `applyResults(BASE_MATCHES, results)` aplica los resultados de grupos a los
   partidos base.
3. `buildBracket(groupMatches, knockoutResults)` (`lib/bracket.ts`) calcula
   standings, resuelve mejores terceros, arma R32 con los cruces oficiales FIFA
   y propaga ronda por ronda (R32→R16→QF→SF→Final/3er puesto).
4. Todo esto se orquesta en `getAllMatchesData()` (`lib/matches.ts`), cacheado
   por request con `React.cache()` para que páginas, `generateMetadata` y route
   handlers no dupliquen el trabajo.
5. El cliente (`MatchesClient.tsx`, `BracketView.tsx`) hace polling a
   `/api/resultados` (`revalidate = 60`) y reconstruye `applyResults` /
   `buildBracket` en el navegador con la respuesta.

**Status de ESPN que hay que reconocer como "finalizado" (`DONE_STATUSES` /
`actuallyDone` en `lib/espn.ts`):**
- `STATUS_FULL_TIME` (el que ESPN realmente manda, no `STATUS_FINAL` como se
  esperaba originalmente)
- `STATUS_FINAL_PEN` (definido por penales — el score de ESPN queda empatado;
  el ganador real viene de `competitor.winner`, no de comparar goles)
- `STATUS_FINAL_AET` (definido en tiempo suplementario, sin penales)
- `STATUS_HALFTIME` (descanso — sigue "vivo", no debe tratarse como pendiente)

**`/api/debug`:** endpoint sin autenticar (riesgo de seguridad conocido) que
consulta el mismo rango de fechas y reporta, evento por evento, cómo lo
clasificó. **Importante:** este endpoint solo intenta matchear contra
`BASE_MATCHES` (pares fijos de fase de grupos). Es esperado y normal que
**todos** los partidos de eliminatorias (R32 en adelante) aparezcan como
`NO_MATCH` en `/api/debug` — eso no indica un bug por sí solo, porque el
matching real de eliminatorias ocurre por equipo individual en
`knockoutResults`, que este endpoint no ejercita.

**Cómo verificar que ESPN funciona correctamente:**
1. Visitar `/api/debug` y revisar `summary.statusesSeenInESPN` — si aparece un
   status nuevo no cubierto en `DONE_STATUSES`/`LIVE_STATUSES`, hay que
   agregarlo en `lib/espn.ts` (y en el `classify()` duplicado de
   `app/api/debug/route.ts`).
2. Para fase de grupos: confirmar que `summary.unmatchedList` esté vacío o
   solo contenga partidos de eliminatorias (esperado).
3. Para eliminatorias: **`/api/debug` no sirve** para verificar el matching
   por equipo — hay que revisar los logs de `[ESPN] RESUMEN: ...` (incluye
   `knockoutMatched`) o inspeccionar la respuesta de `/api/resultados`
   directamente y confirmar que `knockoutResults[slugDelEquipo]` contiene una
   entrada con el `opponentSlug` correcto para el cruce que se quiere validar.
4. Confirmar visualmente en `/eliminatorias` que cada ronda muestre equipos y
   marcador, no placeholders (`Ganador SF-1`, `Mejor 3° Grupo ...`).

---

## 3. Sistema de grupos

`lib/standings.ts` → `calculateStandings(groupLetter, matches)`.

**Criterios de desempate (FIFA Regulations 2026, Art. 32), en orden:**
1. Puntos
2. Diferencia de goles global
3. Goles a favor global
4. Puntos en enfrentamiento directo (H2H) entre los dos equipos empatados
5. Diferencia de goles H2H
6. Goles a favor H2H
7. Fair play (tarjetas) — **no implementado**, ESPN no expone esta data
8. Sorteo FIFA — **no implementable** (no es determinístico)

Si tras el criterio 6 sigue habiendo empate, se usa orden alfabético estable
(`localeCompare` en español) solo para tener un orden determinístico en la UI —
no es un criterio FIFA real.

**Clasificación:** top 2 de cada grupo pasan directo a R32 (`first(g)` /
`second(g)` en `lib/bracket.ts`). Los 12 terceros se ordenan por pts→dg→gf para
determinar los 8 mejores (`getBestThirds`).

---

## 4. Mejores terceros

`lib/thirdPlaceTable.ts` contiene `THIRD_PLACE_TABLE`: las 495 combinaciones
posibles del **Anexo C del Reglamento FIFA World Cup 26**, que determinan,
según CUÁLES 8 de los 12 grupos aportan un tercero clasificado, qué grupo de
origen enfrenta a cada uno de los 8 primeros de grupo (A, B, D, E, G, I, K, L).

`resolveThirdPlaceMatchups()` (`lib/bracket.ts`):
- Solo puede resolver la fila exacta del Anexo C cuando **ya hay 8 terceros
  con equipo real** (fase de grupos completa). Antes de eso, devuelve `null`
  para los 8 grupos y el bracket muestra el placeholder con la lista de grupos
  posibles (ej. `"Mejor 3° Grupo A/B/C/D/F"`).
- Restricción importante: si `qualifiedGroups.length !== 8` o no se encuentra
  la fila exacta en la tabla, se devuelve todo `null` — **nunca se debe
  inventar o aproximar** una fila del Anexo C.

---

## 5. Bracket FIFA

`lib/bracket.ts` → `buildBracket(matches, knockoutResults)` es la **única**
función que construye el bracket. Nunca debe duplicarse esta lógica en otro
archivo.

**Construcción:**
- **R32** (16 partidos, `M73`–`M88` del calendario oficial): cruces fijos
  (`first()`/`second()`) armados a mano contra el cuadro oficial FIFA, más los
  8 cruces "Ganador de grupo vs Mejor 3°" resueltos vía `thirdVs()` +
  `resolveThirdPlaceMatchups()`.
- **R16** (`M89`–`M96`): slots vacíos (`emptySlot`) que se llenan por
  propagación desde R32.
- **QF** (`M97`–`M100`), **SF** (`M101`–`M102`), **3er puesto** (`M103`) y
  **Final** (`M104`): ídem, vacíos hasta que se propaga el ganador de la ronda
  anterior.

**Propagación de ganadores — `propagateRound(currentRound, nextRound, knockoutResults)`:**
- Para cada partido de `currentRound` con ambos equipos ya conocidos, llama a
  `resolveMatchResult(home, away, knockoutResults)`.
- Si el resultado es `'live'`: setea marcador parcial + clock, **no propaga
  ganador** (el partido no terminó).
- Si es `'done'`: setea marcador final y **empuja el ganador** al slot
  correspondiente de `nextRound` según `nextMatchId`/`nextPosition` definidos
  en cada `BracketMatch`.
- Se encadena así: `step1 = propagateRound(r32, r16, ...)`, `step2 =
  propagateRound(step1.next, qf, ...)`, `step3 = propagateRound(step2.next,
  sf, ...)`, `step4 = propagateRound(step3.next, final, ...)`.

**Casos especiales (Final y 3er puesto):**
- Final y 3er puesto **nunca son `currentRound`** de un `propagateRound` (no
  hay ronda siguiente a la que empujar un ganador), así que su propio
  marcador/estado se resuelve en un loop manual aparte, después de `step4`.
- El 3er puesto lo juegan los **perdedores** de las semis, no los ganadores —
  se resuelve en un loop separado que recorre `sfFilled`, identifica al
  perdedor de cada semifinal y lo asigna al slot correspondiente de `3RD`.
- **Orden crítico:** la asignación de equipos del 3er puesto (loop de
  perdedores) debe ejecutarse **antes** del loop que resuelve
  marcador/estado de `finalFilled` (que incluye tanto `F` como `3RD`). Si se
  invierte el orden, cuando el loop de marcador procesa `3RD` todavía no tiene
  equipos asignados y lo salta (`continue`), dejando el 3er puesto sin
  resultado para siempre aunque ESPN ya lo haya reportado. Esto fue un bug
  real (ver §9).

**Archivos involucrados:** `lib/bracket.ts` (lógica completa), `lib/espn.ts`
(fuente de `knockoutResults`), `lib/standings.ts` (clasificados de grupo),
`lib/thirdPlaceTable.ts` (Anexo C), `components/BracketView.tsx` (render +
polling cliente).

---

## 6. Flujo de resultados en vivo

**Componentes que consumen resultados:**
- `components/MatchesClient.tsx`: lista de partidos de fase de grupos +
  destacados (`buildFeaturedPool`), hace polling a `/api/resultados` y
  reconstruye `applyResults`/`buildBracket` en cliente.
- `components/BracketView.tsx`: vista del bracket completo, mismo patrón de
  polling.
- `app/partidos/[id]/page.tsx` y `scripts/generate-analysis.ts`: consumen
  `getAllMatchesData()` / helpers de `lib/matches.ts` (server-side, cacheado
  con `React.cache()`).
- `app/grupo/[letra]/page.tsx`: usa `calculateStandings()` directamente.

**Pipeline de datos (server-side), estrictamente en este orden:**
```
fetchLiveResults() → applyResults() → buildBracket()
```
Nunca invertir este orden ni saltarse pasos: `buildBracket` depende de que
`groupMatches` ya tenga los resultados de grupo aplicados (para calcular
standings correctamente), y `applyResults` depende de que `fetchLiveResults`
ya haya corrido.

**Errores que ya ocurrieron históricamente (ver también §9):**
1. **Status de ESPN inesperados**: se esperaba `STATUS_FINAL` pero ESPN manda
   `STATUS_FULL_TIME`; penales (`STATUS_FINAL_PEN`) y tiempo suplementario
   (`STATUS_FINAL_AET`) no estaban cubiertos y dejaban partidos sin propagar
   (Alemania-Paraguay, Países Bajos-Marruecos, Bélgica-Senegal, Argentina-Cabo
   Verde, Australia-Egipto).
2. **Descanso (`STATUS_HALFTIME`) tratado como pendiente**: el partido volvía a
   verse "pendiente" durante el entretiempo en vez de mostrar el marcador
   parcial.
3. **Ganador por penales mal resuelto**: cuando el marcador de ESPN queda
   empatado (penales), el ganador SOLO puede resolverse vía
   `competitor.winner` (booleano de ESPN), nunca comparando goles.
4. **`knockoutResults` pisaba el cruce anterior del mismo equipo** (bug
   corregido en esta sesión — ver §9 para el detalle completo).
5. **`/api/debug` cortaba en el 30 de junio**: no mostraba nada de los cruces
   de julio (16avos en adelante) aunque `lib/espn.ts` sí los consultaba — ya
   corregido, ambos archivos comparten el mismo rango `TOURNAMENT_DATES`.

**Cómo diagnosticar rápido un partido sin resultado:**
1. `/api/debug` → confirmar que ESPN devuelve el evento con un status
   reconocido (revisar `statusesSeenInESPN`).
2. Si es fase de grupos y `/api/debug` marca `NO_MATCH`: el problema está en
   `matchTeamName()`/`ESPN_ALIASES` (nombre de equipo no reconocido).
3. Si es eliminatorias: `/api/debug` mostrar NO_MATCH ahí es normal — hay que
   revisar en cambio si `knockoutResults[slug]` tiene la entrada esperada
   (rival correcto) para ESE cruce específico, no solo si el equipo aparece en
   el mapa.
4. Si el equipo/marcador aparece en `knockoutResults` pero el bracket sigue
   sin mostrarlo: el problema está en `resolveMatchResult()` o en el orden de
   los loops de `buildBracket()`, no en `lib/espn.ts`.

---

## 7. Checklist obligatorio antes de cualquier deploy

1. `npx tsc --noEmit` — sin errores de tipos.
2. `npm run build` — build completo sin errores (los `HTTP 403` de ESPN en
   build time son esperados en el sandbox, ESPN bloquea al entorno de
   desarrollo; no bloquean el build).
3. Verificar `/api/debug` — confirmar `statusesSeenInESPN` y que no haya
   partidos de **fase de grupos** en `unmatchedList`.
4. Verificar `/grupos` — standings correctos, desempates coherentes con datos
   reales.
5. Verificar `/eliminatorias` — bracket completo, sin placeholders en rondas
   que ya deberían tener equipo real, marcador visible en partidos finalizados
   (incluyendo semis, 3er puesto y final una vez jugados).
6. Verificar resultados en vivo — un partido en curso debe mostrar marcador
   parcial + clock, no "pendiente".
7. ZIP de entrega: excluir `node_modules`, `.next`, `.git`.

---

## 8. Archivos críticos

No modificar sin entender completamente su función:

- **`lib/data.ts`** — única fuente de verdad de datos estáticos (equipos,
  plantillas, `BASE_MATCHES`). Cualquier corrección de datos (ej. la
  corrección histórica "Eslovenia no clasificó, es Uzbekistán") va acá.
- **`lib/bracket.ts`** — única fuente de verdad del bracket. Nunca duplicar
  `buildBracket` en otro archivo. El orden de los loops al final de
  `buildBracket()` es crítico (ver §5).
- **`lib/espn.ts`** — fetch + normalización + `upsertKnockoutResult()`. Los
  `DONE_STATUSES`/`actuallyDone`/`actuallyLive` están sincronizados
  manualmente con la copia de `classify()` en `app/api/debug/route.ts` — si se
  agrega un status nuevo, actualizar ambos archivos.
- **`lib/standings.ts`** — criterios de desempate FIFA. Cambios acá afectan
  clasificación y, en cascada, el bracket completo.
- **`lib/thirdPlaceTable.ts`** — Anexo C FIFA (495 filas). No editar salvo
  error confirmado contra el reglamento oficial.
- **`lib/matches.ts`** — pipeline `getAllMatchesData()` cacheado con
  `React.cache()`; cambios acá afectan todas las páginas server-side a la vez.
- **`types/index.ts`** — `KnockoutResultsMap` es `Record<string,
  KnockoutTeamResult[]>` (historial por equipo, no un único resultado). Ver
  §9 de lecciones aprendidas antes de tocar esta forma.
- **`app/api/debug/route.ts`** — endpoint sin autenticar (riesgo de seguridad
  conocido, pendiente de resolver). Mantiene una copia de `matchTeamName()` y
  `classify()` duplicada de `lib/espn.ts` — hay que mantenerlas sincronizadas.

---

## 9. Lecciones aprendidas

- **`normalizeMarkdownBody()` (automation)**: Groq Llama 3.3 70B devuelve
  inconsistentemente el cuerpo del artículo en una sola línea sin `\n\n`
  reales — se corrige de forma determinística en `validate()`.
- **Cachés en memoria no son confiables en Vercel serverless**: distintas
  instancias sirven contenido distinto a distintos usuarios. El análisis IA se
  migró de caché en memoria a archivos estáticos versionados en
  `public/analisis/<matchId>.json`, servidos desde el CDN de Vercel.
- **"El código para el fix existe" ≠ "el fix está aplicado"**: un fix previo
  de conectores del bracket tenía toda la lógica escrita pero la función de
  ordenamiento nunca se invocaba — los conectores dibujaban hacia el partido
  equivocado. Moraleja: verificar que el código nuevo se **ejecute**, no solo
  que exista.
- **`flagcdn.com` no es confiable en producción** — las banderas se sirven
  desde `public/flags/` (paquete `flag-icons`) en el mismo dominio.
- **ESPN manda `STATUS_FINAL_PEN`/`STATUS_FINAL_AET`, no `STATUS_FINAL`**, y
  el ganador en penales se resuelve vía `competitor.winner`, nunca comparando
  goles (quedan empatados en el score que da ESPN).
- **Bug de esta sesión — `knockoutResults` pisaba el cruce anterior del mismo
  equipo:**
  - **Síntoma:** las 2 semifinales, el 3er puesto y la final no mostraban
    resultado, aunque ESPN ya los había reportado como finalizados.
  - **Causa raíz:** `KnockoutResultsMap` guardaba **un único resultado por
    equipo** (el más reciente). Un equipo como Francia juega dos partidos de
    eliminatorias en fechas distintas (semifinal el 14/7 vs España, 3er
    puesto el 18/7 vs Inglaterra). Como `fetchLiveResults()` procesa TODAS las
    fechas del torneo en un solo pase y en orden cronológico, al terminar el
    fetch `knockoutResults['francia']` quedaba apuntando al 3er puesto (el más
    reciente), pisando la entrada de la semifinal. `resolveMatchResult()`
    comparaba `opponentSlug` esperando encontrar a España y encontraba
    Inglaterra → no matcheaba → la semifinal nunca se marcaba `done` → el
    ganador nunca se propagaba a la Final → Final y 3er puesto tampoco podían
    resolver sus propios equipos/marcador.
  - **Bug secundario, mismo área:** aun resolviendo lo anterior, el loop que
    calcula marcador/estado de `finalFilled` (Final + 3er puesto) se ejecutaba
    **antes** que el loop que asigna los equipos del 3er puesto (perdedores de
    semis) — así que cuando le tocaba el turno a `3RD`, sus slots `home`/`away`
    todavía estaban vacíos y el loop lo saltaba con `continue`.
  - **Fix aplicado:**
    1. `KnockoutResultsMap` pasó de `Record<string, KnockoutTeamResult>` a
       `Record<string, KnockoutTeamResult[]>` — cada equipo guarda un
       **historial** de cruces, no un único resultado (`types/index.ts`).
    2. `lib/espn.ts`: nueva función `upsertKnockoutResult()` que busca en el
       historial una entrada con el mismo `opponentSlug` (o `opponentName` si
       el rival no se reconoció como equipo propio) y la actualiza in-place;
       si es un rival nuevo, la agrega al historial sin tocar las anteriores.
    3. `lib/bracket.ts`: `resolveMatchResult()` ahora busca dentro del
       historial de cada equipo la entrada específica cuyo `opponentSlug`
       coincide con el rival del partido que se está resolviendo, en vez de
       asumir que la única entrada guardada es la correcta.
    4. `lib/bracket.ts`: se invirtió el orden de los dos loops finales de
       `buildBracket()` — ahora los perdedores de semis se asignan al 3er
       puesto **antes** de resolver marcador/estado de `finalFilled`.
  - **Validado con:** `npx tsc --noEmit`, `npm run build`, y un test aislado
    del historial (`upsertKnockoutResult` + búsqueda por rival) confirmando
    que ambos cruces de un mismo equipo (semifinal y 3er puesto) coexisten
    correctamente en el mapa.

---

## 10. Guía para futuros agentes

Antes de hacer cambios importantes en este proyecto:

1. **Leé este archivo completo primero.** No rediscutas desde cero decisiones
   ya tomadas (ej. por qué Tailwind no está instalado, por qué
   `knockoutResults` es un historial y no un único valor, por qué el Anexo C
   tiene 495 filas hardcodeadas).
2. **Corré `/api/debug` antes de auditar el pipeline de ESPN.** Si un partido
   de fase de grupos aparece `NO_MATCH`, el problema está en
   `matchTeamName()`/`ESPN_ALIASES`. Si un partido de eliminatorias aparece
   `NO_MATCH` ahí, **es esperado** — no es indicio de bug por sí solo, porque
   ese endpoint solo matchea contra `BASE_MATCHES` (pares fijos de grupos).
3. **Si el bug es sobre bracket/eliminatorias**, mirá primero
   `resolveMatchResult()` y el orden de los loops en `buildBracket()` antes de
   sospechar de `lib/espn.ts` — muchos bugs históricos fueron de **orden de
   ejecución**, no de datos faltantes.
4. **Regla de eficiencia del proyecto:** para cambios visuales/CSS/UX o
   componentes aislados, NO hacer auditorías extensas — identificar archivos
   afectados, plan corto, implementar, validar build. Reservar auditoría
   profunda para cambios que toquen APIs, integraciones externas,
   clasificación, cálculo de grupos, mejores terceros, bracket FIFA o
   persistencia de datos.
5. **Nunca dupliques `buildBracket()` ni la lógica de desempates de
   `lib/standings.ts`** en otro archivo — son la única fuente de verdad.
6. **Antes de entregar:** corré el checklist completo de la §7 (`tsc`,
   `build`, `/api/debug`, `/grupos`, `/eliminatorias`, resultados en vivo).
7. **Actualizá este archivo** si el cambio afecta cualquiera de las secciones
   de arriba — el objetivo es que el próximo agente no tenga que
   re-descubrir lo que ya se investigó acá.
