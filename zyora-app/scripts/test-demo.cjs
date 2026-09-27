// Demo logic + static checks. Run with: npm run test:demo
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const rel = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(rel) : rel.endsWith('.js') ? [rel] : [];
});

(async () => {
  const finance = await import('../src/finance.js');
  const format = await import('../src/format.js');
  const { copy, translate } = await import('../src/i18n.js');
  const { calculateMoney, calculateMonth, addExperience, planGoals, coverageFor, monthFlow, categoryBreakdown } = finance;
  let checks = 0;
  const ok = (label, fn) => { fn(); checks += 1; };

  // 1 — Core money model (v0.4 numbers must still hold for undated data).
  const state = {
    salary: 612400, fixedRate: 32, savingsRate: 20, spendableAdjustment: 0,
    goals: [{ id: 'a', saved: 321500, target: 500000 }, { id: 'b', saved: 304000, target: 800000 }, { id: 'c', saved: 405000, target: 1500000 }],
    missions: [{ done: true }, { done: true }, { done: false }, { done: false }],
    transactions: [
      { amount: -8460, category: 'groceries' }, { amount: -6890, category: 'groceries' },
      { amount: -7490, category: 'fun' }, { amount: -3990, category: 'subscriptions' },
      { amount: 612400, category: 'income', kind: 'income' },
    ],
    xp: 780, level: 7,
  };
  const money = calculateMoney(state);
  ok('money', () => {
    assert.equal(money.fixed, 195968);
    assert.equal(money.savedTotal, 122480);
    assert.equal(money.plannedSpendable, 293952);
    assert.equal(money.monthSpend, 26830);
    assert.equal(money.spendable, 267122);
    assert.equal(money.totalGoals, 1030500);
    assert.equal(money.totalWealth, 267122 + 1030500);
    assert.equal(calculateMonth(state, money).completedCriteria, 3);
  });

  ok('fixed costs as an amount win over the legacy rate', () => {
    assert.equal(calculateMoney({ ...state, fixedCosts: 150000 }).fixed, 150000);
  });

  ok('transfers count as spending; goal top-ups do not', () => {
    const transfer = { ...state, transactions: [{ amount: -5000, kind: 'transfer' }, ...state.transactions] };
    assert.equal(calculateMoney(transfer).spendable, money.spendable - 5000);
    assert.equal(calculateMonth(transfer, calculateMoney(transfer)).spent, 31830);
    const contribution = { ...state, spendableAdjustment: -10000, transactions: [{ amount: -10000, kind: 'goal' }, ...state.transactions], goals: [{ ...state.goals[0], saved: 331500 }, ...state.goals.slice(1)] };
    assert.equal(calculateMoney(contribution).monthSpend, money.monthSpend);
    assert.equal(calculateMoney(contribution).spendable, money.spendable - 10000);
    assert.equal(calculateMoney(contribution).totalWealth, money.totalWealth);
  });

  ok('overspending is visible instead of silently clamped', () => {
    const over = calculateMoney({ ...state, salary: 300000, fixedCosts: 290000 });
    assert.equal(over.spendable, 0);
    assert.ok(over.overspent > 0);
    assert.equal(over.overspent, 26830);
    assert.equal(over.planShortfall, 50000);
  });

  ok('pending Shield releases stay in total wealth', () => {
    const pending = { ...state, goals: [{ ...state.goals[0], saved: 311500 }, ...state.goals.slice(1)], pendingReleases: [{ amount: 10000 }] };
    assert.equal(calculateMoney(pending).totalWealth, money.totalWealth);
    assert.equal(calculateMoney(pending).spendable, money.spendable);
  });

  ok('XP levels', () => {
    assert.deepEqual(addExperience(state, 250), { xp: 30, level: 8 });
    assert.deepEqual(addExperience({ xp: 30, level: 8 }, -80), { xp: 950, level: 7 });
    assert.equal(calculateMonth({ ...state, salary: 0 }, calculateMoney({ ...state, salary: 0 })).budgetUsage, 101);
  });

  // 2 — Goal allocation: deadlines first, the rest to undated goals.
  const now = new Date(2026, 8, 27);
  const planState = {
    ...state,
    goals: [
      { id: 'bali', saved: 321500, target: 500000, targetDate: '2027-06' },
      { id: 'mac', saved: 304000, target: 800000, targetDate: '2027-12' },
      { id: 'reserve', saved: 405000, target: 1500000, targetDate: null },
      { id: 'done', saved: 100, target: 100, targetDate: null },
    ],
  };
  ok('goal plan', () => {
    const plan = planGoals(planState, calculateMoney(planState, now), now);
    assert.equal(plan.byId.bali.required, Math.ceil(178500 / 9));
    assert.equal(plan.byId.bali.monthly, plan.byId.bali.required);
    assert.equal(plan.byId.bali.status, 'onTrack');
    assert.equal(plan.byId.done.status, 'complete');
    assert.equal(plan.byId.done.monthly, 0);
    const total = ['bali', 'mac', 'reserve'].reduce((s, id) => s + plan.byId[id].monthly, 0);
    assert.ok(total <= plan.pot && plan.pot - total < 5, 'the whole pot is shared out');
    const lean = { ...planState, savingsRate: 5 };
    const leanPlan = planGoals(lean, calculateMoney(lean, now), now);
    assert.equal(leanPlan.byId.reserve.status, 'paused');
    assert.equal(leanPlan.byId.bali.status, 'behind');
    assert.ok(leanPlan.shortfall > 0);
  });

  // 3 — Overspend coverage comes only from the emergency fund.
  ok('coverage', () => {
    const covState = { ...state, goals: [{ id: 'r', kind: 'emergency', saved: 50000, target: 100000 }] };
    const m = calculateMoney(covState);
    assert.equal(coverageFor(m.spendable + 20000, covState, m).shortBy, 20000);
    assert.equal(coverageFor(m.spendable + 20000, covState, m).canCover, true);
    assert.equal(coverageFor(m.spendable + 60000, covState, m).canCover, false);
    assert.equal(coverageFor(m.spendable + 1, { ...state, goals: [] }, calculateMoney({ ...state, goals: [] })).canCover, false);
  });

  // 4 — The monthly flow reconciles to the spendable balance.
  ok('month flow reconciles', () => {
    const flowState = { ...state, spendableAdjustment: -10000 + 4000, transactions: [{ amount: -10000, kind: 'goal' }, { amount: 4000, kind: 'release' }, ...state.transactions] };
    const m = calculateMoney(flowState);
    const f = monthFlow(flowState, m);
    assert.equal(f.income - f.fixed - f.autoSaved - f.contributions + f.releases + f.coverage + f.other - f.spent, f.left);
    assert.equal(f.left, m.spendableRaw);
  });

  ok('category breakdown excludes goal moves', () => {
    const cats = categoryBreakdown([{ amount: -1000, category: 'fun' }, { amount: -500, kind: 'goal', category: 'savings' }], { byCategory: {} });
    assert.deepEqual(cats.map(c => c.id), ['fun']);
  });

  // 5 — Formatting is engine-independent.
  ok('formatting', () => {
    assert.equal(format.formatMoney(612400, 'hu'), '612 400 Ft');
    assert.equal(format.formatMoney(-5000, 'en', { sign: true }), '−5,000 HUF');
    assert.equal(format.formatMonthKey('2027-06', 'hu'), '2027. jún.');
    assert.equal(format.monthIn(8, 'hu'), 'szeptemberben');
  });

  // 6 — Static checks over the source.
  const sources = [...walk('app'), ...walk('src')];
  const code = sources.map(read).join('\n');

  ok('every translation key exists in both languages', () => {
    const hu = Object.keys(copy.hu);
    const en = Object.keys(copy.en);
    assert.deepEqual(hu.filter(k => !en.includes(k)), [], 'missing in English');
    assert.deepEqual(en.filter(k => !hu.includes(k)), [], 'missing in Hungarian');
    const used = [...code.matchAll(/\bt\(\s*'([\w.]+)'/g)].map(m => m[1]);
    const dynamic = ['shield.desc0', 'shield.desc24', 'shield.desc48', 'shield.desc72', 'levels.criteria.save', 'levels.criteria.missions', 'levels.criteria.goal', 'levels.criteria.budget', 'goalForm.in6', 'goalForm.in12', 'goalForm.in24',
      ...['spendable', 'goals', 'stats', 'forecast', 'rules', 'accounts', 'copilot'].map(k => `pro.f.${k}`), ...['forecast', 'rules', 'accounts', 'copilot'].map(k => `pro.h.${k}`)];
    const missing = [...new Set([...used, ...dynamic])].filter(k => !(k in copy.hu));
    assert.deepEqual(missing, [], 'used in code but not translated');
    assert.equal(translate('en', 'home.daily', { amount: 'x', days: 1 }), '≈ x a day · 1 day left this month');
  });

  ok('every icon name exists in Ionicons', () => {
    const glyphs = JSON.parse(read('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
    // Every quoted token inside an icon/name attribute or `icon:` field, plus the tab-bar icon pairs.
    const exprs = [...code.matchAll(/\b(?:icon|name)\s*(?:=\s*\{[^}\n]*\}|=\s*"[^"\n]*"|:\s*[^,}\n]*)/g)].map(m => m[0]);
    const tokens = exprs.flatMap(expr => [...expr.matchAll(/['"]([a-z][a-z0-9-]*)['"]/g)].map(m => m[1]))
      .concat([...code.matchAll(/\[\s*'([a-z-]+-outline)',\s*'([a-z-]+)'\s*\]/g)].flatMap(m => [m[1], m[2]]));
    const names = new Set(tokens.filter(name => /-(outline|sharp)$/.test(name) || name in glyphs || /^[a-z]+(-[a-z]+)+$/.test(name)));
    assert.ok(names.size > 60, `found ${names.size} icon names`);
    const invalid = [...names].filter(name => !(name in glyphs) && (name.includes('-outline') || /^(add|close|search|checkmark|flash|flag|home|sparkles|paper-plane|shield|time|alert|trending|chevron)/.test(name)));
    assert.deepEqual(invalid, []);
  });

  ok('routes and project setup', () => {
    for (const route of ['app/_layout.js', 'app/(tabs)/_layout.js', 'app/(tabs)/index.js', 'app/(tabs)/plan.js', 'app/(tabs)/goals.js', 'app/(tabs)/insights.js', 'app/(tabs)/profile.js', 'app/goal/[id].js', 'app/transactions.js', 'app/notifications.js', 'app/levels.js', 'app/pro.js', 'app/send/_layout.js', 'app/send/index.js', 'app/send/[friendId].js']) {
      assert.ok(fs.existsSync(path.join(root, route)), `${route} exists`);
    }
    const pkg = JSON.parse(read('package.json'));
    assert.equal(pkg.main, 'expo-router/entry');
    assert.ok(!code.includes('PanResponder'), 'gestures use react-native-gesture-handler');
    assert.ok(!code.includes('runOnJS'), 'Reanimated 4 uses scheduleOnRN');
    assert.ok(!code.includes('Easing.in('), 'no ease-in on UI');
    assert.ok(read('src/i18n.js').includes('szimuláció'), 'transfers are clearly labelled as simulated');
  });

  console.log(`PASS · ${checks} checks · money model, overspend coverage, goal plan, monthly flow, formatting, translations, icons, routes`);
})().catch(error => { console.error(error); process.exitCode = 1; });
