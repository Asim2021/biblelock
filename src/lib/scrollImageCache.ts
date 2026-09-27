import { ImageSourcePropType, Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SCROLL_BACKGROUNDS } from '../../assets/scroll-backgrounds';
import { storage } from './mmkv';

const BACKGROUNDS_DIR = `${FileSystem.documentDirectory}scroll-backgrounds/`;
const ARTWORK_PACK_KEY = 'scroll_sacred_artwork_pack_downloaded';

export const REMOTE_BACKGROUNDS_BASE_URL =
	'https://raw.githubusercontent.com/Asim2021/bible-translations/main/scroll-backgrounds/';

export interface RemoteBackgroundItem {
	id: number;
	filename: string;
	title: string;
	url: string;
}

export const REMOTE_BACKGROUND_CATALOG: RemoteBackgroundItem[] = [
	{ id: 11, filename: 'bg-11.webp', title: 'The Empty Tomb Dawn', url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-11.webp` },
	{
		id: 12,
		filename: 'bg-12.webp',
		title: 'Sea of Galilee Calm Waters',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-12.webp`,
	},
	{
		id: 13,
		filename: 'bg-13.webp',
		title: 'Mount of Olives Golden Twilight',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-13.webp`,
	},
	{
		id: 14,
		filename: 'bg-14.webp',
		title: 'Psalm 23 Green Pastures & Still Waters',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-14.webp`,
	},
	{
		id: 15,
		filename: 'bg-15.webp',
		title: 'Star of Bethlehem Holy Night',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-15.webp`,
	},
	{
		id: 16,
		filename: 'bg-16.webp',
		title: 'Garden of Gethsemane Moonlight',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-16.webp`,
	},
	{
		id: 17,
		filename: 'bg-17.webp',
		title: 'Golden Harvest Wheat Fields',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-17.webp`,
	},
	{
		id: 18,
		filename: 'bg-18.webp',
		title: 'Living Waters Mountain Stream',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-18.webp`,
	},
	{
		id: 19,
		filename: 'bg-19.webp',
		title: 'Holy Spirit Heavenly Dove',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-19.webp`,
	},
	{
		id: 20,
		filename: 'bg-20.webp',
		title: 'Mount Sinai Divine Rays',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-20.webp`,
	},
	{
		id: 21,
		filename: 'bg-21.webp',
		title: 'Jerusalem Golden Archway',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-21.webp`,
	},
	{
		id: 22,
		filename: 'bg-22.webp',
		title: 'Chapel Altar & Open Bible',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-22.webp`,
	},
	{
		id: 23,
		filename: 'bg-23.webp',
		title: 'The Narrow Path of Lilies',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-23.webp`,
	},
	{
		id: 24,
		filename: 'bg-24.webp',
		title: 'Cedars of Lebanon Morning Mist',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-24.webp`,
	},
	{
		id: 25,
		filename: 'bg-25.webp',
		title: 'Mount Carmel Coastal Dawn',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-25.webp`,
	},
	{
		id: 26,
		filename: 'bg-26.webp',
		title: 'Valley of Peace Sunbreak',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-26.webp`,
	},
	{
		id: 27,
		filename: 'bg-27.webp',
		title: 'Judean Hills Misty Morning',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-27.webp`,
	},
	{
		id: 28,
		filename: 'bg-28.webp',
		title: 'Living Waters of David',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-28.webp`,
	},
	{
		id: 29,
		filename: 'bg-29.webp',
		title: 'Galilee Dawn Shoreline',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-29.webp`,
	},
	{
		id: 30,
		filename: 'bg-30.webp',
		title: 'Sinai Night Sky of Stars',
		url: `${REMOTE_BACKGROUNDS_BASE_URL}bg-30.webp`,
	},
];

let _activeBackgroundPool: ImageSourcePropType[] = [...SCROLL_BACKGROUNDS];
let _isInitialized = false;
let _isDownloading = false;

async function ensureDirExists(): Promise<void> {
	const dir = await FileSystem.getInfoAsync(BACKGROUNDS_DIR);
	if (!dir.exists) {
		await FileSystem.makeDirectoryAsync(BACKGROUNDS_DIR, { intermediates: true });
	}
}

/**
 * Initializes the background pool by checking local storage for downloaded backgrounds
 */
export async function initializeBackgroundCache(): Promise<number> {
	if (_isInitialized) return _activeBackgroundPool.length;

	try {
		await ensureDirExists();
		const downloadedUris: ImageSourcePropType[] = [];

		for (const item of REMOTE_BACKGROUND_CATALOG) {
			const localPath = `${BACKGROUNDS_DIR}${item.filename}`;
			const info = await FileSystem.getInfoAsync(localPath);
			if (info.exists && info.size && info.size > 1000) {
				downloadedUris.push({ uri: localPath });
			}
		}

		_activeBackgroundPool = [...SCROLL_BACKGROUNDS, ...downloadedUris];
		_isInitialized = true;
		return _activeBackgroundPool.length;
	} catch (error) {
		console.warn('[ScrollImageCache] Failed to initialize backgrounds:', error);
		_activeBackgroundPool = [...SCROLL_BACKGROUNDS];
		_isInitialized = true;
		return _activeBackgroundPool.length;
	}
}

/**
 * Returns whether all 20 remote backgrounds are installed locally
 */
export function isArtworkPackInstalled(): boolean {
	return storage.getBoolean(ARTWORK_PACK_KEY) ?? false;
}

/**
 * Returns total count of available backgrounds (10 bundled + downloaded)
 */
export function getAvailableBackgroundCount(): number {
	return _activeBackgroundPool.length;
}

/**
 * Downloads the 20-image sacred artwork expansion pack
 */
export async function downloadSacredArtworkPack(
	onProgress?: (downloaded: number, total: number) => void,
): Promise<{ success: boolean; totalAvailable: number; error?: string }> {
	if (_isDownloading) {
		return { success: false, totalAvailable: _activeBackgroundPool.length, error: 'Download already in progress' };
	}

	_isDownloading = true;
	await ensureDirExists();

	const total = REMOTE_BACKGROUND_CATALOG.length;
	let downloadedCount = 0;
	const newLocalSources: ImageSourcePropType[] = [];

	try {
		for (let i = 0; i < total; i++) {
			const item = REMOTE_BACKGROUND_CATALOG[i];
			const localPath = `${BACKGROUNDS_DIR}${item.filename}`;
			const info = await FileSystem.getInfoAsync(localPath);

			if (info.exists && info.size && info.size > 1000) {
				newLocalSources.push({ uri: localPath });
				downloadedCount++;
				onProgress?.(downloadedCount, total);
				continue;
			}

			// Download from repository
			try {
				const downloadResult = await FileSystem.downloadAsync(item.url, localPath);
				if (downloadResult && downloadResult.status === 200) {
					newLocalSources.push({ uri: localPath });
					downloadedCount++;
				}
			} catch (dlErr) {
				console.warn(`[ScrollImageCache] Could not download ${item.filename}:`, dlErr);
			}

			onProgress?.(downloadedCount, total);
		}

		_activeBackgroundPool = [...SCROLL_BACKGROUNDS, ...newLocalSources];
		storage.set(ARTWORK_PACK_KEY, downloadedCount === total);

		return {
			success: downloadedCount > 0,
			totalAvailable: _activeBackgroundPool.length,
		};
	} catch (err: any) {
		return {
			success: false,
			totalAvailable: _activeBackgroundPool.length,
			error: err?.message || 'Download failed',
		};
	} finally {
		_isDownloading = false;
	}
}

/**
 * Returns the background image for a given index from the combined pool (up to 30)
 */
export function getBackgroundForIndex(index: number): ImageSourcePropType {
	const pool = _activeBackgroundPool;
	if (!pool || pool.length === 0) {
		return SCROLL_BACKGROUNDS[index % SCROLL_BACKGROUNDS.length];
	}
	return pool[index % pool.length];
}

/**
 * Pre-warms adjacent images in memory to ensure 0ms latency on swipe
 */
export function prewarmAdjacentBackgrounds(currentIndex: number): void {
	const pool = _activeBackgroundPool;
	if (!pool || pool.length <= 1) return;

	const nextIndex = (currentIndex + 1) % pool.length;
	const nextNextIndex = (currentIndex + 2) % pool.length;

	for (const idx of [nextIndex, nextNextIndex]) {
		const item = pool[idx];
		if (item && typeof item === 'object' && 'uri' in item && typeof item.uri === 'string') {
			Image.prefetch(item.uri).catch(() => {});
		}
	}
}
