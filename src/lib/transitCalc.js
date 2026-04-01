/**
 * Transit day calculator — PC Miler-style estimation.
 *
 * - Fetches ZIP/postal code coordinates from zippopotam.us (free, CORS-ok)
 * - Calculates road distance using haversine × 1.3 road factor
 * - Estimates transit days at 800 km/day (≈ 500 miles, standard HOS)
 * - Skips weekends AND US + Canadian statutory holidays
 */

// ── Holiday tables (2025-2028) ────────────────────────────────────────────────
// Format: 'YYYY-MM-DD'
function buildHolidays() {
  const dates = new Set();
  const add = (...ds) => ds.forEach(d => dates.add(d));

  // ── US Federal Holidays ──────────────────────────────────────────────────────
  for (const y of [2025, 2026, 2027, 2028]) {
    add(
      `${y}-01-01`,  // New Year's Day
      `${y}-07-04`,  // Independence Day
      `${y}-11-11`,  // Veterans Day
      `${y}-12-25`,  // Christmas
    );
    // MLK Day — 3rd Monday of January
    add(nthWeekday(y, 1, 1, 3));
    // Presidents Day — 3rd Monday of February
    add(nthWeekday(y, 2, 1, 3));
    // Memorial Day — last Monday of May
    add(lastWeekday(y, 5, 1));
    // Juneteenth
    add(`${y}-06-19`);
    // Labor Day — 1st Monday of September
    add(nthWeekday(y, 9, 1, 1));
    // Columbus Day — 2nd Monday of October
    add(nthWeekday(y, 10, 1, 2));
    // Thanksgiving — 4th Thursday of November
    add(nthWeekday(y, 11, 4, 4));
  }

  // ── Canadian Statutory Holidays ──────────────────────────────────────────────
  for (const y of [2025, 2026, 2027, 2028]) {
    add(
      `${y}-01-01`,  // New Year's Day
      `${y}-07-01`,  // Canada Day
      `${y}-11-11`,  // Remembrance Day
      `${y}-12-25`,  // Christmas
      `${y}-12-26`,  // Boxing Day
    );
    // Family Day — 3rd Monday of February (ON, AB, BC, SK)
    add(nthWeekday(y, 2, 1, 3));
    // Victoria Day — Monday before May 25
    add(victoriaDay(y));
    // Labour Day — 1st Monday of September
    add(nthWeekday(y, 9, 1, 1));
    // Thanksgiving (CA) — 2nd Monday of October
    add(nthWeekday(y, 10, 1, 2));
    // Good Friday
    add(goodFriday(y));
  }

  return dates;
}

// Day-of-week helpers: 0=Sun,1=Mon,...,6=Sat
function nthWeekday(year, month, dow, n) {
  // nth occurrence of day-of-week `dow` in given month
  let count = 0;
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    if (d.getDay() === dow) { count++; if (count === n) break; }
    d.setDate(d.getDate() + 1);
  }
  return fmt(d);
}

function lastWeekday(year, month, dow) {
  const d = new Date(year, month, 0); // last day of month
  while (d.getDay() !== dow) d.setDate(d.getDate() - 1);
  return fmt(d);
}

function victoriaDay(year) {
  const d = new Date(year, 4, 24); // May 24 or before
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  return fmt(d);
}

function goodFriday(year) {
  // Easter algorithm (Anonymous Gregorian)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19*a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2*e + 2*i - h - k) % 7;
  const m = Math.floor((a + 11*h + 22*l) / 451);
  const month = Math.floor((h + l - 7*m + 114) / 31);
  const day   = ((h + l - 7*m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  easter.setDate(easter.getDate() - 2); // Good Friday
  return fmt(easter);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export const HOLIDAYS = buildHolidays();

// ── Haversine distance ────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road factor: straight-line → estimated road distance
const ROAD_FACTOR = 1.30;

// ── Service day counter ───────────────────────────────────────────────────────
const KM_PER_DAY = 800; // ≈ 500 miles — standard HOS maximum

export function calcTransitDays(distanceKm, startDate = new Date()) {
  if (!distanceKm || distanceKm <= 0) return 1;
  const rawDays = Math.ceil(distanceKm / KM_PER_DAY);
  // Walk forward from startDate, skipping weekends + holidays
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  let businessDays = 0;
  let calendarDays = 0;
  const MAX_ITER = 60; // safety cap
  while (businessDays < rawDays && calendarDays < MAX_ITER) {
    cur.setDate(cur.getDate() + 1);
    calendarDays++;
    const day = cur.getDay(); // 0=Sun,6=Sat
    const iso = fmt(cur);
    if (day !== 0 && day !== 6 && !HOLIDAYS.has(iso)) {
      businessDays++;
    }
  }
  return calendarDays; // total calendar days until delivery
}

// ── ZIP/postal code lookup ────────────────────────────────────────────────────
// Uses zippopotam.us — free, no key, CORS-enabled
const coordCache = {};

export async function fetchZipCoords(zip, country = 'us') {
  const key = `${country}:${zip}`;
  if (coordCache[key]) return coordCache[key];
  const cc = country.toLowerCase() === 'ca' ? 'ca' : 'us';
  const url = `https://api.zippopotam.us/${cc}/${zip.replace(/\s/g, '')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ZIP ${zip} not found`);
  const json = await res.json();
  const place = json.places?.[0];
  if (!place) throw new Error(`No location for ZIP ${zip}`);
  const coords = {
    lat:   parseFloat(place.latitude),
    lon:   parseFloat(place.longitude),
    city:  place['place name'],
    state: place['state abbreviation'],
  };
  coordCache[key] = coords;
  return coords;
}

// ── Main estimate function ────────────────────────────────────────────────────
/**
 * @returns {{ distanceKm, distanceMiles, transitDays, originCity, destCity }}
 */
export async function estimateTransit(originZip, destZip, country = 'us', startDate = new Date()) {
  const [o, d] = await Promise.all([
    fetchZipCoords(originZip, country),
    fetchZipCoords(destZip, country),
  ]);
  const straightKm = haversineKm(o.lat, o.lon, d.lat, d.lon);
  const roadKm     = straightKm * ROAD_FACTOR;
  const transitDays = calcTransitDays(roadKm, startDate);
  return {
    distanceKm:    Math.round(roadKm),
    distanceMiles: Math.round(roadKm * 0.621371),
    transitDays,
    originCity:    `${o.city}, ${o.state}`,
    destCity:      `${d.city}, ${d.state}`,
  };
}
