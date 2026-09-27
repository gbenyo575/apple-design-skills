import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { demoProfile, initialMissions, monthKey, seedGoals, seedTransactions } from './data';
import { addExperience, calculateMonth, calculateMoney, coverageFor, planGoals } from './finance';
import { translate } from './i18n';
import { initializeLogger, logEvent } from './services/logger';

// v2 changed the data model (dated transactions, fixed costs as an amount,
// Shield releases), so earlier demo states are discarded rather than migrated.
const STORAGE_KEY = '@zyora/demo-v2';
const LEGACY_KEYS = ['@zyora/presentation-demo-v1', '@zyora/app-state-v3'];
const XP = { goalCreated: 25, contribution: 20, goalCompleted: 100 };

const AppContext = createContext(null);

function newDemoState(lang = 'hu', now = new Date()) {
  return {
    version: 2,
    lang,
    seedMonth: monthKey(now),
    salary: 612400,
    fixedCosts: 195968,
    savingsRate: 20,
    overspendRule: 'ask',
    spendableAdjustment: 0,
    xp: 780,
    level: 7,
    goals: seedGoals(now),
    missions: initialMissions.map(mission => ({ ...mission })),
    transactions: seedTransactions(now),
    pendingReleases: [],
    notificationPrefs: { salary: true, budget: true, goals: true, shield: true },
    seenNotifications: [],
    proWaitlist: false,
  };
}

// A saved demo from an earlier month gets this month's example transactions,
// so the demo never opens on an empty month. Goals, XP and settings are kept.
function rollMonth(saved, now = new Date()) {
  if (saved.seedMonth === monthKey(now)) return saved;
  return { ...saved, seedMonth: monthKey(now), transactions: seedTransactions(now), spendableAdjustment: 0, seenNotifications: [] };
}

const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function withXp(current, earned) {
  const next = addExperience(current, earned);
  return { ...next, leveledUp: next.level > current.level ? next.level : null };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => newDemoState());
  const [loaded, setLoaded] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Applies a change synchronously to the ref too, so two quick actions
  // (double tap, fast presets) always validate against the latest numbers.
  const commit = useCallback(updater => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initializeLogger();
      try {
        await AsyncStorage.multiRemove(LEGACY_KEYS);
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (!mounted) return;
        if (saved?.version === 2) {
          const restored = rollMonth({ ...newDemoState(saved.lang === 'en' ? 'en' : 'hu'), ...saved });
          stateRef.current = restored;
          setState(restored);
          logEvent('app.demo_restored', { action: 'restore' });
        } else {
          setIsFirstRun(true);
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
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
        logEvent('app.demo_persist_failed', { level: 'error', action: 'persist' });
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [loaded, state]);

  // Shield releases: money waiting to return to the spendable balance.
  const processReleases = useCallback(() => {
    const now = Date.now();
    const due = (stateRef.current.pendingReleases || []).filter(item => new Date(item.releaseAt).getTime() <= now);
    if (!due.length) return;
    commit(current => ({
      ...current,
      pendingReleases: current.pendingReleases.filter(item => !due.some(d => d.id === item.id)),
      spendableAdjustment: current.spendableAdjustment + due.reduce((s, item) => s + item.amount, 0),
      transactions: [
        ...due.map(item => ({ id: uid('release'), merchant: item.goalName, merchantEn: item.goalNameEn, category: 'release', kind: 'release', amount: item.amount, goalId: item.goalId, date: new Date(item.releaseAt).toISOString() })),
        ...current.transactions,
      ],
    }));
    logEvent('shield.released', { action: 'release', properties: { count: due.length } });
  }, [commit]);

  useEffect(() => {
    if (!loaded) return undefined;
    processReleases();
    const interval = setInterval(processReleases, 30000);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') processReleases(); });
    return () => { clearInterval(interval); sub.remove(); };
  }, [loaded, processReleases]);

  const update = useCallback(patch => commit(current => ({ ...current, ...patch })), [commit]);
  const t = useCallback((key, vars) => translate(state.lang, key, vars), [state.lang]);
  const money = useMemo(() => calculateMoney(state), [state]);
  const month = useMemo(() => calculateMonth(state, money), [state, money]);
  const goalPlan = useMemo(() => planGoals(state, money), [state, money]);

  const actions = useMemo(() => ({
    setLang(lang) {
      update({ lang });
      logEvent('settings.language_changed', { action: 'change', properties: { lang } });
    },
    setSalary(value) {
      update({ salary: Math.max(0, Math.min(100000000, Math.round(Number(value) || 0))) });
      logEvent('plan.salary_changed', { screen: 'plan', action: 'change' });
    },
    setFixedCosts(value) {
      update({ fixedCosts: Math.max(0, Math.min(100000000, Math.round(Number(value) || 0))) });
      logEvent('plan.fixed_changed', { screen: 'plan', action: 'change' });
    },
    setSavingsRate(value) {
      const rate = Math.max(0, Math.min(50, Math.round(value)));
      update({ savingsRate: rate });
      logEvent('plan.savings_rate_changed', { screen: 'plan', action: 'change', properties: { rate } });
    },
    setOverspendRule(rule) {
      update({ overspendRule: rule === 'emergency' ? 'emergency' : 'ask' });
      logEvent('plan.overspend_rule_changed', { screen: 'plan', action: 'change', properties: { rule } });
    },

    addGoal({ emoji, name, target, targetDate, shield }) {
      const id = uid('goal');
      let leveledUp = null;
      commit(current => {
        const xp = withXp(current, XP.goalCreated);
        leveledUp = xp.leveledUp;
        return {
          ...current,
          xp: xp.xp,
          level: xp.level,
          goals: [...current.goals, { id, emoji: emoji || '🎯', name: name.trim(), target: Math.round(target), saved: 0, targetDate: targetDate || null, shield: shield ?? 24, createdAt: new Date().toISOString() }],
        };
      });
      logEvent('goal.created', { screen: 'goals', action: 'create' });
      return { id, xp: XP.goalCreated, leveledUp };
    },

    updateGoal(goalId, patch) {
      commit(current => ({ ...current, goals: current.goals.map(goal => (goal.id === goalId ? { ...goal, ...patch } : goal)) }));
      logEvent('goal.updated', { screen: 'goal', action: 'update' });
    },

    contribute(goalId, amount) {
      const current = stateRef.current;
      const goal = current.goals.find(item => item.id === goalId);
      const value = Math.round(Number(amount) || 0);
      if (!goal) return { ok: false, error: 'notFound' };
      const remaining = goal.target - goal.saved;
      if (value <= 0) return { ok: false, error: 'invalid' };
      if (remaining <= 0) return { ok: false, error: 'complete' };
      if (value > remaining) return { ok: false, error: 'exceedsTarget', remaining };
      if (value > calculateMoney(current).spendable) return { ok: false, error: 'insufficient' };
      const completed = value === remaining;
      let leveledUp = null;
      const earned = XP.contribution + (completed ? XP.goalCompleted : 0);
      commit(s => {
        const xp = withXp(s, earned);
        leveledUp = xp.leveledUp;
        return {
          ...s,
          xp: xp.xp,
          level: xp.level,
          goals: s.goals.map(item => (item.id === goalId ? { ...item, saved: item.saved + value } : item)),
          spendableAdjustment: s.spendableAdjustment - value,
          transactions: [{ id: uid('goal-tx'), merchant: goal.name, merchantEn: goal.nameEn, category: 'savings', kind: 'goal', amount: -value, goalId, date: new Date().toISOString() }, ...s.transactions],
        };
      });
      logEvent('goal.contribution', { screen: 'goal', action: 'contribute' });
      return { ok: true, amount: value, completed, xp: earned, leveledUp };
    },

    withdraw(goalId, amount) {
      const current = stateRef.current;
      const goal = current.goals.find(item => item.id === goalId);
      const value = Math.round(Number(amount) || 0);
      if (!goal) return { ok: false, error: 'notFound' };
      if (value <= 0) return { ok: false, error: 'invalid' };
      if (value > goal.saved) return { ok: false, error: 'exceedsSaved' };
      const shield = Number(goal.shield) || 0;
      const now = new Date();
      if (shield > 0) {
        const releaseAt = new Date(now.getTime() + shield * 3600000).toISOString();
        commit(s => ({
          ...s,
          goals: s.goals.map(item => (item.id === goalId ? { ...item, saved: item.saved - value } : item)),
          pendingReleases: [...(s.pendingReleases || []), { id: uid('pending'), goalId, goalName: goal.name, goalNameEn: goal.nameEn, amount: value, createdAt: now.toISOString(), releaseAt }],
        }));
        logEvent('goal.withdraw_scheduled', { screen: 'goal', action: 'withdraw', properties: { shield } });
        return { ok: true, pending: true, releaseAt };
      }
      commit(s => ({
        ...s,
        goals: s.goals.map(item => (item.id === goalId ? { ...item, saved: item.saved - value } : item)),
        spendableAdjustment: s.spendableAdjustment + value,
        transactions: [{ id: uid('release'), merchant: goal.name, merchantEn: goal.nameEn, category: 'release', kind: 'release', amount: value, goalId, date: now.toISOString() }, ...s.transactions],
      }));
      logEvent('goal.withdraw_instant', { screen: 'goal', action: 'withdraw' });
      return { ok: true, pending: false };
    },

    cancelRelease(releaseId) {
      const item = (stateRef.current.pendingReleases || []).find(entry => entry.id === releaseId);
      if (!item) return { ok: false };
      const goalExists = stateRef.current.goals.some(goal => goal.id === item.goalId);
      if (!goalExists) return { ok: false, error: 'goalDeleted' };
      commit(s => ({
        ...s,
        pendingReleases: s.pendingReleases.filter(entry => entry.id !== releaseId),
        goals: s.goals.map(goal => (goal.id === item.goalId ? { ...goal, saved: goal.saved + item.amount } : goal)),
      }));
      logEvent('shield.release_cancelled', { action: 'cancel' });
      return { ok: true, amount: item.amount };
    },

    deleteGoal(goalId) {
      const goal = stateRef.current.goals.find(item => item.id === goalId);
      if (!goal) return { ok: false };
      const shield = Number(goal.shield) || 0;
      const now = new Date();
      const releaseAt = new Date(now.getTime() + shield * 3600000).toISOString();
      commit(s => {
        const base = { ...s, goals: s.goals.filter(item => item.id !== goalId) };
        if (goal.saved <= 0) return base;
        if (shield > 0) {
          return { ...base, pendingReleases: [...(s.pendingReleases || []), { id: uid('pending'), goalId, goalName: goal.name, goalNameEn: goal.nameEn, amount: goal.saved, createdAt: now.toISOString(), releaseAt }] };
        }
        return {
          ...base,
          spendableAdjustment: s.spendableAdjustment + goal.saved,
          transactions: [{ id: uid('release'), merchant: goal.name, merchantEn: goal.nameEn, category: 'release', kind: 'release', amount: goal.saved, goalId, date: now.toISOString() }, ...s.transactions],
        };
      });
      logEvent('goal.deleted', { screen: 'goal', action: 'delete' });
      return { ok: true, amount: goal.saved, pending: goal.saved > 0 && shield > 0, releaseAt };
    },

    // Local, explicitly simulated transfer: no bank API and no real funds move.
    sendMoney(friend, amount, note = '') {
      const current = stateRef.current;
      const value = Math.round(Number(amount) || 0);
      if (!friend || value <= 0) return { ok: false, error: 'invalid' };
      const coverage = coverageFor(value, current, calculateMoney(current));
      if (!coverage.canCover) return { ok: false, error: 'insufficient' };
      const now = new Date().toISOString();
      commit(s => {
        const txs = [{ id: uid('send'), merchant: friend.name, merchantEn: friend.nameEn, friendId: friend.id, category: 'transfer', kind: 'transfer', amount: -value, note: note.trim(), date: now }];
        if (!coverage.shortBy) return { ...s, transactions: [...txs, ...s.transactions] };
        return {
          ...s,
          goals: s.goals.map(goal => (goal.id === coverage.reserve.id ? { ...goal, saved: goal.saved - coverage.shortBy } : goal)),
          spendableAdjustment: s.spendableAdjustment + coverage.shortBy,
          transactions: [...txs, { id: uid('cover'), merchant: coverage.reserve.name, merchantEn: coverage.reserve.nameEn, category: 'coverage', kind: 'coverage', amount: coverage.shortBy, goalId: coverage.reserve.id, date: now }, ...s.transactions],
        };
      });
      logEvent('transfer.simulated', { screen: 'send', action: 'simulate', properties: { covered: coverage.shortBy > 0 } });
      return { ok: true, amount: value, covered: coverage.shortBy };
    },

    toggleMission(missionId) {
      let result = null;
      commit(current => {
        const mission = current.missions.find(item => item.id === missionId);
        if (!mission) return current;
        const xp = withXp(current, mission.done ? -mission.xp : mission.xp);
        result = { done: !mission.done, xp: mission.xp, leveledUp: xp.leveledUp };
        return { ...current, xp: xp.xp, level: xp.level, missions: current.missions.map(item => (item.id === missionId ? { ...item, done: !item.done } : item)) };
      });
      logEvent('mission.toggled', { screen: 'levels', action: 'toggle' });
      return result;
    },

    setNotificationPref(key, value) {
      commit(current => ({ ...current, notificationPrefs: { ...current.notificationPrefs, [key]: value } }));
    },
    markNotificationsSeen(ids) {
      commit(current => ({ ...current, seenNotifications: [...new Set([...(current.seenNotifications || []), ...ids])].slice(-100) }));
    },
    joinProWaitlist() {
      update({ proWaitlist: true });
      logEvent('pro.waitlist_joined', { screen: 'pro', action: 'join' });
    },
    async resetDemo() {
      commit(current => newDemoState(current.lang));
      await logEvent('demo.reset', { screen: 'profile', action: 'reset' });
    },
  }), [commit, update]);

  const value = useMemo(() => ({
    state, loaded, isFirstRun, t, money, month, goalPlan, profile: demoProfile, ...actions,
  }), [state, loaded, isFirstRun, t, money, month, goalPlan, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
