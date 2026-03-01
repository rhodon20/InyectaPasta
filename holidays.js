const FIXED_HOLIDAYS = [
  [1, 1, "Año Nuevo"],
  [1, 6, "Epifanía del Señor"],
  [5, 1, "Fiesta del Trabajo"],
  [8, 15, "Asunción de la Virgen"],
  [10, 12, "Fiesta Nacional de España"],
  [11, 1, "Todos los Santos"],
  [12, 6, "Día de la Constitución"],
  [12, 8, "Inmaculada Concepción"],
  [12, 25, "Navidad"],
];

const AUTONOMOUS_COMMUNITIES = [
  { code: "AN", name: "Andalucia", holidays: [[2, 28, "Dia de Andalucia"]] },
  { code: "AR", name: "Aragon", holidays: [[4, 23, "Dia de Aragon"]] },
  { code: "AS", name: "Asturias", holidays: [[9, 8, "Dia de Asturias"]] },
  { code: "IB", name: "Illes Balears", holidays: [[3, 1, "Dia de les Illes Balears"]] },
  { code: "CN", name: "Canarias", holidays: [[5, 30, "Dia de Canarias"]] },
  { code: "CB", name: "Cantabria", holidays: [[7, 28, "Dia de las Instituciones"]] },
  { code: "CM", name: "Castilla-La Mancha", holidays: [[5, 31, "Dia de Castilla-La Mancha"]] },
  { code: "CL", name: "Castilla y Leon", holidays: [[4, 23, "Dia de Castilla y Leon"]] },
  { code: "CT", name: "Cataluna", holidays: [[9, 11, "Diada Nacional de Catalunya"], [12, 26, "Sant Esteve"]] },
  { code: "VC", name: "Comunitat Valenciana", holidays: [[10, 9, "Dia de la Comunitat Valenciana"]] },
  { code: "EX", name: "Extremadura", holidays: [[9, 8, "Dia de Extremadura"]] },
  { code: "GA", name: "Galicia", holidays: [[7, 25, "Dia Nacional de Galicia"]] },
  { code: "MD", name: "Comunidad de Madrid", holidays: [[5, 2, "Fiesta de la Comunidad de Madrid"]] },
  { code: "MC", name: "Region de Murcia", holidays: [[6, 9, "Dia de la Region de Murcia"]] },
  { code: "NC", name: "Comunidad Foral de Navarra", holidays: [[12, 3, "San Francisco Javier"]] },
  { code: "PV", name: "Pais Vasco", holidays: [] },
  { code: "RI", name: "La Rioja", holidays: [[6, 9, "Dia de La Rioja"]] },
  { code: "CE", name: "Ceuta", holidays: [[9, 2, "Dia de Ceuta"]] },
  { code: "ML", name: "Melilla", holidays: [[9, 17, "Dia de Melilla"]] },
];

const MUNICIPALITY_BY_COMMUNITY = {
  AN: [
    { id: "sevilla", name: "Sevilla", holidays: [[5, 30, "San Fernando"], [6, 19, "Corpus Sevilla"]] },
    { id: "malaga", name: "Malaga", holidays: [[8, 19, "Feria de Malaga"], [9, 8, "Victoria"]] },
  ],
  AR: [
    { id: "zaragoza", name: "Zaragoza", holidays: [[1, 29, "San Valero"], [3, 5, "Cincomarzada"]] },
  ],
  AS: [
    { id: "oviedo", name: "Oviedo", holidays: [[9, 21, "San Mateo"], [5, 30, "Martes de Campo"]] },
  ],
  IB: [
    { id: "palma", name: "Palma", holidays: [[1, 20, "Sant Sebastia"], [6, 24, "Sant Joan"]] },
  ],
  CN: [
    { id: "laspalmas", name: "Las Palmas de Gran Canaria", holidays: [[6, 24, "Fundacion de la Ciudad"], [10, 7, "Virgen del Rosario"]] },
    { id: "sctenerife", name: "Santa Cruz de Tenerife", holidays: [[2, 3, "San Blas"], [5, 3, "Dia de la Cruz"]] },
  ],
  CB: [
    { id: "santander", name: "Santander", holidays: [[7, 25, "Santiago"], [8, 30, "Santos Martires"]] },
  ],
  CM: [
    { id: "toledo", name: "Toledo", holidays: [[1, 23, "San Ildefonso"], [6, 19, "Corpus Toledo"]] },
  ],
  CL: [
    { id: "valladolid", name: "Valladolid", holidays: [[5, 13, "San Pedro Regalado"], [9, 8, "Virgen de San Lorenzo"]] },
  ],
  CT: [
    { id: "barcelona", name: "Barcelona", holidays: [[6, 24, "Sant Joan"], [9, 24, "La Merce"]] },
  ],
  VC: [
    { id: "valencia", name: "Valencia", holidays: [[1, 22, "San Vicente Martir"], [4, 28, "San Vicente Ferrer"]] },
    { id: "alicante", name: "Alicante", holidays: [[6, 24, "Hogueras"], [12, 4, "Santa Barbara"]] },
  ],
  EX: [
    { id: "badajoz", name: "Badajoz", holidays: [[3, 19, "San Jose"], [6, 24, "San Juan"]] },
  ],
  GA: [
    { id: "acoruna", name: "A Coruna", holidays: [[6, 24, "San Juan"], [10, 7, "Rosario"]] },
    { id: "vigo", name: "Vigo", holidays: [[3, 28, "Reconquista"], [8, 16, "San Roque"]] },
  ],
  MD: [
    { id: "madrid", name: "Madrid", holidays: [[5, 15, "San Isidro"], [11, 9, "La Almudena"]] },
    { id: "mostoles", name: "Mostoles", holidays: [[5, 2, "Fiestas del 2 de Mayo"], [9, 12, "Virgen de los Santos"]] },
  ],
  MC: [
    { id: "murcia", name: "Murcia", holidays: [[4, 7, "Bando de la Huerta"], [9, 8, "Virgen de la Fuensanta"]] },
  ],
  NC: [
    { id: "pamplona", name: "Pamplona", holidays: [[7, 7, "San Fermin"], [11, 29, "San Saturnino"]] },
  ],
  PV: [
    { id: "bilbao", name: "Bilbao", holidays: [[8, 22, "Aste Nagusia"], [10, 13, "Begoña"]] },
    { id: "vitoria", name: "Vitoria-Gasteiz", holidays: [[8, 5, "Virgen Blanca"], [4, 28, "San Prudencio"]] },
  ],
  RI: [
    { id: "logrono", name: "Logrono", holidays: [[6, 11, "San Bernabe"], [9, 21, "San Mateo"]] },
  ],
  CE: [
    { id: "ceuta", name: "Ceuta", holidays: [[8, 5, "Virgen de Africa"], [9, 2, "Dia de Ceuta"]] },
  ],
  ML: [
    { id: "melilla", name: "Melilla", holidays: [[3, 19, "San Jose"], [9, 17, "Dia de Melilla"]] },
  ],
};

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function isoFromMonthDay(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function monthDayListToMap(year, holidays) {
  const map = new Map();
  for (const [month, day, label] of holidays) {
    map.set(isoFromMonthDay(year, month, day), label);
  }
  return map;
}

export function getAutonomousCommunities() {
  return AUTONOMOUS_COMMUNITIES.map((x) => ({ code: x.code, name: x.name }));
}

export function getMunicipalitiesByCommunity(communityCode) {
  return (MUNICIPALITY_BY_COMMUNITY[communityCode] || []).map((x) => ({ id: x.id, name: x.name }));
}

export function getSpanishNationalHolidays(year) {
  const map = new Map();

  for (const [month, day, label] of FIXED_HOLIDAYS) {
    const d = new Date(Date.UTC(year, month - 1, day));
    map.set(toISO(d), label);
  }

  const easter = easterSunday(year);
  const holyThursday = new Date(easter);
  holyThursday.setUTCDate(easter.getUTCDate() - 3);
  map.set(toISO(holyThursday), "Jueves Santo");

  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(easter.getUTCDate() - 2);
  map.set(toISO(goodFriday), "Viernes Santo");

  return map;
}

export function getCommunityHolidays(year, communityCode) {
  if (!communityCode) return new Map();
  const community = AUTONOMOUS_COMMUNITIES.find((x) => x.code === communityCode);
  if (!community) return new Map();
  return monthDayListToMap(year, community.holidays);
}

export function getMunicipalityHolidays(year, communityCode, municipalityId) {
  if (!communityCode || !municipalityId) return new Map();
  const list = MUNICIPALITY_BY_COMMUNITY[communityCode] || [];
  const municipality = list.find((x) => x.id === municipalityId);
  if (!municipality) return new Map();
  return monthDayListToMap(year, municipality.holidays);
}

export function parseCustomHolidayList(rawText) {
  if (!rawText || !rawText.trim()) return new Set();
  const parsed = new Set();
  const items = rawText.split(",").map((x) => x.trim()).filter(Boolean);
  for (const item of items) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(item)) {
      parsed.add(item);
    }
  }
  return parsed;
}

export function isSunday(dateObj) {
  return dateObj.getDay() === 0;
}
