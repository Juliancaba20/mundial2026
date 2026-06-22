# Guía de autoría de noticias

> Documento de referencia para agregar noticias al sitio del Mundial 2026.
> **No hace falta tocar código.** Solo creás archivos y hacés commit.

---

## Resumen del flujo

```
1. Crear carpeta:   content/noticias/<slug>/
2. Crear archivo:   content/noticias/<slug>/index.md
3. Agregar imagen:  public/noticias/<slug>/cover.webp  (opcional)
4. Commit & push    → Vercel auto-despliega
```

Listo. La noticia aparece automáticamente en `/noticias` y en la home.

---

## 1. Crear la carpeta

El nombre de la carpeta es el **slug** de la URL. Debe ser:
- Todo en minúsculas
- Sin espacios, tildes ni caracteres especiales
- Separar palabras con guiones `-`
- Identificador permanente (no cambiar después de publicado)

```
content/noticias/brasil-vence-a-marruecos-en-debut/
```

---

## 2. Crear `index.md`

Dentro de la carpeta, creás un archivo `index.md` con este formato:

```markdown
---
title: "Brasil vence a Marruecos en un debut electrizante"
category: Resultados
date: 2026-06-13
excerpt: "La canarinha golea 3-0 con un doblete de Vinicius Jr."
image: /noticias/brasil-vence-a-marruecos-en-debut/cover.webp
imageAlt: "Vinicius Jr celebra un gol con la camiseta de Brasil"
emoji: "🇧🇷"
featured: true
relatedTeamSlugs: [brasil, marruecos]
---

Brasil debutó con una **goleada contundente** en el MetLife Stadium.

## Lo que pasó

- Vinicius Jr abrió el marcador a los 12 minutos.
- Endrick selló el resultado en el segundo tiempo.
- La defensa brasileña fue impecable.

> "Jugamos con la intensidad que el torneo requiere", dijo Ancelotti.

La victoria posiciona a Brasil como uno de los favoritos de advance.
```

### Campos del frontmatter

| Campo | Requerido | Descripción |
|---|---|---|
| `title` | ✅ | Título completo de la noticia |
| `category` | ✅ | Categoría: Análisis, Resultados, Sede, Favoritos, Historia, etc. |
| `date` | ✅ | Fecha de publicación en formato `YYYY-MM-DD` |
| `excerpt` | ✅ | Resumen corto (1-2 líneas). Aparece en cards y meta tags. |
| `image` | ❌ | URL de la imagen de portada: `/noticias/<slug>/cover.webp` |
| `imageAlt` | ❌ | Texto alternativo de la imagen (accesibilidad). |
| `emoji` | ❌ | Fallback visual si no hay imagen (ej: `🇧🇷`, `🏆`). |
| `featured` | ❌ | `true` para destacar la noticia en la home (card grande). |
| `relatedTeamSlugs` | ❌ | Array de slugs de equipos para mostrar chips relacionados. |

### Reglas del cuerpo (Markdown)

- Separar párrafos con una **línea en blanco**.
- `**texto**` para negritas.
- `## Subtítulo` para headings (se renderizan como h2).
- `- ítem` para listas.
- `> cita` para blockquotes.
- `[texto](url)` para enlaces.
- Evitar HTML crudo (se renderiza directamente, riesgo XSS).

---

## 3. Imagen de portada (opcional)

Si querés imagen en lugar de emoji:

1. Redimensionar a **1600×900 px** (16:9).
2. Optimizar como WebP (< 200 KB).
3. Guardar en: `public/noticias/<slug>/cover.webp`
4. Referenciar en frontmatter: `image: /noticias/<slug>/cover.webp`

Si NO ponés imagen, la card muestra el `emoji` sobre un gradiente (comportamiento actual).

---

## 4. Commit & push

```bash
git add content/noticias/<slug>/ public/noticias/<slug>/
git commit -m "noticia: <título corto de la nota>"
git push
```

Vercel detecta el push, reconstruye el sitio, y la noticia queda en vivo.

---

## Estructura de carpetas

```
content/
  noticias/
    argentina-campeona-busca-bicampeonato/
      index.md
    cinco-candidatos-al-titulo/
      index.md
    ...

public/
  noticias/
    argentina-campeona-busca-bicampeonato/
      cover.webp          ← opcional
    ...
```

---

## Preguntas frecuentes

**¿Cómo cambio el orden?** Las noticias se ordenan por `date` descendente (más reciente primero). Para subir una al tope, actualizá su `date`.

**¿Puedo borrar una noticia?** Sí, eliminá la carpeta en `content/noticias/<slug>/` y la imagen en `public/noticias/<slug>/`. Commit y push.

**¿Puedo editar una noticia existente?** Sí, editá el `index.md` directamente. Commit y push.

**¿Se rompe algo si me equivoco en el frontmatter?** No. El build falla con un mensaje claro indicando qué campo falta o está mal. Corregilo y push de nuevo.

**¿Puedo usar imágenes JPG en vez de WebP?** Sí, pero WebP es más liviano. Cualquier formato que el navegador soporte funciona.

---

*Ver `PROJECT_CONTEXT.md` para la arquitectura general del proyecto.*
