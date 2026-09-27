const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const { calculateMoney, calculateMonth, addExperience } = await import('../src/finance.js');
  const state = {
    salary: 612400, fixedRate: 32, savingsRate: 20, previousMonthSavings: 103880,
    spendableAdjustment: 0, goals: [{ saved: 321500 }, { saved: 304000 }, { saved: 405000 }],
    missions: [{ done: true }, { done: true }, { done: false }, { done: false }],
    transactions: [
      { amount: -8460, category: 'Groceries' }, { amount: -6890, category: 'Groceries' },
      { amount: -7490, category: 'Fun' }, { amount: -3990, category: 'Subscription' },
      { amount: 612400, category: 'Income' },
    ],
    xp: 780, level: 7,
  };
  const money = calculateMoney(state);
  assert.equal(money.fixed, 195968);
  assert.equal(money.savedTotal, 122480);
  assert.equal(money.plannedSpendable, 293952);
  assert.equal(money.monthSpend, 26830);
  assert.equal(money.spendable, 267122);
  assert.equal(money.totalGoals, 1030500);
  assert.equal(calculateMonth(state, money).completedCriteria, 3);

  const transfer = { ...state, transactions: [{ amount: -5000, kind: 'transfer' }, ...state.transactions] };
  assert.equal(calculateMoney(transfer).spendable, money.spendable - 5000);
  assert.equal(calculateMonth(transfer, calculateMoney(transfer)).spent, 31830);
  const contribution = { ...state, spendableAdjustment: -10000, transactions: [{ amount: -10000, kind: 'goal' }, ...state.transactions], goals: [{ saved: 331500 }, ...state.goals.slice(1)] };
  assert.equal(calculateMoney(contribution).monthSpend, money.monthSpend);
  assert.equal(calculateMoney(contribution).totalWealth, money.totalWealth);
  assert.deepEqual(addExperience(state, 250), { xp: 30, level: 8 });
  assert.deepEqual(addExperience({ xp: 30, level: 8 }, -80), { xp: 950, level: 7 });
  assert.equal(calculateMonth({ ...state, salary: 0 }, calculateMoney({ ...state, salary: 0 })).budgetUsage, 101);

  // Showstoppers for a presentation build: no import gate or false transfer success.
  const app = fs.readFileSync('App.js', 'utf8');
  const more = fs.readFileSync('src/screens/MoreScreen.js', 'utf8');
  assert(!app.includes('StatementOnboardingScreen') && !app.includes('BetaAccessScreen'));
  assert(more.includes("id: 'friends'") && more.includes('szimuláció'));
  assert(!fs.readFileSync('package.json', 'utf8').includes('expo-pdf-text-extract'));
  console.log('PASS · demo calculations, goal transfer separation, XP levels, navigable Friends and no import gate');
})().catch(error => { console.error(error); process.exitCode = 1; });
