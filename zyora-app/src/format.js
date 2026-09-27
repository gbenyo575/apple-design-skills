// Locale formatting without relying on the JS engine's Intl data, so the
// output is identical on Hermes (iOS/Android), web and in node tests.
const NBSP = ' ';
const THIN_NBSP = ' ';

const MONTHS = {
  hu: ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  hu: ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const WEEKDAYS = {
  hu: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export function groupDigits(value, lang = 'hu') {
  const digits = String(Math.round(Math.abs(Number(value) || 0)));
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : THIN_NBSP);
}

export function currencyLabel(lang = 'hu') {
  return lang === 'en' ? 'HUF' : 'Ft';
}

// formatMoney(-5000, 'hu', { sign: true }) → "−5 000 Ft"
export function formatMoney(value, lang = 'hu', { sign = false } = {}) {
  const n = Math.round(Number(value) || 0);
  const prefix = sign ? (n > 0 ? '+' : n < 0 ? '−' : '') : n < 0 ? '−' : '';
  return `${prefix}${groupDigits(n, lang)}${NBSP}${currencyLabel(lang)}`;
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatTime(date) {
  const d = new Date(date);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

export function formatDayMonth(date, lang = 'hu') {
  const d = new Date(date);
  return lang === 'en' ? `${d.getDate()} ${MONTHS_SHORT.en[d.getMonth()]}` : `${MONTHS_SHORT.hu[d.getMonth()]} ${d.getDate()}.`;
}

// "Ma, 10:42" · "Tegnap, 18:20" · "szept. 21."
export function formatRelativeDate(date, lang = 'hu', now = new Date()) {
  const diff = daysBetween(date, now);
  if (diff === 0) return `${lang === 'en' ? 'Today' : 'Ma'}, ${formatTime(date)}`;
  if (diff === 1) return `${lang === 'en' ? 'Yesterday' : 'Tegnap'}, ${formatTime(date)}`;
  return formatDayMonth(date, lang);
}

// Section headers in the transaction list: "Ma" · "Tegnap" · "Szeptember 21., hétfő"
export function formatDayHeading(date, lang = 'hu', now = new Date()) {
  const diff = daysBetween(date, now);
  if (diff === 0) return lang === 'en' ? 'Today' : 'Ma';
  if (diff === 1) return lang === 'en' ? 'Yesterday' : 'Tegnap';
  const d = new Date(date);
  if (lang === 'en') return `${WEEKDAYS.en[d.getDay()]}, ${d.getDate()} ${MONTHS.en[d.getMonth()]}`;
  const month = MONTHS.hu[d.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getDate()}., ${WEEKDAYS.hu[d.getDay()]}`;
}

// Home header: "Szeptember 27., szombat" / "Saturday, 27 September"
export function formatToday(lang = 'hu', now = new Date()) {
  if (lang === 'en') return `${WEEKDAYS.en[now.getDay()]}, ${now.getDate()} ${MONTHS.en[now.getMonth()]}`;
  const month = MONTHS.hu[now.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${now.getDate()}., ${WEEKDAYS.hu[now.getDay()]}`;
}

export function monthName(monthIndex, lang = 'hu', capitalized = true) {
  const name = MONTHS[lang === 'en' ? 'en' : 'hu'][monthIndex];
  return capitalized ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
}

// '2027-06' → "2027. jún." / "Jun 2027"
export function formatMonthKey(key, lang = 'hu', long = false) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  if (lang === 'en') return `${(long ? MONTHS.en : MONTHS_SHORT.en)[m - 1]} ${y}`;
  return `${y}. ${(long ? MONTHS.hu : MONTHS_SHORT.hu)[m - 1]}`;
}

// A pending Shield release: "holnap 14:32" / "tomorrow 14:32"
export function formatReleaseTime(date, lang = 'hu', now = new Date()) {
  const diff = daysBetween(now, date);
  const time = formatTime(date);
  if (diff <= 0) return lang === 'en' ? `today ${time}` : `ma ${time}`;
  if (diff === 1) return lang === 'en' ? `tomorrow ${time}` : `holnap ${time}`;
  return `${formatDayMonth(date, lang)} ${time}`;
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// Transaction detail: "2026. szept. 27., 10:42" / "27 Sep 2026, 10:42"
export function formatFullDate(date, lang = 'hu') {
  const d = new Date(date);
  if (lang === 'en') return `${d.getDate()} ${MONTHS_SHORT.en[d.getMonth()]} ${d.getFullYear()}, ${formatTime(d)}`;
  return `${d.getFullYear()}. ${MONTHS_SHORT.hu[d.getMonth()]} ${d.getDate()}., ${formatTime(d)}`;
}

// "szeptemberben" / "in September"
const MONTHS_INESSIVE_HU = ['januárban', 'februárban', 'márciusban', 'áprilisban', 'májusban', 'júniusban', 'júliusban', 'augusztusban', 'szeptemberben', 'októberben', 'novemberben', 'decemberben'];
export function monthIn(monthIndex, lang = 'hu') {
  return lang === 'en' ? `in ${MONTHS.en[monthIndex]}` : MONTHS_INESSIVE_HU[monthIndex];
}
