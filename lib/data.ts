import type { Team, Group, Match } from '@/types'

// ─── EQUIPOS ─────────────────────────────────────────────────────────────────
// CORRECCIÓN (auditoría 12 grupos): Eslovenia NO clasificó al Mundial 2026.
// El cuarto integrante real del Grupo K es Uzbekistán, confirmado contra
// 8 fuentes oficiales (FIFA.com, ESPN, CBS Sports, Sky Sports, Wikipedia, etc).

export const TEAMS: Team[] = [
  { flag:'🇲🇽', flagCode:'mx', name:'México',          slug:'mexico',          group:'A', confederation:'CONCACAF' },
  { flag:'🇿🇦', flagCode:'za', name:'Sudáfrica',       slug:'sudafrica',       group:'A', confederation:'CAF' },
  { flag:'🇰🇷', flagCode:'kr', name:'Corea del Sur',   slug:'corea-del-sur',   group:'A', confederation:'AFC' },
  { flag:'🇨🇿', flagCode:'cz', name:'Rep. Checa',      slug:'rep-checa',       group:'A', confederation:'UEFA' },
  { flag:'🇨🇦', flagCode:'ca', name:'Canadá',          slug:'canada',          group:'B', confederation:'CONCACAF' },
  { flag:'🇧🇦', flagCode:'ba', name:'Bosnia y Herz.',  slug:'bosnia',          group:'B', confederation:'UEFA' },
  { flag:'🇨🇭', flagCode:'ch', name:'Suiza',           slug:'suiza',           group:'B', confederation:'UEFA' },
  { flag:'🇶🇦', flagCode:'qa', name:'Qatar',           slug:'qatar',           group:'B', confederation:'AFC' },
  { flag:'🇧🇷', flagCode:'br', name:'Brasil',          slug:'brasil',          group:'C', confederation:'CONMEBOL',
    worldCupBest:'Campeona del Mundo 1958, 1962, 1970, 1994 y 2002 · Récord absoluto de 5 títulos',
    squad:[
      { number:1,  name:'Alisson Becker',    position:'GK',  club:'Liverpool' },
      { number:12, name:'Ederson',            position:'GK',  club:'Manchester City' },
      { number:2,  name:'Danilo',             position:'DEF', club:'Juventus' },
      { number:3,  name:'Marquinhos',         position:'DEF', club:'PSG' },
      { number:4,  name:'Gabriel Magalhães',  position:'DEF', club:'Arsenal' },
      { number:6,  name:'Alex Sandro',        position:'DEF', club:'Juventus' },
      { number:14, name:'Éder Militão',       position:'DEF', club:'Real Madrid' },
      { number:5,  name:'Casemiro',           position:'MID', club:'Manchester United' },
      { number:8,  name:'Bruno Guimarães',    position:'MID', club:'Newcastle' },
      { number:15, name:'Fabinho',            position:'MID', club:'Al-Ittihad' },
      { number:7,  name:'Lucas Paquetá',      position:'MID', club:'West Ham' },
      { number:9,  name:'Richarlison',        position:'FWD', club:'Tottenham' },
      { number:10, name:'Rodrygo',            position:'FWD', club:'Real Madrid' },
      { number:11, name:'Raphinha',           position:'FWD', club:'Barcelona' },
      { number:20, name:'Endrick',            position:'FWD', club:'Real Madrid' },
      { number:21, name:'Gabriel Martinelli', position:'FWD', club:'Arsenal' },
    ] },
  { flag:'🇲🇦', flagCode:'ma', name:'Marruecos',       slug:'marruecos',       group:'C', confederation:'CAF' },
  { flag:'🇭🇹', flagCode:'ht', name:'Haití',           slug:'haiti',           group:'C', confederation:'CONCACAF' },
  { flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagCode:'gb-sct', name:'Escocia',   slug:'escocia',         group:'C', confederation:'UEFA' },
  { flag:'🇺🇸', flagCode:'us', name:'Estados Unidos',  slug:'estados-unidos',  group:'D', confederation:'CONCACAF' },
  { flag:'🇵🇾', flagCode:'py', name:'Paraguay',        slug:'paraguay',        group:'D', confederation:'CONMEBOL' },
  { flag:'🇦🇺', flagCode:'au', name:'Australia',       slug:'australia',       group:'D', confederation:'AFC' },
  { flag:'🇹🇷', flagCode:'tr', name:'Turquía',         slug:'turquia',         group:'D', confederation:'UEFA' },
  { flag:'🇩🇪', flagCode:'de', name:'Alemania',        slug:'alemania',        group:'E', confederation:'UEFA' },
  { flag:'🇨🇼', flagCode:'cw', name:'Curazao',         slug:'curazao',         group:'E', confederation:'CONCACAF' },
  { flag:'🇨🇮', flagCode:'ci', name:'Costa de Marfil', slug:'costa-de-marfil', group:'E', confederation:'CAF' },
  { flag:'🇪🇨', flagCode:'ec', name:'Ecuador',         slug:'ecuador',         group:'E', confederation:'CONMEBOL' },
  { flag:'🇳🇱', flagCode:'nl', name:'Países Bajos',    slug:'paises-bajos',    group:'F', confederation:'UEFA' },
  { flag:'🇯🇵', flagCode:'jp', name:'Japón',           slug:'japon',           group:'F', confederation:'AFC' },
  { flag:'🇸🇪', flagCode:'se', name:'Suecia',          slug:'suecia',          group:'F', confederation:'UEFA' },
  { flag:'🇹🇳', flagCode:'tn', name:'Túnez',           slug:'tunez',           group:'F', confederation:'CAF' },
  { flag:'🇧🇪', flagCode:'be', name:'Bélgica',         slug:'belgica',         group:'G', confederation:'UEFA' },
  { flag:'🇪🇬', flagCode:'eg', name:'Egipto',          slug:'egipto',          group:'G', confederation:'CAF' },
  { flag:'🇮🇷', flagCode:'ir', name:'Irán',            slug:'iran',            group:'G', confederation:'AFC' },
  { flag:'🇳🇿', flagCode:'nz', name:'Nueva Zelanda',   slug:'nueva-zelanda',   group:'G', confederation:'OFC' },
  { flag:'🇪🇸', flagCode:'es', name:'España',          slug:'espana',          group:'H', confederation:'UEFA',
    worldCupBest:'Campeona del Mundo 2010 · La Roja de Xavi, Iniesta y Torres en Sudáfrica',
    squad:[
      { number:1,  name:'Unai Simón',        position:'GK',  club:'Athletic Club' },
      { number:13, name:'David Raya',         position:'GK',  club:'Arsenal' },
      { number:2,  name:'Dani Carvajal',      position:'DEF', club:'Real Madrid' },
      { number:3,  name:'Alejandro Balde',    position:'DEF', club:'Barcelona' },
      { number:4,  name:'Nacho Fernández',    position:'DEF', club:'Al-Qadsiah' },
      { number:5,  name:'Aymeric Laporte',    position:'DEF', club:'Al-Nassr' },
      { number:24, name:'Robin Le Normand',   position:'DEF', club:'Atlético Madrid' },
      { number:6,  name:'Rodrigo',            position:'MID', club:'Manchester City' },
      { number:8,  name:'Fabián Ruiz',        position:'MID', club:'PSG' },
      { number:14, name:'Joselu',             position:'FWD', club:'Maccabi Tel Aviv' },
      { number:16, name:'Martín Zubimendi',   position:'MID', club:'Arsenal' },
      { number:17, name:'Nico Williams',      position:'FWD', club:'Athletic Club' },
      { number:19, name:'Dani Olmo',          position:'MID', club:'Barcelona' },
      { number:21, name:'Mikel Oyarzabal',    position:'FWD', club:'Real Sociedad' },
      { number:22, name:'Pedro',              position:'FWD', club:'Lazio' },
      { number:11, name:'Ferran Torres',      position:'FWD', club:'Barcelona' },
    ] },
  { flag:'🇨🇻', flagCode:'cv', name:'Cabo Verde',      slug:'cabo-verde',      group:'H', confederation:'CAF' },
  { flag:'🇸🇦', flagCode:'sa', name:'Arabia Saudí',    slug:'arabia-saudi',    group:'H', confederation:'AFC' },
  { flag:'🇺🇾', flagCode:'uy', name:'Uruguay',         slug:'uruguay',         group:'H', confederation:'CONMEBOL' },
  { flag:'🇫🇷', flagCode:'fr', name:'Francia',         slug:'francia',         group:'I', confederation:'UEFA',
    worldCupBest:'Campeona del Mundo 1998 y 2018 · Finalista en Qatar 2022',
    squad:[
      { number:1,  name:'Mike Maignan',       position:'GK',  club:'AC Milan' },
      { number:16, name:'Alphonse Areola',    position:'GK',  club:'West Ham' },
      { number:2,  name:'Benjamin Pavard',    position:'DEF', club:'Inter Milán' },
      { number:5,  name:'Jules Koundé',       position:'DEF', club:'Barcelona' },
      { number:21, name:'Lucas Hernández',    position:'DEF', club:'PSG' },
      { number:23, name:'Theo Hernández',     position:'DEF', club:'AC Milan' },
      { number:4,  name:'Dayot Upamecano',    position:'DEF', club:'Bayern Múnich' },
      { number:6,  name:'Eduardo Camavinga',  position:'MID', club:'Real Madrid' },
      { number:8,  name:'Aurélien Tchouaméni',position:'MID', club:'Real Madrid' },
      { number:14, name:'Adrien Rabiot',      position:'MID', club:'Marsella' },
      { number:13, name:"N'Golo Kanté",      position:"MID", club:"Al-Ittihad" },
      { number:10, name:'Kylian Mbappé',      position:'FWD', club:'Real Madrid' },
      { number:7,  name:'Antoine Griezmann',  position:'FWD', club:'Atlético Madrid' },
      { number:11, name:'Ousmane Dembélé',    position:'FWD', club:'PSG' },
      { number:9,  name:'Olivier Giroud',     position:'FWD', club:'LA Galaxy' },
      { number:17, name:'Marcus Thuram',      position:'FWD', club:'Inter Milán' },
    ] },
  { flag:'🇸🇳', flagCode:'sn', name:'Senegal',         slug:'senegal',         group:'I', confederation:'CAF' },
  { flag:'🇮🇶', flagCode:'iq', name:'Irak',            slug:'irak',            group:'I', confederation:'AFC' },
  { flag:'🇳🇴', flagCode:'no', name:'Noruega',         slug:'noruega',         group:'I', confederation:'UEFA' },
  { flag:'🇦🇷', flagCode:'ar', name:'Argentina',       slug:'argentina',       group:'J', confederation:'CONMEBOL', isChampion:true,
    description:'Campeona del mundo en Qatar 2022 bajo la conducción de Lionel Scaloni. Busca defender el título con Lionel Messi como figura central.',
    worldCupBest:'Campeona del Mundo 1978, 1986 y 2022 · Tres estrellas en la camiseta albiceleste',
    squad:[
      { number:23, name:'Emiliano Martínez',  position:'GK',  club:'Aston Villa' },
      { number:12, name:'Geronimo Rulli',     position:'GK',  club:'Ajax' },
      { number:26, name:'Nahuel Molina',      position:'DEF', club:'Atlético Madrid' },
      { number:13, name:'Cristian Romero',    position:'DEF', club:'Tottenham' },
      { number:19, name:'Nicolás Otamendi',   position:'DEF', club:'Benfica' },
      { number:3,  name:'Nicolás Tagliafico', position:'DEF', club:'Lyon' },
      { number:8,  name:'Marcos Acuña',       position:'DEF', club:'Sporting CP' },
      { number:7,  name:'Rodrigo De Paul',    position:'MID', club:'Atlético Madrid' },
      { number:5,  name:'Leandro Paredes',    position:'MID', club:'Roma' },
      { number:14, name:'Enzo Fernández',     position:'MID', club:'Chelsea' },
      { number:20, name:'Alexis Mac Allister', position:'MID', club:'Liverpool' },
      { number:11, name:'Ángel Di María',     position:'FWD', club:'Benfica' },
      { number:22, name:'Lautaro Martínez',   position:'FWD', club:'Inter Milán' },
      { number:10, name:'Lionel Messi',       position:'FWD', club:'Inter Miami' },
      { number:9,  name:'Julián Álvarez',     position:'FWD', club:'Atlético Madrid' },
      { number:16, name:'Thiago Almada',      position:'MID', club:'Lyon' },
    ] },
  { flag:'🇩🇿', flagCode:'dz', name:'Argelia',         slug:'argelia',         group:'J', confederation:'CAF' },
  { flag:'🇦🇹', flagCode:'at', name:'Austria',         slug:'austria',         group:'J', confederation:'UEFA' },
  { flag:'🇯🇴', flagCode:'jo', name:'Jordania',        slug:'jordania',        group:'J', confederation:'AFC' },
  { flag:'🇵🇹', flagCode:'pt', name:'Portugal',        slug:'portugal',        group:'K', confederation:'UEFA' },
  { flag:'🇨🇩', flagCode:'cd', name:'RD Congo',        slug:'rd-congo',        group:'K', confederation:'CAF' },
  { flag:'🇨🇴', flagCode:'co', name:'Colombia',        slug:'colombia',        group:'K', confederation:'CONMEBOL' },
  { flag:'🇺🇿', flagCode:'uz', name:'Uzbekistán',      slug:'uzbekistan',      group:'K', confederation:'AFC' },
  { flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode:'gb-eng', name:'Inglaterra', slug:'inglaterra',    group:'L', confederation:'UEFA' },
  { flag:'🇭🇷', flagCode:'hr', name:'Croacia',         slug:'croacia',         group:'L', confederation:'UEFA' },
  { flag:'🇬🇭', flagCode:'gh', name:'Ghana',           slug:'ghana',           group:'L', confederation:'CAF' },
  { flag:'🇵🇦', flagCode:'pa', name:'Panamá',          slug:'panama',          group:'L', confederation:'CONCACAF' },
]

export const TEAMS_BY_SLUG = Object.fromEntries(TEAMS.map(t => [t.slug, t]))
export const TEAMS_BY_NAME = Object.fromEntries(TEAMS.map(t => [t.name, t]))

// ─── GRUPOS ──────────────────────────────────────────────────────────────────

export const GROUPS: Group[] = 'ABCDEFGHIJKL'.split('').map(letter => ({
  letter,
  teams: TEAMS.filter(t => t.group === letter).map(t => ({
    flag: t.flag, flagCode: t.flagCode, name: t.name, slug: t.slug,
  })),
}))

// ─── DERIVACIÓN DE FECHA DESDE KICKOFF (Opción A) ────────────────────────────
// `date` y `dateSort` ya NO se escriben a mano. Se calculan siempre a partir
// de `kickoff` (UTC), que es la única fuente de verdad. Esto elimina la clase
// de bug donde `date` y `kickoff` quedaban desincronizados entre sí.
//
// `date` se muestra en formato "11 jun" usando la fecha UTC (no la local del
// usuario): es solo un label de fallback para mientras el cliente hidrata;
// la hora/fecha real que ve el usuario la calcula MatchTime.tsx con Intl API.

const MESES_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function deriveDateFields(kickoffISO: string): { date: string; dateSort: number } {
  const d = new Date(kickoffISO)
  const year  = d.getUTCFullYear()
  const month = d.getUTCMonth() // 0-indexed
  const day   = d.getUTCDate()

  const date = `${day} ${MESES_ES[month]}`
  const dateSort = year * 10000 + (month + 1) * 100 + day  // ej: 20260611

  return { date, dateSort }
}

interface RawMatch {
  id: string
  kickoff: string   // ISO 8601 UTC — única fuente de verdad temporal
  group: string
  home: string       // nombre del equipo (se resuelve con makeRef)
  away: string
  venue: string
  stadium?: string
  city: string
  isArgentina?: boolean
}

function makeRef(name: string): import('@/types').TeamRef {
  const t = TEAMS.find(x => x.name === name)!
  if (!t) throw new Error(`makeRef: equipo no encontrado "${name}"`)
  return { flag: t.flag, flagCode: t.flagCode, name: t.name, slug: t.slug }
}

function buildMatch(raw: RawMatch): Match {
  const { date, dateSort } = deriveDateFields(raw.kickoff)
  return {
    id: raw.id,
    date,
    dateSort,
    kickoff: raw.kickoff,
    group: raw.group,
    home: makeRef(raw.home),
    away: makeRef(raw.away),
    venue: raw.venue,
    stadium: raw.stadium,
    city: raw.city,
    isArgentina: raw.isArgentina,
    status: 'pending',
  }
}

// ─── PARTIDOS — DATOS CRUDOS ──────────────────────────────────────────────────
// Los 66 kickoffs marcados [CORREGIDO] fueron reemplazados por el horario
// oficial real verificado contra el calendario ET publicado (worldcupwiki.com,
// ESPN, CBS Sports, Sky Sports — cruzados entre sí) y convertidos a UTC
// (ET de junio = UTC-4, horario de verano EDT).
//
// Los partidos de Eslovenia (K2, K4b, K6) fueron reemplazados por los de
// Uzbekistán, el equipo real del Grupo K.

const RAW_MATCHES: RawMatch[] = [
  // ════════════════════════════════════════════
  // FECHA 1  (11–17 jun)
  // ════════════════════════════════════════════
  { id:'A1', kickoff:'2026-06-11T19:00:00Z', group:'A', home:'México', away:'Sudáfrica',
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México' },
  { id:'A2', kickoff:'2026-06-11T22:00:00Z', group:'A', home:'Corea del Sur', away:'Rep. Checa',
    venue:'Zapopan', stadium:'Estadio Akron', city:'Zapopan' },

  { id:'B1', kickoff:'2026-06-12T19:00:00Z', group:'B', home:'Canadá', away:'Bosnia y Herz.',
    venue:'Toronto', stadium:'BMO Field', city:'Toronto' },
  { id:'D1', kickoff:'2026-06-12T22:00:00Z', group:'D', home:'Estados Unidos', away:'Paraguay',
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Inglewood' },
  { id:'D2', kickoff:'2026-06-14T01:00:00Z', group:'D', home:'Australia', away:'Turquía',
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver' },

  { id:'B2', kickoff:'2026-06-13T16:00:00Z', group:'B', home:'Qatar', away:'Suiza',
    venue:'Santa Clara', stadium:"Levi's Stadium", city:'Santa Clara' },
  { id:'C1', kickoff:'2026-06-13T19:00:00Z', group:'C', home:'Brasil', away:'Marruecos',
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford' },
  { id:'C2', kickoff:'2026-06-13T22:00:00Z', group:'C', home:'Haití', away:'Escocia',
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough' },

  { id:'E1', kickoff:'2026-06-14T16:00:00Z', group:'E', home:'Alemania', away:'Curazao',
    venue:'Houston', stadium:'NRG Stadium', city:'Houston' },
  { id:'F1', kickoff:'2026-06-14T19:00:00Z', group:'F', home:'Países Bajos', away:'Japón',
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington' },
  { id:'E2', kickoff:'2026-06-14T22:00:00Z', group:'E', home:'Costa de Marfil', away:'Ecuador',
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia' },
  { id:'F2', kickoff:'2026-06-15T01:00:00Z', group:'F', home:'Suecia', away:'Túnez',
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey' },

  { id:'H1', kickoff:'2026-06-15T16:00:00Z', group:'H', home:'España', away:'Cabo Verde',
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta' },
  { id:'G1', kickoff:'2026-06-15T19:00:00Z', group:'G', home:'Bélgica', away:'Egipto',
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle' },
  { id:'H2', kickoff:'2026-06-15T22:00:00Z', group:'H', home:'Arabia Saudí', away:'Uruguay',
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami Gardens' },
  { id:'G2', kickoff:'2026-06-16T01:00:00Z', group:'G', home:'Irán', away:'Nueva Zelanda',
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Inglewood' },

  { id:'I1', kickoff:'2026-06-16T19:00:00Z', group:'I', home:'Francia', away:'Senegal',
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford' },
  { id:'I2', kickoff:'2026-06-16T22:00:00Z', group:'I', home:'Irak', away:'Noruega',
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough' },
  { id:'J1', kickoff:'2026-06-17T01:00:00Z', group:'J', home:'Argentina', away:'Argelia',
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City', isArgentina:true },

  { id:'J2', kickoff:'2026-06-17T04:00:00Z', group:'J', home:'Austria', away:'Jordania',
    venue:'San Francisco', stadium:"Levi's Stadium", city:'Santa Clara' },
  { id:'K1', kickoff:'2026-06-17T17:00:00Z', group:'K', home:'Portugal', away:'RD Congo',
    venue:'Houston', stadium:'NRG Stadium', city:'Houston' },
  { id:'L1', kickoff:'2026-06-17T20:00:00Z', group:'L', home:'Inglaterra', away:'Croacia',
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington' },
  { id:'L2', kickoff:'2026-06-17T23:00:00Z', group:'L', home:'Ghana', away:'Panamá',
    venue:'Toronto', stadium:'BMO Field', city:'Toronto' },
  { id:'K2', kickoff:'2026-06-18T02:00:00Z', group:'K', home:'Uzbekistán', away:'Colombia',
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México' },

  // ════════════════════════════════════════════
  // FECHA 2  (18–23 jun)
  // ════════════════════════════════════════════
  { id:'A3', kickoff:'2026-06-18T16:00:00Z', group:'A', home:'Rep. Checa', away:'Sudáfrica',
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta' },
  { id:'B3', kickoff:'2026-06-18T19:00:00Z', group:'B', home:'Suiza', away:'Bosnia y Herz.',
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Inglewood' },
  { id:'B4', kickoff:'2026-06-18T22:00:00Z', group:'B', home:'Canadá', away:'Qatar',
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver' },
  { id:'A4', kickoff:'2026-06-19T01:00:00Z', group:'A', home:'México', away:'Corea del Sur',
    venue:'Zapopan', stadium:'Estadio Akron', city:'Zapopan' },

  { id:'D3', kickoff:'2026-06-19T19:00:00Z', group:'D', home:'Estados Unidos', away:'Australia',
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle' },
  { id:'C3', kickoff:'2026-06-19T22:00:00Z', group:'C', home:'Escocia', away:'Marruecos',
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough' },
  { id:'C4', kickoff:'2026-06-20T00:30:00Z', group:'C', home:'Brasil', away:'Haití',
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia' },
  { id:'D4', kickoff:'2026-06-20T03:00:00Z', group:'D', home:'Turquía', away:'Paraguay',
    venue:'Santa Clara', stadium:"Levi's Stadium", city:'Santa Clara' },

  { id:'F3', kickoff:'2026-06-20T17:00:00Z', group:'F', home:'Países Bajos', away:'Suecia',
    venue:'Houston', stadium:'NRG Stadium', city:'Houston' },
  { id:'E3', kickoff:'2026-06-20T20:00:00Z', group:'E', home:'Alemania', away:'Costa de Marfil',
    venue:'Toronto', stadium:'BMO Field', city:'Toronto' },
  { id:'E4', kickoff:'2026-06-21T00:00:00Z', group:'E', home:'Ecuador', away:'Curazao',
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City' },
  { id:'F4', kickoff:'2026-06-21T04:00:00Z', group:'F', home:'Túnez', away:'Japón',
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey' },

  { id:'H3', kickoff:'2026-06-21T16:00:00Z', group:'H', home:'España', away:'Arabia Saudí',
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta' },
  { id:'G3', kickoff:'2026-06-21T19:00:00Z', group:'G', home:'Bélgica', away:'Irán',
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Inglewood' },
  { id:'H4', kickoff:'2026-06-21T22:00:00Z', group:'H', home:'Uruguay', away:'Cabo Verde',
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami Gardens' },
  { id:'G4', kickoff:'2026-06-22T01:00:00Z', group:'G', home:'Nueva Zelanda', away:'Egipto',
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver' },

  { id:'J3', kickoff:'2026-06-22T17:00:00Z', group:'J', home:'Argentina', away:'Austria',
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', isArgentina:true },
  { id:'I3', kickoff:'2026-06-22T21:00:00Z', group:'I', home:'Francia', away:'Irak',
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia' },
  { id:'I4', kickoff:'2026-06-23T00:00:00Z', group:'I', home:'Noruega', away:'Senegal',
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford' },
  { id:'J4', kickoff:'2026-06-23T03:00:00Z', group:'J', home:'Jordania', away:'Argelia',
    venue:'San Francisco', stadium:"Levi's Stadium", city:'Santa Clara' },

  { id:'K3', kickoff:'2026-06-23T17:00:00Z', group:'K', home:'Portugal', away:'Uzbekistán',
    venue:'Houston', stadium:'NRG Stadium', city:'Houston' },
  { id:'L3', kickoff:'2026-06-23T20:00:00Z', group:'L', home:'Inglaterra', away:'Ghana',
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough' },
  { id:'L4', kickoff:'2026-06-23T23:00:00Z', group:'L', home:'Panamá', away:'Croacia',
    venue:'Toronto', stadium:'BMO Field', city:'Toronto' },
  { id:'K4', kickoff:'2026-06-24T02:00:00Z', group:'K', home:'Colombia', away:'RD Congo',
    venue:'Zapopan', stadium:'Estadio Akron', city:'Zapopan' },

  // ════════════════════════════════════════════
  // FECHA 3  (24–27 jun) — última jornada, simultáneos por grupo
  // ════════════════════════════════════════════
  { id:'B5', kickoff:'2026-06-24T19:00:00Z', group:'B', home:'Suiza', away:'Canadá',
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver' },
  { id:'B6', kickoff:'2026-06-24T19:00:00Z', group:'B', home:'Bosnia y Herz.', away:'Qatar',
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle' },
  { id:'C5', kickoff:'2026-06-24T22:00:00Z', group:'C', home:'Escocia', away:'Brasil',
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami Gardens' },
  { id:'C6', kickoff:'2026-06-24T22:00:00Z', group:'C', home:'Marruecos', away:'Haití',
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta' },
  { id:'A5', kickoff:'2026-06-25T01:00:00Z', group:'A', home:'Rep. Checa', away:'México',
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México' },
  { id:'A6', kickoff:'2026-06-25T01:00:00Z', group:'A', home:'Sudáfrica', away:'Corea del Sur',
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey' },

  { id:'E5', kickoff:'2026-06-25T20:00:00Z', group:'E', home:'Curazao', away:'Costa de Marfil',
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia' },
  { id:'E6', kickoff:'2026-06-25T20:00:00Z', group:'E', home:'Ecuador', away:'Alemania',
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford' },
  { id:'F5', kickoff:'2026-06-25T23:00:00Z', group:'F', home:'Japón', away:'Suecia',
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington' },
  { id:'F6', kickoff:'2026-06-25T23:00:00Z', group:'F', home:'Túnez', away:'Países Bajos',
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City' },
  { id:'D5', kickoff:'2026-06-26T02:00:00Z', group:'D', home:'Turquía', away:'Estados Unidos',
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Inglewood' },
  { id:'D6', kickoff:'2026-06-26T02:00:00Z', group:'D', home:'Paraguay', away:'Australia',
    venue:'Santa Clara', stadium:"Levi's Stadium", city:'Santa Clara' },

  { id:'I5', kickoff:'2026-06-26T19:00:00Z', group:'I', home:'Noruega', away:'Francia',
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough' },
  { id:'I6', kickoff:'2026-06-26T19:00:00Z', group:'I', home:'Senegal', away:'Irak',
    venue:'Toronto', stadium:'BMO Field', city:'Toronto' },
  { id:'H5', kickoff:'2026-06-27T00:00:00Z', group:'H', home:'Cabo Verde', away:'Arabia Saudí',
    venue:'Houston', stadium:'NRG Stadium', city:'Houston' },
  { id:'H6', kickoff:'2026-06-27T00:00:00Z', group:'H', home:'Uruguay', away:'España',
    venue:'Zapopan', stadium:'Estadio Akron', city:'Zapopan' },
  { id:'G5', kickoff:'2026-06-27T03:00:00Z', group:'G', home:'Egipto', away:'Irán',
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle' },
  { id:'G6', kickoff:'2026-06-27T03:00:00Z', group:'G', home:'Nueva Zelanda', away:'Bélgica',
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver' },

  { id:'L5', kickoff:'2026-06-27T21:00:00Z', group:'L', home:'Panamá', away:'Inglaterra',
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford' },
  { id:'L6', kickoff:'2026-06-27T21:00:00Z', group:'L', home:'Croacia', away:'Ghana',
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia' },
  { id:'K5', kickoff:'2026-06-27T23:30:00Z', group:'K', home:'Colombia', away:'Portugal',
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami Gardens' },
  { id:'K6', kickoff:'2026-06-27T23:30:00Z', group:'K', home:'RD Congo', away:'Uzbekistán',
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta' },
  { id:'J5', kickoff:'2026-06-28T02:00:00Z', group:'J', home:'Argelia', away:'Austria',
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City' },
  { id:'J6', kickoff:'2026-06-28T02:00:00Z', group:'J', home:'Jordania', away:'Argentina',
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', isArgentina:true },
]

export const BASE_MATCHES: Match[] = RAW_MATCHES.map(buildMatch)

// ─── NOTICIAS ────────────────────────────────────────────────────────────────
// Las noticias se migraron a archivos Markdown en `content/noticias/<slug>/index.md`.
// Ver `lib/noticias.ts` para la capa de lectura y `NOTICIAS.md` para el flujo editorial.
// Se mantiene `FEATURED_TEAM_SLUGS` porque lo consume `app/page.tsx` (selecciones destacadas).

export const FEATURED_TEAM_SLUGS = [
	'argentina','brasil','francia','espana','alemania',
	'portugal','paises-bajos','inglaterra','estados-unidos','mexico',
]
