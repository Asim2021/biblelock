import * as FileSystem from 'expo-file-system/legacy';
import {
  BibleCatalogItem,
  BIBLE_CATALOG,
  getCatalogItemDownloadUrl,
} from '../data/bibleCatalog';
import {
  getInstalledTranslationsList,
  setInstalledTranslationsList,
  getBibleTranslation,
  setBibleTranslation,
} from './mmkv';

const BIBLES_DIR = `${FileSystem.documentDirectory}bibles/`;

export function getBibleFilePath(code: string): string {
  return `${BIBLES_DIR}${code}.json`;
}

/**
 * Ensures the persistent bibles directory exists
 */
async function ensureDirectoryExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(BIBLES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BIBLES_DIR, { intermediates: true });
  }
}

/**
 * Checks whether a translation is available offline
 */
export async function isBibleInstalled(code: string): Promise<boolean> {
  if (code === 'WEB' || code === 'KJV') {
    return true;
  }
  try {
    const info = await FileSystem.getInfoAsync(getBibleFilePath(code));
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Returns catalog items for all installed translations (preloaded + downloaded)
 */
export async function getInstalledBibles(): Promise<BibleCatalogItem[]> {
  const installedCodes = getInstalledTranslationsList();
  const result: BibleCatalogItem[] = [];

  for (const item of BIBLE_CATALOG) {
    if (item.isPreloaded) {
      result.push(item);
    } else if (installedCodes.includes(item.code)) {
      const exists = await isBibleInstalled(item.code);
      if (exists) {
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Downloads a translation JSON from the remote repository and saves it locally
 */
export async function downloadBible(
  item: BibleCatalogItem,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  if (item.isPreloaded) {
    return { success: true };
  }

  const downloadUrl = getCatalogItemDownloadUrl(item);
  if (!downloadUrl) {
    return { success: false, error: 'Invalid download URL' };
  }

  const tempFilePath = `${BIBLES_DIR}${item.code}_temp.json`;
  const finalFilePath = getBibleFilePath(item.code);

  try {
    await ensureDirectoryExists();

    // Remove any leftover temp file
    const tempInfo = await FileSystem.getInfoAsync(tempFilePath);
    if (tempInfo.exists) {
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      tempFilePath,
      {},
      (downloadProgress) => {
        if (
          onProgress &&
          downloadProgress.totalBytesExpectedToWrite > 0
        ) {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          onProgress(Math.min(Math.max(progress, 0), 1));
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      return { success: false, error: 'Download was interrupted or returned empty.' };
    }

    // Integrity check: verify the file is readable JSON and contains books
    const rawContent = await FileSystem.readAsStringAsync(tempFilePath);
    const fileContent = rawContent.replace(/^\uFEFF/, '');
    const parsed = JSON.parse(fileContent);

    const isValidFormat =
      (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].chapters)) ||
      (parsed && Array.isArray(parsed.books) && parsed.books.length > 0);

    if (!isValidFormat) {
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
      return {
        success: false,
        error: 'Downloaded file is not a valid Bible format.',
      };
    }

    // Move to final destination
    const existingFinal = await FileSystem.getInfoAsync(finalFilePath);
    if (existingFinal.exists) {
      await FileSystem.deleteAsync(finalFilePath, { idempotent: true });
    }
    await FileSystem.moveAsync({ from: tempFilePath, to: finalFilePath });

    // Update MMKV tracking
    const currentList = getInstalledTranslationsList();
    if (!currentList.includes(item.code)) {
      setInstalledTranslationsList([...currentList, item.code]);
    }

    if (onProgress) onProgress(1);
    return { success: true };
  } catch (err: any) {
    try {
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
    } catch {}
    return {
      success: false,
      error: err.message || 'Failed to download translation.',
    };
  }
}

/**
 * Deletes a downloaded translation from local storage
 */
export async function deleteBible(code: string): Promise<boolean> {
  if (code === 'WEB' || code === 'KJV') {
    return false; // Cannot delete preloaded Bibles
  }

  try {
    const filePath = getBibleFilePath(code);
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }

    // Remove from installed list in MMKV
    const currentList = getInstalledTranslationsList();
    setInstalledTranslationsList(currentList.filter((c) => c !== code));

    // If currently active, reset to WEB
    if (getBibleTranslation() === code) {
      setBibleTranslation('WEB');
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Reads local translation file and returns parsed BibleData
 */
export async function loadDownloadedBible(code: string): Promise<any | null> {
  try {
    const filePath = getBibleFilePath(code);
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) return null;

    const rawContent = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(rawContent.replace(/^\uFEFF/, ''));
  } catch (err) {
    console.warn(`[BibleDownloader] Failed to load downloaded bible ${code}:`, err);
    return null;
  }
}
