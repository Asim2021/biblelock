import { ImageSourcePropType } from 'react-native';
import { SCROLL_BACKGROUNDS } from '../../assets/scroll-backgrounds';
import { storage } from './mmkv';

const UNSPLASH_CACHE_KEY = 'scroll_unsplash_image_urls';
const MAX_CACHED_URLS = 30;

let _memoryUrlCache: string[] | null = null;

function getCachedUrls(): string[] {
  if (_memoryUrlCache !== null) return _memoryUrlCache;
  const json = storage.getString(UNSPLASH_CACHE_KEY);
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        _memoryUrlCache = parsed;
        return _memoryUrlCache;
      }
    } catch {}
  }
  _memoryUrlCache = [];
  return _memoryUrlCache;
}

function saveCachedUrls(urls: string[]) {
  _memoryUrlCache = urls;
  storage.set(UNSPLASH_CACHE_KEY, JSON.stringify(urls));
}

let _isFetching = false;

export function clearScrollImageCache(): void {
  _memoryUrlCache = null;
}

export async function prefetchOnlineBackground(): Promise<void> {
  const rawKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 8 || _isFetching) {
    return;
  }
  const accessKey = rawKey.trim();

  const currentUrls = getCachedUrls();
  if (currentUrls.length >= MAX_CACHED_URLS) return;

  _isFetching = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const queries = ['nature+sunrise', 'mountain+light', 'starry+night', 'calm+water', 'ancient+olive+trees'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${randomQuery}&orientation=portrait&client_id=${encodeURIComponent(accessKey)}`,
      { signal: controller.signal }
    );
    if (res.ok) {
      const data = await res.json();
      const imageUrl = data?.urls?.regular;
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://')) {
        const updated = [...currentUrls, imageUrl];
        saveCachedUrls(updated);
      }
    }
  } catch {
    // Network or rate limit silently ignored, fallback to bundled assets
  } finally {
    clearTimeout(timeoutId);
    _isFetching = false;
  }
}

export function getBackgroundForIndex(index: number): ImageSourcePropType {
  const cachedUrls = getCachedUrls();
  if (cachedUrls.length > 0) {
    const remoteIndex = index % (cachedUrls.length + SCROLL_BACKGROUNDS.length);
    if (remoteIndex < cachedUrls.length) {
      return { uri: cachedUrls[remoteIndex] };
    }
  }
  return SCROLL_BACKGROUNDS[index % SCROLL_BACKGROUNDS.length];
}
