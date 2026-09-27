// Local demo data. Nothing here touches a bank, card or payment API.

// Spending categories. Lists use a neutral icon tile; charts use one hue for
// magnitude, so colour never has to carry the category on its own.
export const categories = {
  groceries: { hu: 'Élelmiszer', en: 'Groceries', icon: 'basket-outline' },
  eating: { hu: 'Étterem és kávé', en: 'Food & drink', icon: 'restaurant-outline' },
  transport: { hu: 'Közlekedés', en: 'Transport', icon: 'bus-outline' },
  fun: { hu: 'Szórakozás', en: 'Entertainment', icon: 'film-outline' },
  shopping: { hu: 'Vásárlás', en: 'Shopping', icon: 'bag-handle-outline' },
  subscriptions: { hu: 'Előfizetések', en: 'Subscriptions', icon: 'repeat-outline' },
  income: { hu: 'Bevétel', en: 'Income', icon: 'arrow-down' },
  savings: { hu: 'Célra félretéve', en: 'Moved to a goal', icon: 'shield-checkmark-outline' },
  release: { hu: 'Célból visszakerült', en: 'Back from a goal', icon: 'arrow-undo-outline' },
  coverage: { hu: 'Vésztartalék fedezet', en: 'Emergency fund cover', icon: 'help-buoy-outline' },
  transfer: { hu: 'Pénzküldés', en: 'Transfer', icon: 'paper-plane-outline' },
};

export const spendingCategoryIds = ['groceries', 'eating', 'transport', 'fun', 'shopping', 'subscriptions'];

// The example month. `day` is the day of the month; only entries up to today
// are seeded, so the demo always looks like "this month so far".
const monthlySamples = [
  { day: 1, time: '07:58', merchant: 'Fizetés', merchantEn: 'Salary', category: 'income', amount: 612400, kind: 'income' },
  { day: 2, time: '18:12', merchant: 'Spar', category: 'groceries', amount: -12480 },
  { day: 3, time: '08:31', merchant: 'BKK havibérlet', merchantEn: 'BKK monthly pass', category: 'transport', amount: -8950 },
  { day: 4, time: '20:05', merchant: 'Wolt', category: 'eating', amount: -5690 },
  { day: 5, time: '17:44', merchant: 'Lidl', category: 'groceries', amount: -9870 },
  { day: 6, time: '09:10', merchant: 'Spotify', category: 'subscriptions', amount: -1990 },
  { day: 7, time: '21:30', merchant: 'Cinema City', category: 'fun', amount: -7490 },
  { day: 8, time: '12:20', merchant: 'Bistro Kő', category: 'eating', amount: -6450 },
  { day: 9, time: '18:02', merchant: 'ALDI', category: 'groceries', amount: -8460 },
  { day: 11, time: '15:47', merchant: 'Zara', category: 'shopping', amount: -15990 },
  { day: 12, time: '23:14', merchant: 'Bolt', category: 'transport', amount: -3200 },
  { day: 13, time: '11:05', merchant: 'Lidl', category: 'groceries', amount: -11890 },
  { day: 14, time: '08:40', merchant: 'Starbucks', category: 'eating', amount: -2150 },
  { day: 15, time: '10:00', merchant: 'Netflix', category: 'subscriptions', amount: -3990 },
  { day: 16, time: '19:26', merchant: 'Wolt', category: 'eating', amount: -6340 },
  { day: 17, time: '22:10', merchant: 'Instant', category: 'fun', amount: -9800 },
  { day: 18, time: '18:35', merchant: 'Spar', category: 'groceries', amount: -11230 },
  { day: 19, time: '14:12', merchant: 'Decathlon', category: 'shopping', amount: -12990 },
  { day: 20, time: '13:02', merchant: 'Bistro Kő', category: 'eating', amount: -5900 },
  { day: 21, time: '17:58', merchant: 'ALDI', category: 'groceries', amount: -7640 },
  { day: 22, time: '20:45', merchant: 'Cinema City', category: 'fun', amount: -4980 },
  { day: 23, time: '16:20', merchant: 'MediaMarkt', category: 'shopping', amount: -19990 },
  { day: 24, time: '23:40', merchant: 'Bolt', category: 'transport', amount: -2780 },
  { day: 25, time: '08:15', merchant: 'Costa Coffee', category: 'eating', amount: -1890 },
  { day: 25, time: '18:50', merchant: 'Lidl', category: 'groceries', amount: -10420 },
  { day: 26, time: '20:30', merchant: 'Wolt', category: 'eating', amount: -7260 },
  { day: 27, time: '10:42', merchant: 'ALDI', category: 'groceries', amount: -8460 },
  { day: 28, time: '19:05', merchant: 'Instant', category: 'fun', amount: -6200 },
  { day: 29, time: '12:30', merchant: 'Spar', category: 'groceries', amount: -9120 },
  { day: 30, time: '18:00', merchant: 'Bolt', category: 'transport', amount: -2450 },
];

export function monthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonthsKey(date, months) {
  const d = new Date(date);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  return monthKey(target);
}

export function seedTransactions(now = new Date()) {
  const today = now.getDate();
  return monthlySamples
    .filter(sample => sample.day <= today)
    .map((sample, index) => {
      const [h, m] = sample.time.split(':').map(Number);
      let date = new Date(now.getFullYear(), now.getMonth(), sample.day, h, m);
      // Today's entries never sit in the future.
      if (date > now) date = new Date(now.getTime() - (index + 1) * 11 * 60000);
      return {
        id: `seed-${index}`,
        merchant: sample.merchant,
        merchantEn: sample.merchantEn,
        category: sample.category,
        amount: sample.amount,
        kind: sample.kind || 'spend',
        date: date.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Last month, by category — the baseline for "compared with last month".
export const previousMonth = {
  total: 234780,
  byCategory: { groceries: 88200, eating: 41900, transport: 17600, fun: 29800, shopping: 51300, subscriptions: 5980 },
};

export function seedGoals(now = new Date()) {
  const created = new Date(now.getFullYear(), now.getMonth() - 5, 3).toISOString();
  return [
    { id: 'bali', emoji: '🏝️', name: 'Bali', target: 500000, saved: 321500, targetDate: addMonthsKey(now, 9), shield: 24, createdAt: created },
    { id: 'macbook', emoji: '💻', name: 'MacBook Pro', target: 800000, saved: 304000, targetDate: addMonthsKey(now, 15), shield: 48, createdAt: created },
    { id: 'reserve', emoji: '🛟', name: 'Vésztartalék', nameEn: 'Emergency fund', kind: 'emergency', target: 1500000, saved: 405000, targetDate: null, shield: 72, createdAt: created },
  ];
}

export const goalEmojis = ['🎯', '🏝️', '✈️', '💻', '📱', '🏠', '🚗', '🎓', '🎸', '🛟', '🎁', '🐶'];

export const initialMissions = [
  { id: 'shield', title: 'Ne nyúlj a Bali célhoz', titleEn: 'Leave your Bali goal untouched', subtitle: 'A Shield egész nap aktív marad', subtitleEn: 'Keep its Shield on all day', xp: 40, done: true },
  { id: 'budget', title: 'Maradj a napi kereten belül', titleEn: 'Stay within today’s budget', xp: 60, done: true },
  { id: 'evening', title: 'Tarts egy költésmentes estét', titleEn: 'Have a no-spend evening', subtitle: '18:00 után semmi impulzusvásárlás', subtitleEn: 'No impulse buys after 6 pm', xp: 80, done: false },
  { id: 'review', title: 'Nézd át a heti költéseidet', titleEn: 'Review your weekly spending', subtitle: 'Kétperces pénzügyi check-in', subtitleEn: 'A two-minute money check-in', xp: 30, done: false },
];

export const friends = [
  { id: 'lilla', name: 'Horváth Lilla', nameEn: 'Lilla Horváth', first: 'Lilla', last: { hu: 'Tegnap küldtél neki 4 500 Ft-ot', en: 'You sent 4,500 HUF yesterday' }, color: '#8A73FF', recent: true },
  { id: 'mate', name: 'Kovács Máté', nameEn: 'Máté Kovács', first: 'Máté', last: { hu: '3 napja küldött 8 200 Ft-ot', en: 'Sent you 8,200 HUF 3 days ago' }, color: '#3FA98C', recent: true },
  { id: 'nori', name: 'Szabó Nóri', nameEn: 'Nóri Szabó', first: 'Nóri', last: { hu: 'Múlt héten · vacsora', en: 'Last week · dinner' }, color: '#C9774F', recent: true },
  { id: 'dani', name: 'Nagy Dani', nameEn: 'Dani Nagy', first: 'Dani', last: { hu: '2 hete · közös utazás', en: '2 weeks ago · shared trip' }, color: '#4F86C9', recent: true },
  { id: 'anna', name: 'Farkas Anna', nameEn: 'Anna Farkas', first: 'Anna', last: { hu: '1 hónapja', en: '1 month ago' }, color: '#A25BC9' },
  { id: 'bori', name: 'Tóth Bori', nameEn: 'Bori Tóth', first: 'Bori', last: { hu: '2 hónapja', en: '2 months ago' }, color: '#5E8F4A' },
];

export const rewards = [
  { level: 8, icon: 'snow-outline', name: 'Sorozatvédő', nameEn: 'Streak Freeze', detail: 'Egy kihagyott nap nem töri meg a sorozatodat.', detailEn: 'One missed day won’t break your streak.' },
  { level: 10, icon: 'flash-outline', name: 'Dupla XP hét', nameEn: 'Double XP week', detail: 'Egy hétig minden célbefizetés dupla XP-t ér.', detailEn: 'For one week, every goal top-up earns double XP.' },
  { level: 15, icon: 'pricetag-outline', name: 'Partnerkedvezmény', nameEn: 'Partner discount', detail: 'Kedvezmény egy Zyora-partnernél, csak ezen a szinten.', detailEn: 'A discount with a Zyora partner, unlocked at this level.' },
  { level: 20, icon: 'card-outline', name: 'Zyora Black előhozzáférés', nameEn: 'Zyora Black early access', detail: 'Elsőként kérheted a prémium kártyát.', detailEn: 'Be first in line for the premium card.' },
];

export const levelNames = { hu: ['Kezdő', 'Tudatos', 'Momentum', 'Stabil', 'Mester'], en: ['Starter', 'Mindful', 'Momentum', 'Steady', 'Master'] };

export function levelName(level, lang = 'hu') {
  const names = levelNames[lang === 'en' ? 'en' : 'hu'];
  return names[Math.min(names.length - 1, Math.floor((Math.max(1, level) - 1) / 3))];
}

export const demoProfile = {
  name: 'Kiss Bence',
  nameEn: 'Bence Kiss',
  first: 'Bence',
  email: 'bence.kiss@example.com',
  phone: '+36 30 123 4567',
};
