import { Share, Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import {
	getBookmarks,
	restoreBookmarks,
	getCollections,
	restoreCollections,
	getUserName,
	setUserName,
	getDailyGoalMinutes,
	setDailyGoalMinutes,
	getBlockedApps,
	setBlockedApps,
	getScheduledReadingTimes,
	setScheduledReadingTimes,
	exportReadingProgressMap,
	restoreReadingProgressMap,
	Bookmark,
	VerseCollection,
} from './mmkv';

export interface AppBackupData {
	version: 1;
	exportedAt: string;
	userName: string;
	dailyGoalMinutes: number;
	blockedApps: string[];
	scheduledTimes: string[];
	bookmarks: Bookmark[];
	collections: VerseCollection[];
	readingProgressMap: Record<string, number>;
}

export function getBackupTimestamp(): string {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
	return `${date}_${time}`;
}

export function exportBackupJSON(): string {
	const backup: AppBackupData = {
		version: 1,
		exportedAt: new Date().toISOString(),
		userName: getUserName(),
		dailyGoalMinutes: getDailyGoalMinutes(),
		blockedApps: getBlockedApps(),
		scheduledTimes: getScheduledReadingTimes(),
		bookmarks: getBookmarks(),
		collections: getCollections(),
		readingProgressMap: exportReadingProgressMap(),
	};
	return JSON.stringify(backup, null, 2);
}

export async function shareBackup(): Promise<boolean> {
	try {
		const json = exportBackupJSON();
		const timestamp = getBackupTimestamp();
		const result = await Share.share({
			title: `Bible Unlock Backup (${timestamp})`,
			message: json,
		});
		return result.action === Share.sharedAction;
	} catch (e) {
		console.warn('[Backup] Share failed:', e);
		return false;
	}
}

export async function downloadBackupFile(): Promise<{
	success: boolean;
	fileName?: string;
	cancelled?: boolean;
	error?: string;
}> {
	try {
		const json = exportBackupJSON();
		const timestamp = getBackupTimestamp();
		const baseName = `bible-unlock-backup-${timestamp}`;
		const fullName = `${baseName}.json`;

		if (Platform.OS === 'android') {
			const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (!permissions.granted) {
				return { success: false, cancelled: true };
			}

			const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
				permissions.directoryUri,
				baseName,
				'application/json',
			);

			await FileSystem.writeAsStringAsync(fileUri, json, {
				encoding: FileSystem.EncodingType.UTF8,
			});

			return { success: true, fileName: fullName };
		} else {
			// iOS / Web fallback: write file to document directory and share
			const fileUri = `${FileSystem.documentDirectory}${fullName}`;
			await FileSystem.writeAsStringAsync(fileUri, json, {
				encoding: FileSystem.EncodingType.UTF8,
			});
			const result = await Share.share({
				title: fullName,
				url: fileUri,
				message: json,
			});
			return { success: result.action === Share.sharedAction, fileName: fullName };
		}
	} catch (e: any) {
		console.warn('[Backup] Download error:', e);
		return { success: false, error: e?.message || 'Failed to save backup file' };
	}
}

export async function pickAndReadBackupFile(): Promise<{
	success: boolean;
	content?: string;
	fileName?: string;
	cancelled?: boolean;
	error?: string;
}> {
	try {
		const pickResult = await File.pickFileAsync({
			mimeTypes: ['application/json', 'text/*', '*/*'],
		});

		if (pickResult.canceled || !pickResult.result) {
			return { success: false, cancelled: true };
		}

		const pickedFile = pickResult.result;
		let jsonContent = '';

		if (typeof pickedFile.text === 'function') {
			jsonContent = await pickedFile.text();
		} else if (pickedFile.uri) {
			jsonContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
				encoding: FileSystem.EncodingType.UTF8,
			});
		}

		if (!jsonContent || !jsonContent.trim()) {
			return { success: false, error: 'The selected file is empty.' };
		}

		return {
			success: true,
			content: jsonContent.trim(),
			fileName: pickedFile.name || 'backup.json',
		};
	} catch (e: any) {
		console.warn('[Backup] Pick file error:', e);
		return { success: false, error: e?.message || 'Failed to open selected file.' };
	}
}

export function importBackupJSON(jsonString: string): {
	success: boolean;
	stats?: { bookmarks: number; collections: number; historyDays: number };
	error?: string;
} {
	try {
		const data = JSON.parse(jsonString);
		if (!data || typeof data !== 'object') {
			return { success: false, error: 'Invalid backup format: Not a JSON object.' };
		}
		if (data.version !== 1) {
			return {
				success: false,
				error: `Unsupported backup version: ${data.version}. Expected version 1.`,
			};
		}
		if (!Array.isArray(data.bookmarks) || !Array.isArray(data.collections)) {
			return {
				success: false,
				error: 'Corrupted backup file: Missing bookmarks or collections data.',
			};
		}

		if (typeof data.userName === 'string' && data.userName.trim().length > 0) {
			setUserName(data.userName.trim().slice(0, 30));
		}
		if (
			typeof data.dailyGoalMinutes === 'number' &&
			data.dailyGoalMinutes >= 1 &&
			data.dailyGoalMinutes <= 120
		) {
			setDailyGoalMinutes(data.dailyGoalMinutes);
		}
		if (Array.isArray(data.blockedApps)) {
			setBlockedApps(data.blockedApps);
		}
		if (Array.isArray(data.scheduledTimes)) {
			setScheduledReadingTimes(data.scheduledTimes);
		}

		restoreBookmarks(data.bookmarks);
		restoreCollections(data.collections);

		let historyDaysCount = 0;
		if (data.readingProgressMap && typeof data.readingProgressMap === 'object') {
			restoreReadingProgressMap(data.readingProgressMap);
			historyDaysCount = Object.keys(data.readingProgressMap).length;
		}

		return {
			success: true,
			stats: {
				bookmarks: data.bookmarks.length,
				collections: data.collections.length,
				historyDays: historyDaysCount,
			},
		};
	} catch (err: any) {
		return { success: false, error: `JSON Parse error: ${err.message || 'Invalid syntax'}` };
	}
}
