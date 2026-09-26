import { storage } from './mmkv';

export type ReaderFontFamily = 'serif' | 'sans';
export type ReaderThemeMode = 'system' | 'sepia' | 'midnight';

export interface ReaderPreferences {
  fontSize: number;
  fontFamily: ReaderFontFamily;
  readerTheme: ReaderThemeMode;
}

const STORAGE_KEYS = {
  FONT_SIZE: 'reader_font_size',
  FONT_FAMILY: 'reader_font_family',
  READER_THEME: 'reader_theme_mode',
} as const;

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontSize: 18,
  fontFamily: 'serif',
  readerTheme: 'system',
};

export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 26;

// In-memory cache for 0ms synchronous reads during render
let _preferencesCache: ReaderPreferences | null = null;
const _preferenceListeners = new Set<(prefs: ReaderPreferences) => void>();

export function getReaderPreferences(): ReaderPreferences {
  if (_preferencesCache !== null) {
    return _preferencesCache;
  }

  const storedSize = storage.getNumber(STORAGE_KEYS.FONT_SIZE);
  const storedFamily = storage.getString(STORAGE_KEYS.FONT_FAMILY) as ReaderFontFamily | undefined;
  const storedTheme = storage.getString(STORAGE_KEYS.READER_THEME) as ReaderThemeMode | undefined;

  const fontSize = typeof storedSize === 'number' && storedSize >= MIN_FONT_SIZE && storedSize <= MAX_FONT_SIZE
    ? storedSize
    : DEFAULT_READER_PREFERENCES.fontSize;

  const fontFamily: ReaderFontFamily = storedFamily === 'sans' || storedFamily === 'serif'
    ? storedFamily
    : DEFAULT_READER_PREFERENCES.fontFamily;

  const readerTheme: ReaderThemeMode = storedTheme === 'sepia' || storedTheme === 'midnight' || storedTheme === 'system'
    ? storedTheme
    : DEFAULT_READER_PREFERENCES.readerTheme;

  _preferencesCache = {
    fontSize,
    fontFamily,
    readerTheme,
  };

  return _preferencesCache;
}

export function setReaderPreferences(updates: Partial<ReaderPreferences>): ReaderPreferences {
  const current = getReaderPreferences();
  const next: ReaderPreferences = {
    fontSize: updates.fontSize !== undefined ? Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, updates.fontSize)) : current.fontSize,
    fontFamily: updates.fontFamily !== undefined ? updates.fontFamily : current.fontFamily,
    readerTheme: updates.readerTheme !== undefined ? updates.readerTheme : current.readerTheme,
  };

  _preferencesCache = next;

  if (updates.fontSize !== undefined) {
    storage.set(STORAGE_KEYS.FONT_SIZE, next.fontSize);
  }
  if (updates.fontFamily !== undefined) {
    storage.set(STORAGE_KEYS.FONT_FAMILY, next.fontFamily);
  }
  if (updates.readerTheme !== undefined) {
    storage.set(STORAGE_KEYS.READER_THEME, next.readerTheme);
  }

  // Notify active listeners
  _preferenceListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // ignore listener error
    }
  });

  return next;
}

export function resetReaderPreferences(): ReaderPreferences {
  return setReaderPreferences(DEFAULT_READER_PREFERENCES);
}

export function subscribeReaderPreferences(listener: (prefs: ReaderPreferences) => void): () => void {
  _preferenceListeners.add(listener);
  return () => {
    _preferenceListeners.delete(listener);
  };
}

