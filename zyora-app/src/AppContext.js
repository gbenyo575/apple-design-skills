import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { initialGoals, initialMissions, initialTransactions } from './data';
import { translate } from './i18n';
import { calculateMoney, calculateMonth, addExperience } from './finance';
import { initializeLogger, logEvent } from './services/logger';

// New key deliberately leaves old imported statement data out of the demo.
const STORAGE_KEY = '@zyora/presentation-demo-v1';
const AppContext = createContext(null);
const newDemoState = (lang = 'hu') => ({
  lang, salary: 612400, savingsRate: 20, fixedRate: 32,
  spendableAdjustment: 0, previousMonthSavings: 103880, shieldHours: 24,
  xp: 780, level: 7, overspendSource: 'approval',
  goals: initialGoals.map(goal => ({ ...goal })),
  missions: initialMissions.map(mission => ({ ...mission })),
  transactions: initialTransactions.map(tx => ({ ...tx })),
  profile: { fullName: 'Bence · demó', email: '—', phone: '—', plan: 'Zyora · interaktív demó', joined: 'Demóprofil', studentVerified: false },
});

export function AppProvider({ children }) {
  const [state, setState] = useState(() => newDemoState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initializeLogger();
      try {
        await AsyncStorage.removeItem('@zyora/app-state-v3');
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const saved = JSON.parse(raw);
          // Only demo fields are restored. Imported statements from earlier versions
          // are never read, rendered or copied into this presentation build.
          const base = newDemoState(saved.lang === 'en' ? 'en' : 'hu');
          const allowed = ['salary','savingsRate','fixedRate','spendableAdjustment','previousMonthSavings',
            'shieldHours','xp','level','overspendSource','goals','missions','transactions'];
          const restored = { ...base };
          for (const key of allowed) if (saved[key] !== undefined) restored[key] = saved[key];
          setState(restored);
          logEvent('app.demo_restored', { action: 'restore' });
        }
      } catch {
        logEvent('app.demo_restore_failed', { level: 'warn', action: 'restore' });
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    const timer = setTimeout(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      logEvent('app.demo_persist_failed', { level: 'error', action: 'persist' });
    }), 200);
    return () => clearTimeout(timer);
  }, [loaded, state]);

  const update = useCallback(patch => setState(current => ({ ...current, ...patch })), []);
  const t = useCallback((key, vars) => translate(state.lang, key, vars), [state.lang]);
  const money = useMemo(() => calculateMoney(state), [state]);
  const month = useMemo(() => calculateMonth(state, money), [state, money]);

  const resetDemo = useCallback(async () => {
    const currentLang = state.lang;
    setState(newDemoState(currentLang));
    await logEvent('demo.reset', { screen: 'settings', action: 'reset' });
  }, [state.lang]);

  const setSalary = useCallback(value => {
    update({ salary: Math.max(0, Math.min(100000000, Math.round(Number(value) || 0))) });
    logEvent('split.salary_changed', { screen: 'split', action: 'change' });
  }, [update]);
  const setSavingsRate = useCallback(value => {
    update({ savingsRate: Math.max(5, Math.min(40, Math.round(value))) });
    logEvent('split.savings_rate_changed', { screen: 'split', action: 'change', properties: { rate: Math.round(value) } });
  }, [update]);

  const addGoal = useCallback(goal => {
    setState(current => ({ ...current,
      goals: [{ id: `goal-${Date.now()}`, saved: 0, monthly: 0, shield: current.shieldHours,
        category: 'SAJÁT CÉL', categoryEn: 'CUSTOM GOAL', ...goal }, ...current.goals],
      ...addExperience(current, 25),
    }));
    logEvent('goal.created', { screen: 'goals', action: 'create' });
  }, []);

  const updateGoal = useCallback((goalId, patch) => {
    setState(current => ({ ...current,
      goals: current.goals.map(goal => goal.id === goalId ? { ...goal, ...patch } : goal),
    }));
    logEvent('goal.updated', { screen: 'goals', action: 'update' });
  }, []);

  const contribute = useCallback((goalId, amount) => {
    const goal = state.goals.find(item => item.id === goalId);
    const available = calculateMoney(state).spendable;
    const actual = Math.min(Math.round(amount), goal ? goal.target - goal.saved : 0);
    if (!goal || actual <= 0 || actual > available) return { ok: false };
    setState(current => ({ ...current,
      goals: current.goals.map(item => item.id === goalId ? { ...item, saved: Math.min(item.target, item.saved + actual) } : item),
      transactions: [{ id: `goal-tx-${Date.now()}`, merchant: 'Célmegtakarítás', merchantEn: 'Goal contribution', icon: 'flag-outline', category: 'Megtakarítás', categoryEn: 'Savings', amount: -actual, date: 'most', dateEn: 'now', color: '#8A73FF', kind: 'goal' }, ...current.transactions],
      spendableAdjustment: current.spendableAdjustment - actual,
      ...addExperience(current, 20),
    }));
    logEvent('goal.demo_contribution', { screen: 'goals', action: 'contribute' });
    return { ok: true, amount: actual };
  }, [state]);

  const toggleMission = useCallback(missionId => {
    setState(current => {
      const mission = current.missions.find(item => item.id === missionId);
      if (!mission) return current;
      return { ...current,
        missions: current.missions.map(item => item.id === missionId ? { ...item, done: !item.done } : item),
        ...addExperience(current, mission.done ? -mission.xp : mission.xp),
      };
    });
    logEvent('mission.toggled', { screen: 'levels', action: 'toggle' });
  }, []);

  // Local, explicitly simulated transfer: no bank API and no real funds move.
  const sendMoney = useCallback((friend, amount) => {
    const value = Math.round(amount);
    if (!friend || !Number.isFinite(value) || value <= 0 || value > calculateMoney(state).spendable) return false;
    setState(current => ({ ...current,
      transactions: [{ id: `demo-send-${Date.now()}`, merchant: friend.name, icon: 'paper-plane-outline',
        category: 'Pénzküldés · demó', categoryEn: 'Transfer · demo', amount: -value,
        date: 'most', dateEn: 'now', color: '#BBAEFF', kind: 'transfer' }, ...current.transactions],
    }));
    logEvent('transfer.simulated', { screen: 'friends', action: 'simulate' });
    return true;
  }, [state]);

  const value = useMemo(() => ({ state, loaded, t, money, month, update,
    resetDemo, resetLocalFinancialData: resetDemo, setSalary, setSavingsRate,
    addGoal, updateGoal, contribute, toggleMission, sendMoney,
  }), [state, loaded, t, money, month, update, resetDemo, setSalary, setSavingsRate, addGoal, updateGoal, contribute, toggleMission, sendMoney]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function formatMoney(value, lang = 'hu', showSign = false) {
  const amount = Math.round(Math.abs(value || 0)).toLocaleString(lang === 'en' ? 'en-GB' : 'hu-HU');
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '−' : '') : '';
  return `${sign}${amount} ${lang === 'en' ? 'HUF' : 'Ft'}`;
}
