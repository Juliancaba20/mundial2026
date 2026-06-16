import type { Team, Group, Match, NewsArticle } from '@/types'

// ─── EQUIPOS ─────────────────────────────────────────────────────────────────

export const TEAMS: Team[] = [
  { flag:'🇲🇽', flagCode:'mx', name:'México',          slug:'mexico',          group:'A', confederation:'CONCACAF' },
  { flag:'🇿🇦', flagCode:'za', name:'Sudáfrica',       slug:'sudafrica',       group:'A', confederation:'CAF' },
  { flag:'🇰🇷', flagCode:'kr', name:'Corea del Sur',   slug:'corea-del-sur',   group:'A', confederation:'AFC' },
  { flag:'🇨🇿', flagCode:'cz', name:'Rep. Checa',      slug:'rep-checa',       group:'A', confederation:'UEFA' },
  { flag:'🇨🇦', flagCode:'ca', name:'Canadá',          slug:'canada',          group:'B', confederation:'CONCACAF' },
  { flag:'🇧🇦', flagCode:'ba', name:'Bosnia y Herz.',  slug:'bosnia',          group:'B', confederation:'UEFA' },
  { flag:'🇨🇭', flagCode:'ch', name:'Suiza',           slug:'suiza',           group:'B', confederation:'UEFA' },
  { flag:'🇶🇦', flagCode:'qa', name:'Qatar',           slug:'qatar',           group:'B', confederation:'AFC' },
  { flag:'🇧🇷', flagCode:'br', name:'Brasil',          slug:'brasil',          group:'C', confederation:'CONMEBOL' },
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
  { flag:'🇪🇸', flagCode:'es', name:'España',          slug:'espana',          group:'H', confederation:'UEFA' },
  { flag:'🇨🇻', flagCode:'cv', name:'Cabo Verde',      slug:'cabo-verde',      group:'H', confederation:'CAF' },
  { flag:'🇸🇦', flagCode:'sa', name:'Arabia Saudí',    slug:'arabia-saudi',    group:'H', confederation:'AFC' },
  { flag:'🇺🇾', flagCode:'uy', name:'Uruguay',         slug:'uruguay',         group:'H', confederation:'CONMEBOL' },
  { flag:'🇫🇷', flagCode:'fr', name:'Francia',         slug:'francia',         group:'I', confederation:'UEFA' },
  { flag:'🇸🇳', flagCode:'sn', name:'Senegal',         slug:'senegal',         group:'I', confederation:'CAF' },
  { flag:'🇮🇶', flagCode:'iq', name:'Irak',            slug:'irak',            group:'I', confederation:'AFC' },
  { flag:'🇳🇴', flagCode:'no', name:'Noruega',         slug:'noruega',         group:'I', confederation:'UEFA' },
  { flag:'🇦🇷', flagCode:'ar', name:'Argentina',       slug:'argentina',       group:'J', confederation:'CONMEBOL', isChampion:true,
    description:'Campeona del mundo en Qatar 2022 bajo la conducción de Lionel Scaloni. Busca defender el título con Lionel Messi como figura central.' },
  { flag:'🇩🇿', flagCode:'dz', name:'Argelia',         slug:'argelia',         group:'J', confederation:'CAF' },
  { flag:'🇦🇹', flagCode:'at', name:'Austria',         slug:'austria',         group:'J', confederation:'UEFA' },
  { flag:'🇯🇴', flagCode:'jo', name:'Jordania',        slug:'jordania',        group:'J', confederation:'AFC' },
  { flag:'🇵🇹', flagCode:'pt', name:'Portugal',        slug:'portugal',        group:'K', confederation:'UEFA' },
  { flag:'🇨🇩', flagCode:'cd', name:'RD Congo',        slug:'rd-congo',        group:'K', confederation:'CAF' },
  { flag:'🇨🇴', flagCode:'co', name:'Colombia',        slug:'colombia',        group:'K', confederation:'CONMEBOL' },
  { flag:'🇸🇮', flagCode:'si', name:'Eslovenia',       slug:'eslovenia',       group:'K', confederation:'UEFA' },
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

// ─── PARTIDOS ────────────────────────────────────────────────────────────────
// Todos los kickoff en UTC. Fuente: calendario oficial FIFA 2026.
// Para ver en hora local el componente MatchTime convierte con Intl API en el browser.

function makeRef(name: string): import('@/types').TeamRef {
  const t = TEAMS.find(x => x.name === name)!
  return { flag: t.flag, flagCode: t.flagCode, name: t.name, slug: t.slug }
}

export const BASE_MATCHES: Match[] = [
  // ════════════════════════════════════════════
  // FECHA 1
  // ════════════════════════════════════════════

  // Grupo A
  { id:'A1', date:'11 jun', dateSort:20260611, kickoff:'2026-06-11T20:00:00Z',
    group:'A', home:makeRef('México'),        away:makeRef('Sudáfrica'),
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México', status:'pending' },
  { id:'A2', date:'11 jun', dateSort:20260611, kickoff:'2026-06-11T23:00:00Z',
    group:'A', home:makeRef('Corea del Sur'), away:makeRef('Rep. Checa'),
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México', status:'pending' },

  // Grupo B
  { id:'B1', date:'12 jun', dateSort:20260612, kickoff:'2026-06-12T20:00:00Z',
    group:'B', home:makeRef('Canadá'),        away:makeRef('Bosnia y Herz.'),
    venue:'Toronto', stadium:'BMO Field', city:'Toronto', status:'pending' },
  { id:'B2', date:'12 jun', dateSort:20260612, kickoff:'2026-06-12T23:00:00Z',
    group:'B', home:makeRef('Suiza'),         away:makeRef('Qatar'),
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver', status:'pending' },

  // Grupo C
  { id:'C1', date:'12 jun', dateSort:20260612, kickoff:'2026-06-13T02:00:00Z',
    group:'C', home:makeRef('Brasil'),        away:makeRef('Marruecos'),
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Los Ángeles', status:'pending' },
  { id:'C2', date:'13 jun', dateSort:20260613, kickoff:'2026-06-13T00:00:00Z',
    group:'C', home:makeRef('Haití'),         away:makeRef('Escocia'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },

  // Grupo D
  { id:'D1', date:'13 jun', dateSort:20260613, kickoff:'2026-06-13T22:00:00Z',
    group:'D', home:makeRef('Estados Unidos'),away:makeRef('Paraguay'),
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford', status:'pending' },
  { id:'D2', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T01:00:00Z',
    group:'D', home:makeRef('Australia'),     away:makeRef('Turquía'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending' },

  // Grupo E
  { id:'E1', date:'13 jun', dateSort:20260613, kickoff:'2026-06-13T19:00:00Z',
    group:'E', home:makeRef('Alemania'),      away:makeRef('Curazao'),
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia', status:'pending' },
  { id:'E2', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T00:00:00Z',
    group:'E', home:makeRef('Costa de Marfil'),away:makeRef('Ecuador'),
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta', status:'pending' },

  // Grupo F
  { id:'F1', date:'13 jun', dateSort:20260613, kickoff:'2026-06-13T22:00:00Z',
    group:'F', home:makeRef('Países Bajos'),  away:makeRef('Japón'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },
  { id:'F2', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T02:00:00Z',
    group:'F', home:makeRef('Suecia'),        away:makeRef('Túnez'),
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey', status:'pending' },

  // Grupo G
  { id:'G1', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T19:00:00Z',
    group:'G', home:makeRef('Bélgica'),       away:makeRef('Egipto'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },
  { id:'G2', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T22:00:00Z',
    group:'G', home:makeRef('Irán'),          away:makeRef('Nueva Zelanda'),
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Los Ángeles', status:'pending' },

  // Grupo H
  { id:'H1', date:'14 jun', dateSort:20260614, kickoff:'2026-06-14T19:00:00Z',
    group:'H', home:makeRef('España'),        away:makeRef('Cabo Verde'),
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta', status:'pending' },
  { id:'H2', date:'15 jun', dateSort:20260615, kickoff:'2026-06-15T01:00:00Z',
    group:'H', home:makeRef('Arabia Saudí'),  away:makeRef('Uruguay'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },

  // Grupo I
  { id:'I1', date:'16 jun', dateSort:20260616, kickoff:'2026-06-16T22:00:00Z',
    group:'I', home:makeRef('Francia'),       away:makeRef('Senegal'),
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford', status:'pending' },
  { id:'I2', date:'17 jun', dateSort:20260617, kickoff:'2026-06-17T01:00:00Z',
    group:'I', home:makeRef('Irak'),          away:makeRef('Noruega'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },

  // Grupo J
  { id:'J1', date:'16 jun', dateSort:20260616, kickoff:'2026-06-16T23:00:00Z',
    group:'J', home:makeRef('Argentina'),     away:makeRef('Argelia'),
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City', status:'pending', isArgentina:true },
  { id:'J2', date:'16 jun', dateSort:20260616, kickoff:'2026-06-16T20:00:00Z',
    group:'J', home:makeRef('Austria'),       away:makeRef('Jordania'),
    venue:'San Francisco', stadium:'Levi\'s Stadium', city:'Santa Clara', status:'pending' },

  // Grupo K
  { id:'K1', date:'16 jun', dateSort:20260616, kickoff:'2026-06-16T23:00:00Z',
    group:'K', home:makeRef('Portugal'),      away:makeRef('RD Congo'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },
  { id:'K2', date:'17 jun', dateSort:20260617, kickoff:'2026-06-17T01:00:00Z',
    group:'K', home:makeRef('Colombia'),      away:makeRef('Eslovenia'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },

  // Grupo L
  { id:'L1', date:'16 jun', dateSort:20260616, kickoff:'2026-06-16T20:00:00Z',
    group:'L', home:makeRef('Inglaterra'),    away:makeRef('Croacia'),
    venue:'Guadalajara', stadium:'Estadio Akron', city:'Zapopan', status:'pending' },
  { id:'L2', date:'17 jun', dateSort:20260617, kickoff:'2026-06-17T00:00:00Z',
    group:'L', home:makeRef('Ghana'),         away:makeRef('Panamá'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },

  // ════════════════════════════════════════════
  // FECHA 2
  // ════════════════════════════════════════════

  // Grupo A
  { id:'A3', date:'20 jun', dateSort:20260620, kickoff:'2026-06-20T22:00:00Z',
    group:'A', home:makeRef('México'),        away:makeRef('Corea del Sur'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending' },
  { id:'A4', date:'20 jun', dateSort:20260620, kickoff:'2026-06-20T22:00:00Z',
    group:'A', home:makeRef('Rep. Checa'),    away:makeRef('Sudáfrica'),
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey', status:'pending' },

  // Grupo B
  { id:'B3', date:'21 jun', dateSort:20260621, kickoff:'2026-06-21T01:00:00Z',
    group:'B', home:makeRef('Bosnia y Herz.'),away:makeRef('Suiza'),
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver', status:'pending' },
  { id:'B4', date:'20 jun', dateSort:20260620, kickoff:'2026-06-20T23:00:00Z',
    group:'B', home:makeRef('Qatar'),         away:makeRef('Canadá'),
    venue:'Toronto', stadium:'BMO Field', city:'Toronto', status:'pending' },

  // Grupo C
  { id:'C3', date:'21 jun', dateSort:20260621, kickoff:'2026-06-21T22:00:00Z',
    group:'C', home:makeRef('Brasil'),        away:makeRef('Haití'),
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Los Ángeles', status:'pending' },
  { id:'C4', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T01:00:00Z',
    group:'C', home:makeRef('Marruecos'),     away:makeRef('Escocia'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },

  // Grupo D
  { id:'D3', date:'21 jun', dateSort:20260621, kickoff:'2026-06-21T19:00:00Z',
    group:'D', home:makeRef('Paraguay'),      away:makeRef('Australia'),
    venue:'San Francisco', stadium:'Levi\'s Stadium', city:'Santa Clara', status:'pending' },
  { id:'D4', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T00:00:00Z',
    group:'D', home:makeRef('Turquía'),       away:makeRef('Estados Unidos'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending' },

  // Grupo E
  { id:'E3', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T22:00:00Z',
    group:'E', home:makeRef('Alemania'),      away:makeRef('Costa de Marfil'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },
  { id:'E4', date:'23 jun', dateSort:20260623, kickoff:'2026-06-23T01:00:00Z',
    group:'E', home:makeRef('Ecuador'),       away:makeRef('Curazao'),
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia', status:'pending' },

  // Grupo F
  { id:'F3', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T19:00:00Z',
    group:'F', home:makeRef('Japón'),         away:makeRef('Suecia'),
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta', status:'pending' },
  { id:'F4b', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T22:00:00Z',
    group:'F', home:makeRef('Túnez'),         away:makeRef('Países Bajos'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },

  // Grupo G
  { id:'G3', date:'23 jun', dateSort:20260623, kickoff:'2026-06-23T22:00:00Z',
    group:'G', home:makeRef('Egipto'),        away:makeRef('Irán'),
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey', status:'pending' },
  { id:'G4b', date:'24 jun', dateSort:20260624, kickoff:'2026-06-24T01:00:00Z',
    group:'G', home:makeRef('Nueva Zelanda'), away:makeRef('Bélgica'),
    venue:'Los Ángeles', stadium:'Rose Bowl', city:'Pasadena', status:'pending' },

  // Grupo H
  { id:'H3', date:'23 jun', dateSort:20260623, kickoff:'2026-06-23T19:00:00Z',
    group:'H', home:makeRef('Uruguay'),       away:makeRef('España'),
    venue:'Los Ángeles', stadium:'Rose Bowl', city:'Pasadena', status:'pending' },
  { id:'H4b', date:'24 jun', dateSort:20260624, kickoff:'2026-06-24T02:00:00Z',
    group:'H', home:makeRef('Cabo Verde'),    away:makeRef('Arabia Saudí'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },

  // Grupo I
  { id:'I3', date:'24 jun', dateSort:20260624, kickoff:'2026-06-24T22:00:00Z',
    group:'I', home:makeRef('Senegal'),       away:makeRef('Irak'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },
  { id:'I4b', date:'25 jun', dateSort:20260625, kickoff:'2026-06-25T01:00:00Z',
    group:'I', home:makeRef('Noruega'),       away:makeRef('Francia'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },

  // Grupo J
  { id:'J3', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T23:00:00Z',
    group:'J', home:makeRef('Argentina'),     away:makeRef('Austria'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending', isArgentina:true },
  { id:'J4b', date:'22 jun', dateSort:20260622, kickoff:'2026-06-22T20:00:00Z',
    group:'J', home:makeRef('Argelia'),       away:makeRef('Jordania'),
    venue:'San Francisco', stadium:'Levi\'s Stadium', city:'Santa Clara', status:'pending' },

  // Grupo K
  { id:'K3', date:'24 jun', dateSort:20260624, kickoff:'2026-06-24T19:00:00Z',
    group:'K', home:makeRef('RD Congo'),      away:makeRef('Colombia'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },
  { id:'K4b', date:'25 jun', dateSort:20260625, kickoff:'2026-06-25T00:00:00Z',
    group:'K', home:makeRef('Eslovenia'),     away:makeRef('Portugal'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },

  // Grupo L
  { id:'L3', date:'24 jun', dateSort:20260624, kickoff:'2026-06-24T22:00:00Z',
    group:'L', home:makeRef('Croacia'),       away:makeRef('Ghana'),
    venue:'Guadalajara', stadium:'Estadio Akron', city:'Zapopan', status:'pending' },
  { id:'L4b', date:'25 jun', dateSort:20260625, kickoff:'2026-06-25T01:00:00Z',
    group:'L', home:makeRef('Panamá'),        away:makeRef('Inglaterra'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },

  // ════════════════════════════════════════════
  // FECHA 3 (simultáneos por grupo)
  // ════════════════════════════════════════════

  { id:'A5', date:'25 jun', dateSort:20260625, kickoff:'2026-06-25T22:00:00Z',
    group:'A', home:makeRef('México'),        away:makeRef('Rep. Checa'),
    venue:'Ciudad de México', stadium:'Estadio Azteca', city:'Ciudad de México', status:'pending' },
  { id:'A6', date:'25 jun', dateSort:20260625, kickoff:'2026-06-25T22:00:00Z',
    group:'A', home:makeRef('Sudáfrica'),     away:makeRef('Corea del Sur'),
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey', status:'pending' },

  { id:'B5', date:'26 jun', dateSort:20260626, kickoff:'2026-06-26T22:00:00Z',
    group:'B', home:makeRef('Bosnia y Herz.'),away:makeRef('Qatar'),
    venue:'Vancouver', stadium:'BC Place', city:'Vancouver', status:'pending' },
  { id:'B6', date:'26 jun', dateSort:20260626, kickoff:'2026-06-26T22:00:00Z',
    group:'B', home:makeRef('Canadá'),        away:makeRef('Suiza'),
    venue:'Toronto', stadium:'BMO Field', city:'Toronto', status:'pending' },

  { id:'C5', date:'26 jun', dateSort:20260626, kickoff:'2026-06-26T02:00:00Z',
    group:'C', home:makeRef('Brasil'),        away:makeRef('Escocia'),
    venue:'Los Ángeles', stadium:'SoFi Stadium', city:'Los Ángeles', status:'pending' },
  { id:'C6', date:'26 jun', dateSort:20260626, kickoff:'2026-06-26T02:00:00Z',
    group:'C', home:makeRef('Marruecos'),     away:makeRef('Haití'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },

  { id:'D5', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T01:00:00Z',
    group:'D', home:makeRef('Estados Unidos'),away:makeRef('Australia'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending' },
  { id:'D6', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T01:00:00Z',
    group:'D', home:makeRef('Paraguay'),      away:makeRef('Turquía'),
    venue:'San Francisco', stadium:'Levi\'s Stadium', city:'Santa Clara', status:'pending' },

  { id:'E5', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T22:00:00Z',
    group:'E', home:makeRef('Alemania'),      away:makeRef('Ecuador'),
    venue:'Filadelfia', stadium:'Lincoln Financial Field', city:'Filadelfia', status:'pending' },
  { id:'E6', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T22:00:00Z',
    group:'E', home:makeRef('Costa de Marfil'),away:makeRef('Curazao'),
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta', status:'pending' },

  { id:'F5', date:'28 jun', dateSort:20260628, kickoff:'2026-06-28T01:00:00Z',
    group:'F', home:makeRef('Países Bajos'),  away:makeRef('Suecia'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },
  { id:'F6', date:'28 jun', dateSort:20260628, kickoff:'2026-06-28T01:00:00Z',
    group:'F', home:makeRef('Japón'),         away:makeRef('Túnez'),
    venue:'Monterrey', stadium:'Estadio BBVA', city:'Monterrey', status:'pending' },

  { id:'G5', date:'28 jun', dateSort:20260628, kickoff:'2026-06-28T22:00:00Z',
    group:'G', home:makeRef('Bélgica'),       away:makeRef('Irán'),
    venue:'Los Ángeles', stadium:'Rose Bowl', city:'Pasadena', status:'pending' },
  { id:'G6', date:'28 jun', dateSort:20260628, kickoff:'2026-06-28T22:00:00Z',
    group:'G', home:makeRef('Egipto'),        away:makeRef('Nueva Zelanda'),
    venue:'Seattle', stadium:'Lumen Field', city:'Seattle', status:'pending' },

  { id:'H5', date:'29 jun', dateSort:20260629, kickoff:'2026-06-29T01:00:00Z',
    group:'H', home:makeRef('España'),        away:makeRef('Arabia Saudí'),
    venue:'Miami', stadium:'Hard Rock Stadium', city:'Miami', status:'pending' },
  { id:'H6', date:'29 jun', dateSort:20260629, kickoff:'2026-06-29T01:00:00Z',
    group:'H', home:makeRef('Uruguay'),       away:makeRef('Cabo Verde'),
    venue:'Atlanta', stadium:'Mercedes-Benz Stadium', city:'Atlanta', status:'pending' },

  { id:'I5', date:'29 jun', dateSort:20260629, kickoff:'2026-06-29T22:00:00Z',
    group:'I', home:makeRef('Francia'),       away:makeRef('Irak'),
    venue:'Nueva York/NJ', stadium:'MetLife Stadium', city:'East Rutherford', status:'pending' },
  { id:'I6', date:'29 jun', dateSort:20260629, kickoff:'2026-06-29T22:00:00Z',
    group:'I', home:makeRef('Noruega'),       away:makeRef('Senegal'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },

  { id:'J5', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T22:00:00Z',
    group:'J', home:makeRef('Jordania'),      away:makeRef('Argentina'),
    venue:'Dallas', stadium:'AT&T Stadium', city:'Arlington', status:'pending', isArgentina:true },
  { id:'J6', date:'27 jun', dateSort:20260627, kickoff:'2026-06-27T22:00:00Z',
    group:'J', home:makeRef('Argelia'),       away:makeRef('Austria'),
    venue:'Kansas City', stadium:'Arrowhead Stadium', city:'Kansas City', status:'pending' },

  { id:'K5', date:'30 jun', dateSort:20260630, kickoff:'2026-06-30T01:00:00Z',
    group:'K', home:makeRef('Portugal'),      away:makeRef('Colombia'),
    venue:'Boston', stadium:'Gillette Stadium', city:'Foxborough', status:'pending' },
  { id:'K6', date:'30 jun', dateSort:20260630, kickoff:'2026-06-30T01:00:00Z',
    group:'K', home:makeRef('RD Congo'),      away:makeRef('Eslovenia'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },

  { id:'L5', date:'30 jun', dateSort:20260630, kickoff:'2026-06-30T22:00:00Z',
    group:'L', home:makeRef('Inglaterra'),    away:makeRef('Panamá'),
    venue:'Guadalajara', stadium:'Estadio Akron', city:'Zapopan', status:'pending' },
  { id:'L6', date:'30 jun', dateSort:20260630, kickoff:'2026-06-30T22:00:00Z',
    group:'L', home:makeRef('Croacia'),       away:makeRef('Ghana'),
    venue:'Houston', stadium:'NRG Stadium', city:'Houston', status:'pending' },
]

// ─── NOTICIAS ────────────────────────────────────────────────────────────────

export const NEWS: NewsArticle[] = [
  {
    slug: 'argentina-campeona-busca-bicampeonato',
    tag: 'Análisis', headline: 'Messi busca el único título que le falta: ser campeón dos veces',
    excerpt: 'La albiceleste llega como gran favorita al Mundial que se juega en suelo americano.',
    body: `Argentina llega al Mundial 2026 como la gran favorita. Campeona en Qatar 2022, la selección de Lionel Scaloni busca repetir la hazaña en suelo americano.\n\nLionel Messi, a sus 38 años, jugará probablemente su último Mundial. El objetivo es claro: ser el primer argentino en ganar dos Copas del Mundo como jugador.\n\nEl equipo mantiene la base ganadora de Qatar, con Dibu Martínez en el arco, la solidez defensiva de Romero y Lisandro Martínez, y la creatividad de De Paul y Enzo Fernández en el medio. Arriba, además de Messi, Di María y Lautaro Martínez completan un ataque temible.\n\nEl Grupo J, con Argelia, Austria y Jordania, parece asequible. El verdadero desafío llegará en las fases eliminatorias.`,
    date: '14 jun 2026', emoji: '🇦🇷', featured: true, relatedTeamSlugs: ['argentina'],
  },
  {
    slug: 'cinco-candidatos-al-titulo',
    tag: 'Favoritos', headline: 'Los 5 candidatos al título según las casas de apuestas',
    excerpt: 'Argentina, Francia, Brasil, España e Inglaterra lideran los pronósticos.',
    body: `Las casas de apuestas tienen su veredicto: Argentina, Francia, Brasil, España e Inglaterra son los cinco principales candidatos al título del Mundial 2026.\n\n**Argentina** lidera como campeona defensora. **Francia** tiene el plantel más talentoso de Europa. **Brasil** busca romper el maleficio que la aleja de la copa desde 2002. **España** llega con el mejor fútbol colectivo. **Inglaterra** confía en que por fin "viene a casa".\n\nEl formato de 48 equipos agrega incertidumbre: hay más partidos, más posibilidades de sorpresas, y el desgaste físico es un factor nuevo.`,
    date: '13 jun 2026', emoji: '🏆', featured: false, relatedTeamSlugs: ['argentina','francia','brasil','espana','inglaterra'],
  },
  {
    slug: 'mundial-48-equipos-el-mas-ambicioso',
    tag: 'Historia', headline: 'Por qué el Mundial de 48 equipos es el más ambicioso de la historia',
    excerpt: 'Por primera vez en la historia, 48 selecciones compiten por la copa.',
    body: `El Mundial 2026 es un torneo histórico en varios sentidos. Por primera vez, 48 selecciones participan en la Copa del Mundo.\n\nTres países sede —Estados Unidos, México y Canadá— albergan 104 partidos en 16 estadios durante 39 días. Es el Mundial más ambicioso logísticamente de la historia.\n\nEl nuevo formato incluye 12 grupos de 4 equipos, donde clasifican los dos primeros de cada grupo y los ocho mejores terceros, totalizando 32 equipos para la fase de 16avos.`,
    date: '12 jun 2026', emoji: '📖', featured: false, relatedTeamSlugs: [],
  },
  {
    slug: 'metlife-stadium-la-final',
    tag: 'Sede', headline: 'MetLife Stadium: la final más esperada se jugará en Nueva York',
    excerpt: 'El estadio de los Giants y los Jets albergará la final del 19 de julio.',
    body: `El MetLife Stadium de East Rutherford, Nueva Jersey —en el área metropolitana de Nueva York— será el escenario de la gran final del Mundial 2026 el 19 de julio.\n\nCon capacidad para 82.500 espectadores, el estadio que alberga a los Giants y Jets de la NFL se convertirá en el centro del mundo futbolístico.\n\nNueva York es la ciudad más poblada de Estados Unidos y uno de los centros culturales más importantes del planeta. Que la final se juegue allí le da una dimensión histórica especial al torneo.`,
    date: '11 jun 2026', emoji: '🏟', featured: false, relatedTeamSlugs: [],
  },
]

export const NEWS_BY_SLUG = Object.fromEntries(NEWS.map(n => [n.slug, n]))

export const FEATURED_TEAM_SLUGS = [
  'argentina','brasil','francia','espana','alemania',
  'portugal','paises-bajos','inglaterra','estados-unidos','mexico',
]
