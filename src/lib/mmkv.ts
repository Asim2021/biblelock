import { Platform } from 'react-native';
import { OnboardingData, HabitDay, ImpactStats, YearMonthData } from '../types/onboarding';

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
    return typeof inst.remove === 'function' ? inst.remove(k) : inst.delete?.(k);
  },
  delete: (k) => {
    const inst = getInstance();
    if (typeof inst.remove === 'function') {
      inst.remove(k);
    } else if (typeof inst.delete === 'function') {
      inst.delete(k);
    }
  },
  clearAll: () => {
    _bookmarksCache = null;
    _collectionsCache = null;
    _blockedAppsCache = null;
    _scheduledTimesCache = null;
    _lastReadPositionCache = null;
    _progressCache.clear();
    _yearHistoryCache = null;
    getInstance().clearAll?.();
  },
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
  LAST_READ_POSITION: 'last_read_position',
  BOOKMARKS: 'user_bookmarks',
  COLLECTIONS: 'user_collections',
  THEME_MODE: 'theme_mode',
  DAILY_VERSE_NOTIFICATIONS_ENABLED: 'daily_verse_notifications_enabled',
  DAILY_VERSE_NOTIFICATION_COUNT: 'daily_verse_notification_count',
} as const;

// Default Presets
export const DEFAULT_BLOCKED_APPS = [
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.google.android.youtube',
  'com.twitter.android',
  'com.reddit.frontpage',
];

// In-Memory Synchronous Caches to eliminate repetitive JSON parse and disk read latency
const _progressCache = new Map<string, number>();
let _yearHistoryCache: { dateKey: string; goalSeconds: number; data: YearMonthData[] } | null = null;
let _blockedAppsCache: string[] | null = null;
let _scheduledTimesCache: string[] | null = null;
let _lastReadPositionCache: LastReadPosition | null = null;
let _bookmarksCache: Bookmark[] | null = null;
let _collectionsCache: VerseCollection[] | null = null;

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

const goalListeners = new Set<(minutes: number) => void>();
const progressListeners = new Set<(seconds: number, dateKey: string) => void>();

export function subscribeToGoalChanges(fn: (minutes: number) => void): () => void {
  goalListeners.add(fn);
  return () => goalListeners.delete(fn);
}

export function subscribeToProgressChanges(fn: (seconds: number, dateKey: string) => void): () => void {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

export function setDailyGoalMinutes(minutes: number): void {
  const sanitized = Math.max(1, minutes);
  _yearHistoryCache = null;
  storage.set(STORAGE_KEYS.DAILY_GOAL_MINUTES, sanitized);
  goalListeners.forEach((fn) => fn(sanitized));
}

export function getReadingProgress(dateKey: string = getTodayDateKey()): number {
  if (_progressCache.has(dateKey)) {
    return _progressCache.get(dateKey)!;
  }
  const val = storage.getNumber(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${dateKey}`) ?? 0;
  _progressCache.set(dateKey, val);
  return val;
}

export function setReadingProgress(seconds: number, dateKey: string = getTodayDateKey()): void {
  _progressCache.set(dateKey, seconds);
  _yearHistoryCache = null;
  storage.set(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${dateKey}`, seconds);
  progressListeners.forEach((fn) => fn(seconds, dateKey));
}

export function addReadingSeconds(secondsDelta: number, dateKey: string = getTodayDateKey()): number {
  const current = getReadingProgress(dateKey);
  const updated = current + secondsDelta;
  setReadingProgress(updated, dateKey);
  return updated;
}

const translationListeners = new Set<(tr: 'WEB' | 'KJV') => void>();

export function getBibleTranslation(): 'WEB' | 'KJV' {
  const val = storage.getString(STORAGE_KEYS.TRANSLATION);
  return val === 'KJV' ? 'KJV' : 'WEB';
}

export function setBibleTranslation(translation: 'WEB' | 'KJV'): void {
  storage.set(STORAGE_KEYS.TRANSLATION, translation);
  translationListeners.forEach((fn) => fn(translation));
}

export function subscribeBibleTranslation(listener: (tr: 'WEB' | 'KJV') => void): () => void {
  translationListeners.add(listener);
  return () => {
    translationListeners.delete(listener);
  };
}

export function getDailyVerseNotificationsEnabled(): boolean {
  return storage.getBoolean(STORAGE_KEYS.DAILY_VERSE_NOTIFICATIONS_ENABLED) ?? false;
}

export function setDailyVerseNotificationsEnabled(enabled: boolean): void {
  storage.set(STORAGE_KEYS.DAILY_VERSE_NOTIFICATIONS_ENABLED, enabled);
}

export function getDailyVerseNotificationCount(): number {
  const count = storage.getNumber(STORAGE_KEYS.DAILY_VERSE_NOTIFICATION_COUNT);
  return typeof count === 'number' && count >= 1 ? count : 3;
}

export function setDailyVerseNotificationCount(count: number): void {
  storage.set(STORAGE_KEYS.DAILY_VERSE_NOTIFICATION_COUNT, count);
}

export function getBlockedApps(): string[] {
  if (_blockedAppsCache !== null) {
    return _blockedAppsCache;
  }
  const raw = storage.getString(STORAGE_KEYS.BLOCKED_APPS);
  if (!raw) {
    _blockedAppsCache = DEFAULT_BLOCKED_APPS;
    return _blockedAppsCache;
  }
  try {
    const parsed = JSON.parse(raw);
    _blockedAppsCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BLOCKED_APPS;
    return _blockedAppsCache;
  } catch {
    _blockedAppsCache = DEFAULT_BLOCKED_APPS;
    return _blockedAppsCache;
  }
}

export function setBlockedApps(apps: string[]): void {
  _blockedAppsCache = apps;
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
  userName: '',
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
  const val = storage.getString(STORAGE_KEYS.USER_NAME);
  return val && val.trim().length > 0 ? val.trim() : 'Disciple';
}

export function setUserName(name: string): void {
  storage.set(STORAGE_KEYS.USER_NAME, name.trim());
}

export function getScheduledReadingTimes(): string[] {
  if (_scheduledTimesCache !== null) {
    return _scheduledTimesCache;
  }
  const raw = storage.getString(STORAGE_KEYS.SCHEDULED_READING_TIMES);
  if (!raw) {
    _scheduledTimesCache = ['7:00 AM'];
    return _scheduledTimesCache;
  }
  try {
    _scheduledTimesCache = JSON.parse(raw);
    return _scheduledTimesCache || ['7:00 AM'];
  } catch {
    _scheduledTimesCache = ['7:00 AM'];
    return _scheduledTimesCache;
  }
}

export function setScheduledReadingTimes(times: string[]): void {
  _scheduledTimesCache = times;
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

// Weekly & 30-Day Habit Timeline
export function getWeeklyHabitDays(): HabitDay[] {
  const days: HabitDay[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const goalSeconds = getDailyGoalMinutes() * 60;

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - currentDayOfWeek + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const progressSec = getReadingProgress(dateKey);
    const completed = progressSec >= goalSeconds;

    days.push({
      date: dateKey,
      dayLabel: dayNames[i],
      dayNumber: d.getDate(),
      completed,
      isToday: i === currentDayOfWeek,
      minutesRead: Math.floor(progressSec / 60),
    });
  }

  return days;
}

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
      minutesRead: Math.floor(progressSec / 60),
      secondsRead: progressSec,
    });
  }

  return days;
}

export function getReadingHistoryYear(): YearMonthData[] {
  const todayKey = getTodayDateKey();
  const goalSeconds = getDailyGoalMinutes() * 60;

  if (
    _yearHistoryCache &&
    _yearHistoryCache.dateKey === todayKey &&
    _yearHistoryCache.goalSeconds === goalSeconds
  ) {
    return _yearHistoryCache.data;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthsData: YearMonthData[] = [];

  for (let offset = 11; offset >= 0; offset--) {
    let targetMonth = currentMonth - offset;
    let targetYear = currentYear;
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    let totalSeconds = 0;
    let daysCompleted = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(targetMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${targetYear}-${monthStr}-${dayStr}`;
      const progressSec = getReadingProgress(dateKey);
      totalSeconds += progressSec;
      if (progressSec >= goalSeconds) {
        daysCompleted++;
      }
    }

    monthsData.push({
      monthIndex: targetMonth,
      monthLabel: monthNames[targetMonth],
      year: targetYear,
      minutesRead: Math.floor(totalSeconds / 60),
      daysCompleted,
      totalDays: daysInMonth,
      isCurrentMonth: offset === 0,
    });
  }

  _yearHistoryCache = {
    dateKey: todayKey,
    goalSeconds,
    data: monthsData,
  };

  return monthsData;
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
    totalSeconds += day.secondsRead ?? (day.minutesRead ? day.minutesRead * 60 : 0);
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

// Last Read Position Tracking
export interface LastReadPosition {
  bookIndex: number;
  bookName: string;
  chapterNumber: number;
  verseNumber?: number;
  updatedAt: number;
}

export function getLastReadPosition(): LastReadPosition {
  if (_lastReadPositionCache !== null) {
    return _lastReadPositionCache;
  }
  const json = storage.getString(STORAGE_KEYS.LAST_READ_POSITION);
  if (json) {
    try {
      _lastReadPositionCache = JSON.parse(json);
      return _lastReadPositionCache!;
    } catch {
      // ignore parse failure
    }
  }
  const fallback: LastReadPosition = {
    bookIndex: 0,
    bookName: 'Genesis',
    chapterNumber: 1,
    verseNumber: 1,
    updatedAt: Date.now(),
  };
  _lastReadPositionCache = fallback;
  return fallback;
}

export function setLastReadPosition(pos: LastReadPosition): void {
  _lastReadPositionCache = pos;
  storage.set(STORAGE_KEYS.LAST_READ_POSITION, JSON.stringify(pos));
}

// Bookmarks & Collections Management
export interface VerseCollection {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Bookmark {
  id: string; // format: bm_${bookName}_${chapter}_${verse}
  title: string;
  bookIndex: number;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
  color: string;
  collectionIds: string[]; // which collections this verse belongs to
  collectionId?: string; // deprecated, migrated to collectionIds
  collectionName?: string; // deprecated
  note?: string;
  createdAt: number;
  isPinnedLastRead?: boolean;
}

export const COLLECTION_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#f59e0b', // Yellow
  '#d97706', // Ochre / Amber
];

export const DEFAULT_COLLECTIONS: VerseCollection[] = [];

export function getBookmarkId(bookName: string, chapter: number, verse: number): string {
  return `bm_${bookName.replace(/\s+/g, '_')}_${chapter}_${verse}`;
}

export function getCollections(): VerseCollection[] {
  if (_collectionsCache !== null) {
    return _collectionsCache;
  }
  const json = storage.getString(STORAGE_KEYS.COLLECTIONS);
  if (!json) {
    _collectionsCache = [];
    return _collectionsCache;
  }
  try {
    const list = JSON.parse(json);
    if (!Array.isArray(list)) {
      _collectionsCache = [];
      return _collectionsCache;
    }
    // Migration: purge legacy default collections so user starts with clean slate
    const filtered = list.filter((c) => c.id !== 'prayers' && c.id !== 'peace' && c.id !== 'strength');
    if (filtered.length !== list.length) {
      storage.set(STORAGE_KEYS.COLLECTIONS, JSON.stringify(filtered));
    }
    _collectionsCache = filtered;
    return _collectionsCache;
  } catch {
    _collectionsCache = [];
    return _collectionsCache;
  }
}

export function saveCollection(collection: VerseCollection): void {
  const list = getCollections();
  const filtered = list.filter((c) => c.id !== collection.id);
  const updated = [...filtered, collection];
  _collectionsCache = updated;
  storage.set(STORAGE_KEYS.COLLECTIONS, JSON.stringify(updated));
}

export function deleteCollection(id: string): void {
  const list = getCollections();
  const filtered = list.filter((c) => c.id !== id);
  _collectionsCache = filtered;
  storage.set(STORAGE_KEYS.COLLECTIONS, JSON.stringify(filtered));

  // Cascade to bookmarks: remove this collectionId from all bookmarks
  const bookmarks = getBookmarks();
  const updatedBookmarks: Bookmark[] = [];
  for (const bm of bookmarks) {
    if (bm.collectionIds && bm.collectionIds.includes(id)) {
      const remaining = bm.collectionIds.filter((cid) => cid !== id);
      if (remaining.length > 0) {
        updatedBookmarks.push({ ...bm, collectionIds: remaining });
      }
      // If remaining.length === 0, bookmark is dropped (cascade delete)
    } else {
      updatedBookmarks.push(bm);
    }
  }
  _bookmarksCache = updatedBookmarks;
  storage.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updatedBookmarks));
}

export function getBookmarks(): Bookmark[] {
  if (_bookmarksCache !== null) {
    return _bookmarksCache;
  }
  const json = storage.getString(STORAGE_KEYS.BOOKMARKS);
  if (!json) {
    _bookmarksCache = [];
    return _bookmarksCache;
  }
  try {
    const list = JSON.parse(json);
    if (!Array.isArray(list)) {
      _bookmarksCache = [];
      return _bookmarksCache;
    }
    let needsRewrite = false;
    const migrated = list.map((item: any) => {
      let cids = Array.isArray(item.collectionIds) ? item.collectionIds : (item.collectionId ? [item.collectionId] : []);
      // Strip legacy default collection IDs
      const cleaned = cids.filter((cid: string) => cid !== 'prayers' && cid !== 'peace' && cid !== 'strength');
      if (cleaned.length !== cids.length || !Array.isArray(item.collectionIds)) {
        needsRewrite = true;
      }
      return {
        ...item,
        collectionIds: cleaned,
      };
    });
    if (needsRewrite) {
      storage.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(migrated));
    }
    _bookmarksCache = migrated;
    return _bookmarksCache;
  } catch {
    _bookmarksCache = [];
    return _bookmarksCache;
  }
}

export function saveBookmark(bookmark: Bookmark): void {
  const list = getBookmarks();
  const filtered = list.filter((b) => b.id !== bookmark.id);
  const updated = [bookmark, ...filtered];
  _bookmarksCache = updated;
  storage.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
}

export function deleteBookmark(id: string): void {
  const list = getBookmarks();
  const filtered = list.filter((b) => b.id !== id);
  _bookmarksCache = filtered;
  storage.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered));
}

export function getBookmarkByVerse(bookName: string, chapter: number, verse: number): Bookmark | undefined {
  const id = getBookmarkId(bookName, chapter, verse);
  const list = getBookmarks();
  return list.find((b) => b.id === id || (b.bookName === bookName && b.chapterNumber === chapter && b.verseNumber === verse));
}

export function getCollectionIdsForVerse(bookName: string, chapter: number, verse: number): string[] {
  return getBookmarkByVerse(bookName, chapter, verse)?.collectionIds || [];
}

export function saveVerseBookmark(
  verseData: { bookIndex: number; bookName: string; chapterNumber: number; verseNumber: number; verseText: string; color?: string },
  collectionIds: string[],
  note?: string
): Bookmark | null {
  const id = getBookmarkId(verseData.bookName, verseData.chapterNumber, verseData.verseNumber);
  if (collectionIds.length === 0) {
    deleteBookmark(id);
    return null;
  }
  const existing = getBookmarkByVerse(verseData.bookName, verseData.chapterNumber, verseData.verseNumber);
  const bookmark: Bookmark = {
    id,
    title: `${verseData.bookName} ${verseData.chapterNumber}:${verseData.verseNumber}`,
    bookIndex: verseData.bookIndex,
    bookName: verseData.bookName,
    chapterNumber: verseData.chapterNumber,
    verseNumber: verseData.verseNumber,
    verseText: verseData.verseText,
    color: verseData.color || existing?.color || '#f59e0b',
    collectionIds,
    note: note !== undefined ? (note.trim() ? note.trim().slice(0, 200) : undefined) : existing?.note,
    createdAt: existing?.createdAt || Date.now(),
  };
  saveBookmark(bookmark);
  return bookmark;
}

export function addVerseToCollections(
  verseData: { bookIndex: number; bookName: string; chapterNumber: number; verseNumber: number; verseText: string; color?: string },
  collectionIds: string[],
  note?: string
): Bookmark {
  const existing = getBookmarkByVerse(verseData.bookName, verseData.chapterNumber, verseData.verseNumber);
  const merged = Array.from(new Set([...(existing?.collectionIds || []), ...collectionIds]));
  return saveVerseBookmark(verseData, merged, note)!;
}

export function removeVerseFromCollection(bookmarkId: string, collectionId: string): void {
  const list = getBookmarks();
  const target = list.find((b) => b.id === bookmarkId);
  if (!target) return;
  const remainingIds = (target.collectionIds || []).filter((cid) => cid !== collectionId);
  if (remainingIds.length === 0) {
    deleteBookmark(bookmarkId);
  } else {
    saveBookmark({ ...target, collectionIds: remainingIds });
  }
}

export function updateBookmarkNote(bookmarkId: string, note?: string): void {
  const list = getBookmarks();
  const target = list.find((b) => b.id === bookmarkId);
  if (!target) return;
  const trimmed = note?.trim() ? note.trim().slice(0, 200) : undefined;
  saveBookmark({ ...target, note: trimmed });
}

export function getBookmarksForCollection(collectionId: string): Bookmark[] {
  return getBookmarks().filter((b) => (b.collectionIds || []).includes(collectionId));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Theme Settings
export type ThemeMode = 'dark' | 'light' | 'system';

export function getThemeMode(): ThemeMode {
  return (storage.getString(STORAGE_KEYS.THEME_MODE) as ThemeMode) || 'dark';
}

export function setThemeMode(theme: ThemeMode): void {
  storage.set(STORAGE_KEYS.THEME_MODE, theme);
}

