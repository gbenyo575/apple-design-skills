export const initialGoals = [
  { id: 'bali', emoji: '🏝️', category: 'UTAZÁS', categoryEn: 'TRAVEL', name: 'Bali', saved: 321500, target: 500000, monthly: 62000, shield: 24 },
  { id: 'macbook', emoji: '💻', category: 'TECH', categoryEn: 'TECH', name: 'MacBook Pro', saved: 304000, target: 800000, monthly: 48000, shield: 48 },
  { id: 'reserve', emoji: '🛟', category: 'BIZTONSÁG', categoryEn: 'SAFETY', name: 'Vésztartalék', nameEn: 'Emergency fund', saved: 405000, target: 1500000, monthly: 36744, shield: 72 },
];

export const initialTransactions = [
  { id: 't1', merchant: 'ALDI', icon: 'basket-outline', category: 'Élelmiszer', categoryEn: 'Groceries', amount: -8460, date: 'ma, 10:42', dateEn: 'today, 10:42', color: '#73D8A4' },
  { id: 't2', merchant: 'Lidl', icon: 'cart-outline', category: 'Élelmiszer', categoryEn: 'Groceries', amount: -6890, date: 'tegnap', dateEn: 'yesterday', color: '#72A7FF' },
  { id: 't3', merchant: 'Cinema City', icon: 'film-outline', category: 'Szórakozás', categoryEn: 'Entertainment', amount: -7490, date: '3 napja', dateEn: '3 days ago', color: '#FF9D75' },
  { id: 't4', merchant: 'Netflix', icon: 'play', category: 'Előfizetés', categoryEn: 'Subscription', amount: -3990, date: '4 napja', dateEn: '4 days ago', color: '#FF677D' },
  { id: 't5', merchant: 'Fizetés', merchantEn: 'Salary', icon: 'arrow-down', category: 'Bevétel', categoryEn: 'Income', amount: 612400, date: 'hó elején', dateEn: 'start of month', color: '#8A73FF' },
];

export const initialMissions = [
  { id: 'shield', title: 'Ne nyúlj a Bali célhoz', titleEn: 'Leave the Bali goal untouched', subtitle: 'Shield aktív egész nap', subtitleEn: 'Shield active all day', xp: 40, done: true },
  { id: 'budget', title: 'Maradj a napi kereten belül', titleEn: 'Stay within today’s budget', subtitle: 'Mai költés: 7 240 / 9 798 Ft', subtitleEn: 'Today: 7,240 / 9,798 HUF', xp: 60, done: true },
  { id: 'evening', title: 'Tarts egy no-spend estét', titleEn: 'Have a no-spend evening', subtitle: '18:00 után ne költs impulzívan', subtitleEn: 'Avoid impulse spending after 18:00', xp: 80, done: false },
  { id: 'review', title: 'Nézd át a heti költéseidet', titleEn: 'Review your weekly spending', subtitle: '2 perces pénzügyi check-in', subtitleEn: 'A two-minute money check-in', xp: 30, done: false },
];

export const friends = [
  { id: 'lilla', name: 'Lilla Horváth', first: 'Lilla', activity: 'Tegnap küldtél · 4 500 Ft', activityEn: 'Sent yesterday · 4,500 HUF', color: '#8A73FF' },
  { id: 'mate', name: 'Máté Kovács', first: 'Máté', activity: '3 napja küldött · 8 200 Ft', activityEn: 'Sent 3 days ago · 8,200 HUF', color: '#67C9B2' },
  { id: 'nori', name: 'Nóri Szabó', first: 'Nóri', activity: 'Múlt héten · vacsora', activityEn: 'Last week · dinner', color: '#FF9D75' },
  { id: 'dani', name: 'Dani Nagy', first: 'Dani', activity: '2 hete · közös utazás', activityEn: '2 weeks ago · shared trip', color: '#73A8FF' },
  { id: 'anna', name: 'Anna Farkas', first: 'Anna', activity: '1 hónapja', activityEn: '1 month ago', color: '#D178FF' },
];

export const rewards = [
  { level: 8, icon: 'snow-outline', name: 'Streak Freeze', detail: 'Egy kihagyott nap nem töri meg a sorozatodat.', detailEn: 'One missed day will not break your streak.', accent: '#75C7FF' },
  { level: 10, icon: 'flash-outline', name: 'XP Power Week', detail: 'Egy héten át minden teljesített cél dupla XP-t ér.', detailEn: 'Every completed goal earns double XP for one week.', accent: '#BBAEFF' },
  { level: 15, icon: 'gift-outline', name: 'Mystery Partner Drop', detail: 'Egy exkluzív, csak ezen a szinten elérhető partnerjutalom.', detailEn: 'An exclusive partner reward available only at this level.', accent: '#FFB36B' },
  { level: 20, icon: 'diamond-outline', name: 'Zyora Black Access', detail: 'Korai hozzáférés a prémium kártyához és különleges kihívásokhoz.', detailEn: 'Early access to the premium card and special challenges.', accent: '#E8E2FF' },
];
