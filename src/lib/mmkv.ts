import { Platform } from 'react-native';
import { OnboardingData, HabitDay, ImpactStats } from '../types/onboarding';

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
  ONBOARDING_DATA: 'onboarding_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  USER_NAME: 'user_name',
  SCHEDULED_READING_TIMES: 'scheduled_reading_times',
  PAUSE_BLOCKING_UNTIL: 'pause_blocking_until',
  TOTAL_SESSIONS_COUNT: 'total_sessions_count',
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

// Onboarding State Helpers

const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  language: 'en',
  userName: 'Disciple',
  readingFrequency: ['Every day'],
  biggestChallenges: ['Social media distractions'],
  readingTimes: ['7:00 AM'],
  durationMinutes: 10,
  blockedApps: DEFAULT_BLOCKED_APPS,
  isCompleted: false,
};

export function getOnboardingData(): OnboardingData {
  const raw = storage.getString(STORAGE_KEYS.ONBOARDING_DATA);
  if (!raw) return DEFAULT_ONBOARDING_DATA;
  try {
    return { ...DEFAULT_ONBOARDING_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ONBOARDING_DATA;
  }
}

export function setOnboardingData(data: Partial<OnboardingData>): void {
  const current = getOnboardingData();
  const updated = { ...current, ...data };
  storage.set(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(updated));

  if (data.userName) {
    setUserName(data.userName);
  }
  if (data.durationMinutes) {
    setDailyGoalMinutes(data.durationMinutes);
  }
  if (data.blockedApps) {
    setBlockedApps(data.blockedApps);
  }
  if (data.readingTimes) {
    setScheduledReadingTimes(data.readingTimes);
  }
  if (typeof data.isCompleted === 'boolean') {
    setOnboardingCompleted(data.isCompleted);
  }
}

export function isOnboardingCompleted(): boolean {
  return storage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED) ?? false;
}

export function setOnboardingCompleted(completed: boolean): void {
  storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
}

export function getUserName(): string {
  return storage.getString(STORAGE_KEYS.USER_NAME) ?? 'Disciple';
}

export function setUserName(name: string): void {
  storage.set(STORAGE_KEYS.USER_NAME, name.trim());
}

export function getScheduledReadingTimes(): string[] {
  const raw = storage.getString(STORAGE_KEYS.SCHEDULED_READING_TIMES);
  if (!raw) return ['7:00 AM'];
  try {
    return JSON.parse(raw);
  } catch {
    return ['7:00 AM'];
  }
}

export function setScheduledReadingTimes(times: string[]): void {
  storage.set(STORAGE_KEYS.SCHEDULED_READING_TIMES, JSON.stringify(times));
}

// Pause Blocking Helpers (Allows pausing shields for 15m, 30m, 1h)

export function getPauseBlockingUntil(): number | null {
  const val = storage.getNumber(STORAGE_KEYS.PAUSE_BLOCKING_UNTIL);
  return typeof val === 'number' ? val : null;
}

export function setPauseBlockingUntil(untilTimestamp: number | null): void {
  if (untilTimestamp === null) {
    storage.delete(STORAGE_KEYS.PAUSE_BLOCKING_UNTIL);
  } else {
    storage.set(STORAGE_KEYS.PAUSE_BLOCKING_UNTIL, untilTimestamp);
  }
}

export function isBlockingPaused(): boolean {
  const until = getPauseBlockingUntil();
  if (!until) return false;
  if (Date.now() > until) {
    setPauseBlockingUntil(null);
    return false;
  }
  return true;
}

// 30-Day Habit Timeline

export function getReadingHistory30Days(): HabitDay[] {
  const days: HabitDay[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const goalSeconds = getDailyGoalMinutes() * 60;

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const progressSec = getReadingProgress(dateKey);
    const completed = progressSec >= goalSeconds;

    days.push({
      date: dateKey,
      dayLabel: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      completed,
      isToday: i === 0,
    });
  }

  return days;
}

// Impact Stats & Sessions

export function getTotalSessionsCount(): number {
  return storage.getNumber(STORAGE_KEYS.TOTAL_SESSIONS_COUNT) ?? 0;
}

export function incrementSessionsCount(): number {
  const current = getTotalSessionsCount();
  const updated = current + 1;
  storage.set(STORAGE_KEYS.TOTAL_SESSIONS_COUNT, updated);
  return updated;
}

export function getImpactStats(): ImpactStats {
  const history = getReadingHistory30Days();
  let totalSeconds = 0;
  for (const day of history) {
    totalSeconds += getReadingProgress(day.date);
  }

  const minutesRead = Math.floor(totalSeconds / 60);
  // Estimate: for every 1 min of Scripture read, ~3 mins of doomscrolling saved
  const hoursSaved = parseFloat(((totalSeconds * 3) / 3600).toFixed(1));
  const sessions = getTotalSessionsCount();

  return {
    minutesRead,
    hoursSaved,
    sessions,
  };
}

