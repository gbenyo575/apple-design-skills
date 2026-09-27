// Pure demo calculations. No banking or payment API is involved.
export function spentFromTransactions(transactions = []) {
  return transactions.reduce((sum, item) => sum + (item.amount < 0 && item.kind !== 'goal' ? -item.amount : 0), 0);
}

export function calculateMoney(state) {
  const salary = Math.max(0, Number(state.salary) || 0);
  const fixed = Math.round(salary * (Number(state.fixedRate) || 0) / 100);
  const savedTotal = Math.round(salary * (Number(state.savingsRate) || 0) / 100);
  const goals = Math.round(savedTotal * .7);
  const emergency = savedTotal - goals;
  const plannedSpendable = Math.max(0, salary - fixed - savedTotal);
  const monthSpend = spentFromTransactions(state.transactions);
  const spendable = Math.max(0, plannedSpendable - monthSpend + (Number(state.spendableAdjustment) || 0));
  const totalGoals = (state.goals || []).reduce((sum, goal) => sum + (Number(goal.saved) || 0), 0);
  return {
    fixed, savedTotal, goals, emergency, spendable, plannedSpendable, monthSpend,
    totalGoals, investments: 0, totalWealth: spendable + totalGoals,
    daily: Math.round(spendable / 30), yearlySavings: savedTotal * 12,
    delta: savedTotal - (Number(state.previousMonthSavings) || 0),
  };
}

export function calculateMonth(state, money) {
  const completedMissions = (state.missions || []).filter(item => item.done).length;
  const budget = Math.max(0, money.plannedSpendable);
  const spent = money.monthSpend;
  const remaining = Math.max(0, budget - spent);
  const criteria = [
    { id: 'save', done: state.savingsRate >= 15, labelHu: 'Legalább 15% tervezett megtakarítás', labelEn: 'At least 15% planned savings' },
    { id: 'missions', done: completedMissions >= 3, labelHu: '3 pénzügyi küldetés teljesítése', labelEn: 'Complete 3 money missions' },
    { id: 'goal', done: (state.goals || []).length > 0, labelHu: 'Legalább 1 aktív megtakarítási cél', labelEn: 'Keep at least 1 active savings goal' },
    { id: 'budget', done: spent <= budget, labelHu: 'Maradj a költési keret alatt', labelEn: 'Stay within your spending budget' },
  ];
  const completedCriteria = criteria.filter(item => item.done).length;
  return {
    budget, spent, remaining, budgetUsage: budget ? Math.round(spent / budget * 100) : (spent ? 101 : 0),
    completedMissions, criteria, completedCriteria,
    feeFreeProgress: completedCriteria / criteria.length * 100,
    feeFreeEligible: completedCriteria === criteria.length,
  };
}

export function addExperience(state, earned) {
  const total = Math.max(0, (Math.max(1, Number(state.level) || 1) - 1) * 1000 + (Number(state.xp) || 0) + earned);
  return { xp: total % 1000, level: Math.floor(total / 1000) + 1 };
}
