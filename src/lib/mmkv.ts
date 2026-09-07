import { Platform } from 'react-native';

// ponytail: fallback storage in memory for web/testing/server environments
class MemoryStorage {
  private store = new Map<string, string | number | boolean>();

  set(key: string, value: string | number | boolean) {
    this.store.set(key, value);
  }

  getString(key: string): string | undefined {
    const val = this.store.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  getNumber(key: string): number | undefined {
    const val = this.store.get(key);
    return typeof val === 'number' ? val : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.store.get(key);
    return typeof val === 'boolean' ? val : undefined;
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}

export type StorageInterface = {
  set(key: string, value: string | number | boolean): void;
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  remove(key: string): boolean | void;
  delete(key: string): void;
  clearAll?(): void;
};

// Lazy-init: defer createMMKV() to first actual use so server-side rendering
// (Expo Router on Node.js) never triggers the native module at import time.
let _instance: any = null;

function getInstance(): any {
  if (_instance) return _instance;

  // On server/web, skip native MMKV entirely
  if (typeof window === 'undefined' && Platform.OS === 'web') {
    _instance = new MemoryStorage();
    return _instance;
  }

  try {
    const { createMMKV } = require('react-native-mmkv');
    _instance = createMMKV({ id: 'bibleunlock-storage' });
  } catch (e) {
    console.warn('[MMKV] Native module unavailable, using memory fallback:', e);
    _instance = new MemoryStorage();
  }
  return _instance;
}

export const storage: StorageInterface = {
  set: (k, v) => getInstance().set(k, v),
  getString: (k) => getInstance().getString(k),
  getNumber: (k) => getInstance().getNumber(k),
  getBoolean: (k) => getInstance().getBoolean(k),
  remove: (k) => {
    const inst = getInstance();
    return typeof inst.remove === 'function' ? inst.remove(k) : inst.delete(k);
  },
  delete: (k) => {
    const inst = getInstance();
    return typeof inst.remove === 'function' ? inst.remove(k) : inst.delete(k);
  },
  clearAll: () => getInstance().clearAll?.(),
};

// Storage Keys
export const STORAGE_KEYS = {
  DAILY_GOAL_MINUTES: 'daily_goal_minutes',
  TRANSLATION: 'bible_translation',
  BLOCKED_APPS: 'blocked_apps',
  IS_SHIELDED: 'is_shielded',
  CURRENT_STREAK: 'current_streak',
  LAST_READ_DATE: 'last_read_date',
  LAST_SCREEN_TIME_NOTIFICATION: 'last_screentime_notification',
  READING_PROGRESS_PREFIX: 'reading_seconds_',
} as const;

// Default Presets
export const DEFAULT_BLOCKED_APPS = [
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.google.android.youtube',
  'com.twitter.android',
  'com.reddit.frontpage',
];

export const DEFAULT_IOS_BLOCKED_CATEGORIES = [
  'social',
  'entertainment',
];

// Typed Storage Helpers

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyGoalMinutes(): number {
  return storage.getNumber(STORAGE_KEYS.DAILY_GOAL_MINUTES) ?? 10;
}

export function setDailyGoalMinutes(minutes: number): void {
  storage.set(STORAGE_KEYS.DAILY_GOAL_MINUTES, Math.max(1, minutes));
}

export function getReadingProgress(dateKey: string = getTodayDateKey()): number {
  return storage.getNumber(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${dateKey}`) ?? 0;
}

export function setReadingProgress(seconds: number, dateKey: string = getTodayDateKey()): void {
  storage.set(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${dateKey}`, seconds);
}

export function addReadingSeconds(secondsDelta: number, dateKey: string = getTodayDateKey()): number {
  const current = getReadingProgress(dateKey);
  const updated = current + secondsDelta;
  setReadingProgress(updated, dateKey);
  return updated;
}

export function getBibleTranslation(): 'WEB' | 'KJV' {
  const val = storage.getString(STORAGE_KEYS.TRANSLATION);
  return val === 'KJV' ? 'KJV' : 'WEB';
}

export function setBibleTranslation(translation: 'WEB' | 'KJV'): void {
  storage.set(STORAGE_KEYS.TRANSLATION, translation);
}

export function getBlockedApps(): string[] {
  const raw = storage.getString(STORAGE_KEYS.BLOCKED_APPS);
  if (!raw) return DEFAULT_BLOCKED_APPS;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BLOCKED_APPS;
  }
}

export function setBlockedApps(apps: string[]): void {
  storage.set(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(apps));
}

export function getIsShielded(): boolean {
  return storage.getBoolean(STORAGE_KEYS.IS_SHIELDED) ?? false;
}

export function setIsShielded(shielded: boolean): void {
  storage.set(STORAGE_KEYS.IS_SHIELDED, shielded);
}

export function getStreak(): { currentStreak: number; lastReadDate: string | null } {
  const currentStreak = storage.getNumber(STORAGE_KEYS.CURRENT_STREAK) ?? 0;
  const lastReadDate = storage.getString(STORAGE_KEYS.LAST_READ_DATE) ?? null;
  return { currentStreak, lastReadDate };
}

export function updateStreakOnGoalMet(): { currentStreak: number } {
  const today = getTodayDateKey();
  const { currentStreak, lastReadDate } = getStreak();

  if (lastReadDate === today) {
    // Already counted today
    return { currentStreak };
  }

  let newStreak = 1;
  if (lastReadDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (lastReadDate === yKey) {
      newStreak = currentStreak + 1;
    }
  }

  storage.set(STORAGE_KEYS.CURRENT_STREAK, newStreak);
  storage.set(STORAGE_KEYS.LAST_READ_DATE, today);
  return { currentStreak: newStreak };
}

export function getLastScreenTimeNotificationDate(): string | null {
  return storage.getString(STORAGE_KEYS.LAST_SCREEN_TIME_NOTIFICATION) ?? null;
}

export function setLastScreenTimeNotificationDate(dateStr: string): void {
  storage.set(STORAGE_KEYS.LAST_SCREEN_TIME_NOTIFICATION, dateStr);
}
