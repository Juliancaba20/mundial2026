// automation/config.ts
// ─── Configuración central del sistema de auto-publicación ───────────────────
// Modificar solo este archivo para cambiar el comportamiento del sistema.
// No hay valores hardcodeados en ningún otro módulo.

export const CONFIG = {
  // ─── Proyecto ──────────────────────────────────────────────────────────────
  topic: 'Mundial 2026',
  language: 'es' as const,

  // ─── Publicación ───────────────────────────────────────────────────────────
  minArticles: 1,        // si hay menos noticias relevantes, no publicar nada
  maxArticles: 5,        // máximo de noticias por ejecución
  featuredCount: 2,      // cuántas noticias se marcan como featured: true

  // ─── Horario (configurado en el workflow de GitHub Actions) ────────────────
  // El cron vive en .github/workflows/auto-news.yml
  // timezone reference: 'America/Argentina/Buenos_Aires' (UTC-3)
  // cron: '0 11 * * *' = 08:00 AM Argentina

  // ─── Directorios (relativos a la raíz del proyecto) ────────────────────────
  contentDir: 'content/noticias',
  publicDir: 'public/noticias',
  stateFile: 'automation/state/published.json',

  // ─── Categorías válidas ────────────────────────────────────────────────────
  categories: [
    'Resultados',
    'Análisis',
    'Favoritos',
    'Sede',
    'Historia',
    'Noticias de selecciones',
  ] as const,

  // ─── Slugs de equipos válidos (deben coincidir con lib/data.ts) ────────────
  teamSlugs: [
    'mexico', 'sudafrica', 'corea-del-sur', 'rep-checa',
    'canada', 'bosnia', 'suiza', 'qatar',
    'brasil', 'marruecos', 'haiti', 'escocia',
    'estados-unidos', 'paraguay', 'australia', 'turquia',
    'alemania', 'curazao', 'costa-de-marfil', 'ecuador',
    'paises-bajos', 'japon', 'suecia', 'tunez',
    'belgica', 'egipto', 'iran', 'nueva-zelanda',
    'espana', 'cabo-verde', 'arabia-saudi', 'uruguay',
    'francia', 'senegal', 'irak', 'noruega',
    'argentina', 'argelia', 'austria', 'jordania',
    'portugal', 'rd-congo', 'colombia', 'uzbekistan',
    'inglaterra', 'croacia', 'ghana', 'panama',
  ] as const,

  // ─── RSS feeds (fuentes de noticias) ───────────────────────────────────────
  rssFeeds: [
    {
      name: 'FIFA',
      url: 'https://www.fifa.com/en/football-news.rss',
      weight: 1.5, // factor multiplicador de score
    },
    {
      name: 'ESPN Deportes',
      url: 'https://www.espn.com/espn/rss/soccer/news',
      weight: 1.2,
    },
    {
      name: 'Marca',
      url: 'https://www.marca.com/rss/futbol/mundial.xml',
      weight: 1.2,
    },
    {
      name: 'AS',
      url: 'https://as.com/rss/tags/copa_del_mundo.xml',
      weight: 1.1,
    },
    {
      name: 'BBC Sport',
      url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
      weight: 1.0,
    },
  ],

  // ─── LLM provider ──────────────────────────────────────────────────────────
  llm: {
    provider: 'groq' as 'groq' | 'gemini' | 'openrouter',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1400,
    temperature: 0.35,
    retries: 3,
    retryDelayMs: 2000,
  },

  // ─── Image provider ────────────────────────────────────────────────────────
  images: {
    provider: 'pollinations' as 'pollinations' | 'unsplash',
    width: 1200,
    height: 675,
    format: 'webp' as const,
    // Plantilla editorial fija — solo se reemplazan {{variables}}
    promptTemplate:
      'FIFA World Cup 2026 stadium atmosphere, {{theme}}, colorful flags {{flags}}, ' +
      'dramatic stadium lighting, packed crowd, photorealistic, cinematic, ' +
      'no players, no text, no logos, no scoreboards, editorial sports photography',
    fallbackToEmoji: true,
  },

  // ─── Git ───────────────────────────────────────────────────────────────────
  git: {
    branch: 'main',
    authorName: 'mundial-bot',
    authorEmail: 'bot@mundial2026.app',
    commitPrefix: 'noticias: auto-publish',
  },
} as const

export type Category = typeof CONFIG.categories[number]
export type TeamSlug = typeof CONFIG.teamSlugs[number]
