import { formatMoney, formatReleaseTime } from '../format';
import { isThisMonth } from '../finance';

// Notifications are derived from the demo state rather than stored, so they
// always explain what actually happened to the money — and stay in sync.
export function buildNotifications({ state, money, month, goalPlan, t }) {
  const lang = state.lang;
  const prefs = state.notificationPrefs || {};
  const items = [];
  const now = new Date();

  if (prefs.shield !== false) {
    for (const item of state.pendingReleases || []) {
      const name = lang === 'en' ? item.goalNameEn || item.goalName : item.goalName;
      items.push({
        id: `pending-${item.id}`,
        icon: 'time-outline',
        tone: 'purple',
        title: t('notif.pendingTitle', { amount: formatMoney(item.amount, lang) }),
        body: t('notif.pendingBody', { goal: name, time: formatReleaseTime(item.releaseAt, lang, now) }),
        date: item.createdAt,
        href: state.goals.some(goal => goal.id === item.goalId) ? `/goal/${item.goalId}` : '/goals',
      });
    }
  }

  if (prefs.budget !== false && month.budget > 0) {
    if (month.pace === 'over' || money.overspent > 0) {
      items.push({ id: `budget-over-${state.seedMonth}`, icon: 'alert-circle-outline', tone: 'red', title: t('notif.overTitle'), body: t('notif.overBody', { amount: formatMoney(month.spent - month.budget, lang) }), date: now.toISOString(), href: '/insights' });
    } else if (month.pace === 'fast') {
      items.push({ id: `budget-fast-${state.seedMonth}-${month.day}`, icon: 'speedometer-outline', tone: 'orange', title: t('notif.fastTitle'), body: t('notif.fastBody', { daily: formatMoney(money.daily, lang) }), date: now.toISOString(), href: '/insights' });
    }
  }

  if (prefs.goals !== false) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8).toISOString();
    const lastActivity = goalId => (state.transactions || []).find(tx => tx.goalId === goalId)?.date || today;
    for (const goal of state.goals) {
      const plan = goalPlan.byId[goal.id];
      if (!plan) continue;
      const name = lang === 'en' ? goal.nameEn || goal.name : goal.name;
      if (plan.status === 'complete') {
        items.push({ id: `goal-done-${goal.id}`, icon: 'trophy-outline', tone: 'green', title: t('notif.goalDoneTitle', { goal: name }), body: t('notif.goalDoneBody'), date: lastActivity(goal.id), href: `/goal/${goal.id}` });
      } else if (plan.progress >= 60) {
        items.push({ id: `goal-milestone-${goal.id}-${Math.floor(plan.progress / 10)}`, icon: 'flag-outline', tone: 'purple', title: t('notif.milestoneTitle', { goal: name, pct: plan.progress }), body: t('notif.milestoneBody', { amount: formatMoney(plan.remaining, lang) }), date: lastActivity(goal.id), href: `/goal/${goal.id}` });
      }
    }
  }

  if (prefs.salary !== false) {
    const salaryTx = (state.transactions || []).find(tx => tx.kind === 'income' && isThisMonth(tx, now));
    if (salaryTx) {
      items.push({
        id: `salary-${salaryTx.id}-${state.seedMonth}`,
        icon: 'arrow-down-circle-outline',
        tone: 'green',
        title: t('notif.salaryTitle', { amount: formatMoney(salaryTx.amount, lang) }),
        body: t('notif.salaryBody', { saved: formatMoney(money.savedTotal, lang), spendable: formatMoney(money.plannedSpendable, lang) }),
        date: salaryTx.date,
        href: '/plan',
      });
    }
  }

  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}
