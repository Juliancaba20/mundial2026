# Copa Mundial FIFA 2026

Aplicación web construida con Next.js 16.

## Cómo ejecutarla localmente

### Requisito previo
Necesitás tener Node.js instalado. Si no lo tenés:
1. Ir a https://nodejs.org
2. Descargar la versión "LTS" (la recomendada)
3. Instalarlo como cualquier programa

### Pasos para ejecutar
1. Abrir una terminal (en Mac: buscar "Terminal", en Windows: buscar "PowerShell")
2. Navegar a la carpeta del proyecto: `cd mundial2026`
3. Instalar dependencias (solo la primera vez): `npm install`
4. Iniciar el servidor de desarrollo: `npm run dev`
5. Abrir el navegador en: http://localhost:3000

## Cómo publicarlo en Vercel (gratis)

1. Crear cuenta en https://vercel.com (con tu cuenta de GitHub/Google)
2. Subir el proyecto a GitHub (o usar la CLI de Vercel)
3. En Vercel, hacer click en "Add New Project"
4. Seleccionar el repositorio
5. Click en "Deploy" — Vercel detecta Next.js automáticamente
6. En ~2 minutos tenés una URL pública

## URLs de la aplicación

- `/` — Inicio con hero, countdown y partidos destacados
- `/grupos` — Los 12 grupos del Mundial
- `/grupo/j` — Grupo J (Argentina)
- `/partidos` — Todos los partidos con resultados en vivo
- `/eliminatorias` — Cuadro de rondas eliminatorias
- `/equipo/argentina` — Página de Argentina
- `/equipo/brasil` — Página de Brasil (y así con cualquier equipo)
- `/noticias/argentina-campeona-busca-bicampeonato` — Artículo
