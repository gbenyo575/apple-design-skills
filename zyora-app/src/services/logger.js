import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const LOG_STORAGE_KEY = '@zyora/structured-logs-v1';
const MAX_EVENTS = 5000;
const SCHEMA_VERSION = 1;
const APP_VERSION = '0.5.0';
const FORBIDDEN_KEYS = /(code|password|secret|token|raw|content|statement|merchant|description|email|phone|amount|balance)/i;

let initialized = false;
let sessionId = null;
let sequence = 0;
let events = [];
let persistChain = Promise.resolve();

function makeSessionId() {
  try {
    return Crypto.randomUUID();
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function sanitizeProperties(input) {
  if (!input || typeof input !== 'object') return {};
  return Object.entries(input).reduce((safe, [key, value]) => {
    if (FORBIDDEN_KEYS.test(key)) return safe;
    if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) safe[key] = value;
    else if (Array.isArray(value)) safe[key] = value.slice(0, 30).map(item => (
      ['string', 'number', 'boolean'].includes(typeof item) ? item : String(item)
    ));
    return safe;
  }, {});
}

// Writes are debounced: serialising up to 5 000 events on every tap or
// slider tick used to block the JS thread mid-gesture.
let persistTimer = null;
function writeNow() {
  const payload = JSON.stringify(events.slice(-MAX_EVENTS));
  persistChain = persistChain.then(() => AsyncStorage.setItem(LOG_STORAGE_KEY, payload)).catch(() => null);
  return persistChain;
}

function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(writeNow, 1500);
}

export async function initializeLogger() {
  if (initialized) return;
  sessionId = makeSessionId();
  try {
    const stored = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    events = Array.isArray(parsed) ? parsed.slice(-MAX_EVENTS) : [];
  } catch {
    events = [];
  }
  sequence = events.reduce((max, event) => Math.max(max, Number(event.sequence) || 0), 0);
  initialized = true;
}

export async function logEvent(event, options = {}) {
  await initializeLogger();
  sequence += 1;
  const record = {
    timestamp: new Date().toISOString(),
    level: options.level || 'info',
    event,
    sessionId,
    sequence,
    screen: options.screen || null,
    action: options.action || null,
    properties: sanitizeProperties(options.properties),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
  };
  events = [...events.slice(-(MAX_EVENTS - 1)), record];
  persist();
  return record;
}

export function logScreenView(screen) {
  return logEvent('screen.view', { screen, action: 'view' });
}

export async function exportStructuredLogs() {
  await initializeLogger();
  await logEvent('logs.export_requested', { screen: 'settings', action: 'export' });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await writeNow();
  const file = new File(Paths.cache, `zyora-v${APP_VERSION}-${stamp}.jsonl`);
  if (file.exists) file.delete();
  file.create({ overwrite: true, intermediates: true });
  file.write(`${events.map(item => JSON.stringify(item)).join('\n')}\n`);
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing-unavailable');
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Zyora diagnostic log',
    mimeType: 'application/x-ndjson',
    UTI: 'public.json',
  });
  return { eventCount: events.length };
}

export async function clearStructuredLogs() {
  events = [];
  sequence = 0;
  clearTimeout(persistTimer);
  await AsyncStorage.removeItem(LOG_STORAGE_KEY).catch(() => null);
  await logEvent('logs.cleared', { screen: 'settings', action: 'clear' });
}

export async function getLogStats() {
  await initializeLogger();
  return { eventCount: events.length, schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION };
}
