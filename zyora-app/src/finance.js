// Pure money logic for the demo. No banking or payment API is involved.
// Every screen reads these results, so the numbers always reconcile.

const SPEND_EXCLUDED_KINDS = new Set(['goal']);

function monthStart(now) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function daysInMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// Transactions without a date (older saved states, tests) count as this month.
export function isThisMonth(tx, now = new Date()) {
  if (!tx.date) return true;
  const d = new Date(tx.date);
  return d >= monthStart(now) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function isSpending(tx) {
  return tx.amount < 0 && !SPEND_EXCLUDED_KINDS.has(tx.kind);
}

export function spentFromTransactions(transactions = [], now = new Date()) {
  return transactions.reduce((sum, tx) => sum + (isSpending(tx) && isThisMonth(tx, now) ? -tx.amount : 0), 0);
}

export function fixedCostsOf(state) {
  const salary = Math.max(0, Number(state.salary) || 0);
  if (state.fixedCosts != null) return Math.max(0, Math.round(Number(state.fixedCosts) || 0));
  return Math.round(salary * (Number(state.fixedRate) || 0) / 100);
}

export function calculateMoney(state, now = new Date()) {
  const salary = Math.max(0, Number(state.salary) || 0);
  const fixed = fixedCostsOf(state);
  const savedTotal = Math.round(salary * (Number(state.savingsRate) || 0) / 100);
  const plannedSpendable = Math.max(0, salary - fixed - savedTotal);
  const planShortfall = Math.max(0, fixed + savedTotal - salary);
  const monthSpend = spentFromTransactions(state.transactions, now);
  const adjustment = Number(state.spendableAdjustment) || 0;
  const spendableRaw = plannedSpendable - monthSpend + adjustment;
  const spendable = Math.max(0, spendableRaw);
  const overspent = Math.max(0, -spendableRaw);
  const totalGoals = (state.goals || []).reduce((sum, goal) => sum + (Number(goal.saved) || 0), 0);
  const pendingTotal = (state.pendingReleases || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const protectedTotal = totalGoals + pendingTotal;
  const dim = daysInMonth(now);
  const daysLeft = Math.max(1, dim - now.getDate() + 1);
  return {
    salary, fixed, savedTotal, plannedSpendable, planShortfall, monthSpend,
    spendable, spendableRaw, overspent, totalGoals, pendingTotal, protectedTotal,
    totalWealth: spendableRaw + protectedTotal,
    daysLeft, daily: Math.floor(spendable / daysLeft),
    yearlySavings: savedTotal * 12,
  };
}

export function calculateMonth(state, money, now = new Date()) {
  const completedMissions = (state.missions || []).filter(item => item.done).length;
  const budget = Math.max(0, money.plannedSpendable);
  const spent = money.monthSpend;
  const remaining = Math.max(0, budget - spent);
  const dim = daysInMonth(now);
  const day = now.getDate();
  const monthProgress = day / dim;
  const expectedSpend = budget * monthProgress;
  const pace = spent > budget ? 'over' : spent > expectedSpend * 1.05 + 1000 ? 'fast' : 'good';
  const projectedSpend = Math.round(spent / Math.max(1, day) * dim);
  const criteria = [
    { id: 'save', done: state.savingsRate >= 15 },
    { id: 'missions', done: completedMissions >= 3 },
    { id: 'goal', done: (state.goals || []).length > 0 },
    { id: 'budget', done: spent <= budget },
  ];
  const completedCriteria = criteria.filter(item => item.done).length;
  return {
    budget, spent, remaining,
    budgetUsage: budget ? Math.round(spent / budget * 100) : (spent ? 101 : 0),
    daysInMonth: dim, day, monthProgress, expectedSpend, pace,
    projectedSpend, projectedLeft: budget - projectedSpend,
    completedMissions, criteria, completedCriteria,
    feeFreeProgress: completedCriteria / criteria.length * 100,
    feeFreeEligible: completedCriteria === criteria.length,
  };
}

// Whole paydays left until a 'YYYY-MM' target, counting the target month.
export function monthsUntil(targetKey, now = new Date()) {
  if (!targetKey) return null;
  const [y, m] = targetKey.split('-').map(Number);
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

function addMonths(now, months) {
  const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// How each payday's savings are shared between goals: goals with a deadline
// get what they need first; whatever is left goes to goals without one.
export function planGoals(state, money, now = new Date()) {
  const goals = state.goals || [];
  const pot = money.savedTotal;
  const active = goals.filter(goal => goal.saved < goal.target);
  const info = {};
  for (const goal of goals) {
    const remaining = Math.max(0, goal.target - goal.saved);
    const monthsLeft = goal.targetDate ? Math.max(1, monthsUntil(goal.targetDate, now)) : null;
    info[goal.id] = { remaining, monthsLeft, required: monthsLeft ? Math.ceil(remaining / monthsLeft) : null, monthly: 0 };
  }
  const dated = active.filter(goal => goal.targetDate);
  const undated = active.filter(goal => !goal.targetDate);
  const requiredTotal = dated.reduce((sum, goal) => sum + info[goal.id].required, 0);

  if (requiredTotal >= pot) {
    for (const goal of dated) info[goal.id].monthly = requiredTotal ? Math.floor(info[goal.id].required * pot / requiredTotal) : 0;
  } else {
    for (const goal of dated) info[goal.id].monthly = info[goal.id].required;
    const leftover = pot - requiredTotal;
    const receivers = undated.length ? undated : dated;
    const weight = goal => (undated.length ? info[goal.id].remaining : info[goal.id].required);
    const totalWeight = receivers.reduce((sum, goal) => sum + weight(goal), 0);
    for (const goal of receivers) info[goal.id].monthly += totalWeight ? Math.floor(leftover * weight(goal) / totalWeight) : 0;
  }

  for (const goal of goals) {
    const item = info[goal.id];
    item.monthly = Math.min(item.monthly, item.remaining);
    item.etaMonths = item.remaining === 0 ? 0 : item.monthly > 0 ? Math.ceil(item.remaining / item.monthly) : null;
    item.etaKey = item.etaMonths != null ? addMonths(now, item.etaMonths) : null;
    item.delayMonths = item.monthsLeft && item.etaMonths != null ? Math.max(0, item.etaMonths - item.monthsLeft) : 0;
    item.status = item.remaining === 0 ? 'complete'
      : item.monthly === 0 ? 'paused'
      : goal.targetDate && item.monthly < item.required ? 'behind'
      : 'onTrack';
    item.progress = goal.target ? Math.min(100, Math.round(goal.saved / goal.target * 100)) : 0;
  }
  return {
    byId: info,
    pot,
    requiredTotal,
    shortfall: Math.max(0, requiredTotal - pot),
    unassigned: active.length ? 0 : pot,
  };
}

export function emergencyGoal(state) {
  return (state.goals || []).find(goal => goal.kind === 'emergency') || null;
}

// What happens when a payment is bigger than the spendable balance.
export function coverageFor(amount, state, money) {
  const shortBy = Math.max(0, Math.round(amount) - money.spendable);
  const reserve = emergencyGoal(state);
  const available = reserve ? reserve.saved : 0;
  return { shortBy, reserve, canCover: shortBy === 0 || available >= shortBy };
}

export function categoryBreakdown(transactions = [], previous = { byCategory: {} }, now = new Date()) {
  const totals = new Map();
  for (const tx of transactions) {
    if (!isSpending(tx) || tx.kind === 'transfer' || !isThisMonth(tx, now)) continue;
    const found = totals.get(tx.category) || { id: tx.category, total: 0, count: 0 };
    found.total += -tx.amount;
    found.count += 1;
    totals.set(tx.category, found);
  }
  const transfers = transactions.filter(tx => tx.kind === 'transfer' && isThisMonth(tx, now));
  if (transfers.length) {
    totals.set('transfer', { id: 'transfer', total: transfers.reduce((s, tx) => s - tx.amount, 0), count: transfers.length });
  }
  return [...totals.values()]
    .map(item => {
      const prev = previous.byCategory?.[item.id] || 0;
      // Compare against the same share of last month, so day 10 isn't judged against a full month.
      const prevSoFar = prev * (now.getDate() / daysInMonth(now));
      return { ...item, prevSoFar, change: prevSoFar > 0 ? Math.round((item.total - prevSoFar) / prevSoFar * 100) : null };
    })
    .sort((a, b) => b.total - a.total);
}

// Cumulative spending by day of month, for the pace chart.
export function cumulativeByDay(transactions = [], now = new Date()) {
  const perDay = new Array(daysInMonth(now) + 1).fill(0);
  for (const tx of transactions) {
    if (!isSpending(tx) || !isThisMonth(tx, now) || !tx.date) continue;
    perDay[new Date(tx.date).getDate()] += -tx.amount;
  }
  const points = [];
  let running = 0;
  for (let day = 1; day <= now.getDate(); day += 1) {
    running += perDay[day];
    points.push({ day, total: running });
  }
  return points;
}

// The month as one reconciled flow: income → fixed → saved → spent → left.
export function monthFlow(state, money, now = new Date()) {
  const sumKind = kind => (state.transactions || []).filter(tx => tx.kind === kind && isThisMonth(tx, now)).reduce((s, tx) => s + tx.amount, 0);
  const contributions = -sumKind('goal');
  const releases = sumKind('release');
  const coverage = sumKind('coverage');
  const adjustmentOther = (Number(state.spendableAdjustment) || 0) + contributions - releases - coverage;
  return {
    income: money.salary,
    fixed: money.fixed,
    autoSaved: money.savedTotal,
    contributions,
    releases,
    coverage,
    other: adjustmentOther,
    spent: money.monthSpend,
    left: money.spendableRaw,
  };
}

export function addExperience(state, earned) {
  const total = Math.max(0, (Math.max(1, Number(state.level) || 1) - 1) * 1000 + (Number(state.xp) || 0) + earned);
  return { xp: total % 1000, level: Math.floor(total / 1000) + 1 };
}
