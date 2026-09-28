import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	ScrollView,
	Pressable,
	Switch,
	Alert,
	Modal,
	TextInput,
	ActivityIndicator,
	AppState,
	AppStateStatus,
	KeyboardAvoidingView,
	Keyboard,
	Platform,
	Linking,
	Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
	Crown,
	Shield,
	Clock,
	Smartphone,
	User,
	Check,
	Lock,
	Plus,
	Trash2,
	Search,
	Moon,
	Sun,
	X,
	RotateCcw,
	Minus,
	Sparkles,
	BarChart2,
	ChevronRight,
	Globe,
	Download,
	Pencil,
	BatteryCharging,
	DownloadCloud,
	RefreshCw,
	CreditCard,
	Share2,
	Star,
	MessageSquare,
	FileText,
	ShieldAlert,
} from 'lucide-react-native';
import { BibleTranslationModal } from '../../components/BibleTranslationModal';
import { BatteryOptimizationModal } from '../../components/settings/BatteryOptimizationModal';
import { DataBackupModal } from '../../components/settings/DataBackupModal';
import {
	getAvailableBackgroundCount,
	downloadSacredArtworkPack,
} from '../../lib/scrollImageCache';
import { usePurchases } from '../../lib/purchases';
import { useFeatureGate } from '../../lib/useFeatureGate';
import { AppBlocker, InstalledApp } from '../../lib/appBlocker';
import {
	getUserName,
	setUserName,
	getDailyGoalMinutes,
	setDailyGoalMinutes,
	getBlockedApps,
	setBlockedApps,
	DEFAULT_BLOCKED_APPS,
	setReadingProgress,
	ThemeMode,
	getScheduledReadingTimes,
	setScheduledReadingTimes,
	getDailyVerseNotificationsEnabled,
	setDailyVerseNotificationsEnabled,
	getDailyVerseNotificationCount,
	setDailyVerseNotificationCount,
} from '../../lib/mmkv';
import { useBibleTranslation } from '../../lib/bible';
import { ScriptureShield, calculateDaytimeHours } from '../../lib/scriptureShield';
import { AppIcon } from '../../components/AppIcon';
import { useTheme } from '../../lib/themeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TimePickerModal } from '../../components/TimePickerModal';

const GOAL_OPTIONS = [5, 10, 15, 30];

function formatSlotTime(h: number, m: number): string {
	const period = h >= 12 ? 'PM' : 'AM';
	const displayHour = h % 12 === 0 ? 12 : h % 12;
	const displayMin = m < 10 ? `0${m}` : `${m}`;
	return `${displayHour}:${displayMin} ${period}`;
}

export default function SettingsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { isPremium, toggleDevPremium, restorePurchases } = usePurchases();
	const { requirePremium } = useFeatureGate();
	const { themeMode, setThemeMode, colors, isDark } = useTheme();

	// Habit & Shield State
	const [dailyGoal, setDailyGoal] = useState(() => getDailyGoalMinutes());
	const [showCustomGoalInput, setShowCustomGoalInput] = useState(false);
	const [customGoalText, setCustomGoalText] = useState('');
	const [blockedList, setBlockedListState] = useState<string[]>(() => getBlockedApps());
	const [hasPermission, setHasPermission] = useState(false);
	const [showBatteryModal, setShowBatteryModal] = useState(false);
	const [showBackupModal, setShowBackupModal] = useState(false);
	const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);

	// Reading & Translations State
	const [translation, setTranslationState] = useBibleTranslation();
	const [showTranslationModal, setShowTranslationModal] = useState(false);
	const [artworkCount, setArtworkCount] = useState(() => getAvailableBackgroundCount());
	const [isDownloadingArtwork, setIsDownloadingArtwork] = useState(false);
	const [downloadProgress, setDownloadProgress] = useState({ downloaded: 0, total: 20 });

	// Reminders State
	const [verseNotifsEnabled, setVerseNotifsEnabled] = useState(() =>
		getDailyVerseNotificationsEnabled(),
	);
	const [verseNotifCount, setVerseNotifCount] = useState(() =>
		getDailyVerseNotificationCount(),
	);
	const [eveningReminder, setEveningReminder] = useState(true);
	const [scheduledTimes, setScheduledTimes] = useState<string[]>(() =>
		getScheduledReadingTimes(),
	);
	const [showTimePickerModal, setShowTimePickerModal] = useState(false);

	// Profile State
	const [userName, setUserNameState] = useState(() => getUserName());
	const [showEditNameModal, setShowEditNameModal] = useState(false);
	const [editNameText, setEditNameText] = useState('');
	const nameInputRef = useRef<TextInput>(null);
	const [isNameInputFocused, setIsNameInputFocused] = useState(false);

	// App Picker Modal State
	const [showAppPickerModal, setShowAppPickerModal] = useState(false);
	const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
	const [loadingApps, setLoadingApps] = useState(false);
	const [appSearchQuery, setAppSearchQuery] = useState('');

	const refreshPermissions = useCallback(async () => {
		const granted = await AppBlocker.hasPermissions();
		setHasPermission(granted);
		return granted;
	}, []);

	useEffect(() => {
		refreshPermissions();
		AppBlocker.getInstalledApps().then(setInstalledApps);

		const handleAppStateChange = (nextState: AppStateStatus) => {
			if (nextState === 'active') {
				refreshPermissions();
				setTimeout(refreshPermissions, 500);
			}
		};

		const sub = AppState.addEventListener('change', handleAppStateChange);
		return () => {
			sub.remove();
		};
	}, [refreshPermissions]);

	useFocusEffect(
		useCallback(() => {
			refreshPermissions();
			setUserNameState(getUserName());
			setDailyGoal(getDailyGoalMinutes());
			setBlockedListState(getBlockedApps());
			setScheduledTimes(getScheduledReadingTimes());
		}, [refreshPermissions]),
	);

	// Goal Handlers
	useEffect(() => {
		if (!isPremium && dailyGoal > 15) {
			setDailyGoal(15);
			setDailyGoalMinutes(15);
		}
	}, [isPremium, dailyGoal]);

	const handleSelectGoal = (minutes: number) => {
		if (minutes > 15 && !requirePremium('Extended reading goals')) {
			return;
		}
		setDailyGoal(minutes);
		setDailyGoalMinutes(minutes);
		setShowCustomGoalInput(false);
	};

	const handleCustomGoalPress = () => {
		if (!requirePremium('Custom reading goals')) {
			return;
		}
		setShowCustomGoalInput((prev) => !prev);
		setCustomGoalText(String(dailyGoal));
	};

	const handleSaveCustomGoal = () => {
		const mins = parseInt(customGoalText.trim(), 10);
		if (isNaN(mins) || mins < 1 || mins > 120) {
			Alert.alert(
				'Invalid Duration',
				'Please enter a reading duration between 1 and 120 minutes.',
			);
			return;
		}
		setDailyGoal(mins);
		setDailyGoalMinutes(mins);
		setShowCustomGoalInput(false);
	};

	// Blocked Apps Handlers
	const handleToggleApp = (pkgName: string) => {
		let next: string[];
		if (blockedList.includes(pkgName)) {
			next = blockedList.filter((p) => p !== pkgName);
		} else {
			next = [...blockedList, pkgName];
		}
		setBlockedListState(next);
		setBlockedApps(next);
		AppBlocker.shieldApps(next);
	};

	const handleResetDefaultApps = () => {
		Alert.alert(
			'Reset Default Apps',
			'Restore the default 5 distraction apps (Instagram, TikTok, YouTube, X, Reddit)?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset to Defaults',
					onPress: () => {
						setBlockedListState(DEFAULT_BLOCKED_APPS);
						setBlockedApps(DEFAULT_BLOCKED_APPS);
						AppBlocker.shieldApps(DEFAULT_BLOCKED_APPS);
						Alert.alert('Reset Complete', 'Default 5 shielded apps restored.');
					},
				},
			],
		);
	};

	const handleCustomApps = async () => {
		if (!isPremium) {
			Alert.alert(
				'Custom App Selection',
				'Custom app selection requires Premium. Free plan includes the 5 default distraction apps.\n\nWould you like to restore the default 5 apps or upgrade to Premium?',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Reset Defaults',
						onPress: () => {
							setBlockedListState(DEFAULT_BLOCKED_APPS);
							setBlockedApps(DEFAULT_BLOCKED_APPS);
							AppBlocker.shieldApps(DEFAULT_BLOCKED_APPS);
							Alert.alert('Reset Complete', 'Default 5 shielded apps restored.');
						},
					},
					{
						text: 'Upgrade',
						onPress: () => router.push('/paywall' as any),
					},
				],
			);
			return;
		}
		setShowAppPickerModal(true);
		setLoadingApps(true);
		try {
			const list = await AppBlocker.getInstalledApps();
			if (list && list.length > 0) {
				setInstalledApps(list);
			}
		} catch {
			// fallback
		} finally {
			setLoadingApps(false);
		}
	};

	const handleRequestPermissions = async () => {
		await AppBlocker.requestPermissions();
	};

	const handleCheckPermission = async () => {
		const granted = await refreshPermissions();
		if (granted) {
			Alert.alert(
				'Shield Active',
				'Accessibility Shield permission is active. Your distracting apps are protected.',
			);
		} else {
			Alert.alert(
				'Permission Needed',
				'Accessibility Shield permission is not granted. Tap "Open Settings" to enable Bible Unlock in system settings.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{ text: 'Open Settings', onPress: handleRequestPermissions },
				],
			);
		}
	};

	// Artwork Download
	const handleDownloadArtwork = async () => {
		if (!requirePremium('Sacred Artwork Expansion (20 HD)')) {
			return;
		}
		setIsDownloadingArtwork(true);
		const result = await downloadSacredArtworkPack((downloaded, total) => {
			setDownloadProgress({ downloaded, total });
		});
		setIsDownloadingArtwork(false);
		setArtworkCount(result.totalAvailable);
	};

	// Reminders Handlers
	const handleAddReminderTime = (time: string) => {
		if (scheduledTimes.includes(time)) {
			return;
		}
		const updated = [...scheduledTimes, time];
		setScheduledTimes(updated);
		setScheduledReadingTimes(updated);
	};

	const handleOpenTimePicker = () => {
		if (!isPremium && scheduledTimes.length >= 1) {
			if (!requirePremium('Multiple daily reminders')) {
				return;
			}
		}
		setShowTimePickerModal(true);
	};

	const handleRemoveReminderTime = (timeToRemove: string) => {
		const updated = scheduledTimes.filter((t) => t !== timeToRemove);
		setScheduledTimes(updated);
		setScheduledReadingTimes(updated);
	};

	const handleToggleVerseNotifications = async (val: boolean) => {
		setVerseNotifsEnabled(val);
		setDailyVerseNotificationsEnabled(val);
		if (val) {
			const success = await ScriptureShield.scheduleDailyVerseNotifications(
				verseNotifCount,
				translation,
			);
			if (!success) {
				Alert.alert(
					'Permission Needed',
					'Please enable notifications so Bible Unlock can deliver your daily devotional verses.',
				);
			}
		} else {
			await ScriptureShield.cancelDailyVerseNotifications();
		}
	};

	const handleUpdateVerseNotifCount = async (count: number) => {
		if (count > 6 && !isPremium) {
			if (!requirePremium('Receive up to 24 daily verses')) {
				return;
			}
		}
		const clamped = Math.max(1, Math.min(count, 24));
		setVerseNotifCount(clamped);
		setDailyVerseNotificationCount(clamped);
		if (verseNotifsEnabled) {
			await ScriptureShield.scheduleDailyVerseNotifications(clamped, translation);
		}
	};

	const handleSelectTranslation = async (tr: string) => {
		setTranslationState(tr);
		if (verseNotifsEnabled) {
			await ScriptureShield.scheduleDailyVerseNotifications(verseNotifCount, tr);
		}
	};

	// Name Profile Handlers
	const handleOpenEditName = () => {
		setEditNameText(userName);
		setShowEditNameModal(true);
	};

	const handleSaveName = () => {
		const trimmed = editNameText.trim();
		const finalName = trimmed.length > 0 ? trimmed.slice(0, 30) : 'Disciple';
		setUserName(finalName);
		setUserNameState(finalName);
		setShowEditNameModal(false);
	};

	// Account & Compliance Handlers
	const handleRestorePurchases = async () => {
		setIsRestoringPurchases(true);
		try {
			const success = await restorePurchases();
			if (success) {
				Alert.alert(
					'Sanctuary Restored',
					'Your Sanctuary membership is active! All disciplines and translations are unlocked.',
				);
			} else {
				Alert.alert(
					'Restore Complete',
					'No active Sanctuary subscription was found for this app store account.',
				);
			}
		} catch (e: any) {
			Alert.alert('Restore Failed', e?.message || 'Unable to restore purchases at this time.');
		} finally {
			setIsRestoringPurchases(false);
		}
	};

	const handleManageSubscription = () => {
		const url =
			Platform.OS === 'android'
				? 'https://play.google.com/store/account/subscriptions?package=com.bibleunlock.app'
				: 'https://apps.apple.com/account/subscriptions';
		Linking.openURL(url).catch(() => {
			Alert.alert('Error', 'Unable to open store subscription page.');
		});
	};

	const handleShareApp = async () => {
		try {
			await Share.share({
				title: 'Bible Unlock: Guard Your Peace',
				message:
					'Reclaim your screen time and draw closer to God every day with Bible Unlock: https://bibleunlock.app',
			});
		} catch (e) {
			console.warn('[Share] App share error:', e);
		}
	};

	const handleRateApp = () => {
		const url =
			Platform.OS === 'android'
				? 'market://details?id=com.bibleunlock.app'
				: 'https://apps.apple.com/app/id6470000000';
		Linking.openURL(url).catch(() => {
			Linking.openURL('https://bibleunlock.app');
		});
	};

	const handleContactSupport = () => {
		Linking.openURL('mailto:support@bibleunlock.app?subject=Bible%20Unlock%20Support%20%26%20Feedback');
	};

	const handleOpenPrivacy = () => {
		Linking.openURL('https://bibleunlock.app/privacy');
	};

	const handleOpenTerms = () => {
		Linking.openURL('https://bibleunlock.app/terms');
	};

	const handleToggleSimulatePlan = () => {
		const nextWillBeFree = isPremium;
		toggleDevPremium();
		Alert.alert(
			'Developer Simulation',
			nextWillBeFree
				? 'Switched to Free Tier. Free limits and upgrade triggers are now active.'
				: 'Switched to Pro Tier (Sanctuary Member). All features unlocked.',
		);
	};

	const handleResetProgress = () => {
		setReadingProgress(0);
		AppBlocker.shieldApps();
		Alert.alert('Reset Complete', "Today's reading progress has been reset to 00:00.");
	};

	const KNOWN_LABELS: Record<string, string> = {
		'com.instagram.android': 'Instagram',
		'com.zhiliaoapp.musically': 'TikTok',
		'com.google.android.youtube': 'YouTube',
		'com.twitter.android': 'X (Twitter)',
		'com.reddit.frontpage': 'Reddit',
		'com.facebook.katana': 'Facebook',
		'com.snapchat.android': 'Snapchat',
		'com.netflix.mediaclient': 'Netflix',
		'com.discord': 'Discord',
		'com.whatsapp': 'WhatsApp',
	};

	const getAppInfo = (pkg: string): { label: string; icon?: string } => {
		const found = installedApps.find((a) => a.packageName === pkg);
		if (found) return { label: found.label, icon: found.icon };
		if (KNOWN_LABELS[pkg]) return { label: KNOWN_LABELS[pkg] };
		const parts = pkg.split('.');
		const fallbackName = parts[parts.length - 1] || pkg;
		return {
			label: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
		};
	};

	// Industrial Section Header Component
	const SectionHeader = ({ index, title }: { index: string; title: string }) => (
		<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
			<View
				style={{
					backgroundColor: colors.accentBg,
					paddingHorizontal: 6,
					paddingVertical: 2,
					borderRadius: 4,
					marginRight: 8,
					borderWidth: 1,
					borderColor: colors.accent,
				}}
			>
				<Text
					style={{
						fontSize: 10,
						fontFamily: 'Inter_700Bold',
						color: colors.accent,
						letterSpacing: 0.5,
					}}
				>
					{index}
				</Text>
			</View>
			<Text
				style={{
					fontSize: 11,
					fontFamily: 'Inter_700Bold',
					letterSpacing: 1.2,
					textTransform: 'uppercase',
					color: colors.textSecondary,
				}}
			>
				{title}
			</Text>
		</View>
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
			<ScrollView
				style={{ flex: 1 }}
				className='px-5'
				contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
			>
				{/* Screen Title */}
				<View style={{ paddingTop: 16, paddingBottom: 8 }}>
					<Text
						style={{
							fontSize: 11,
							fontFamily: 'Inter_700Bold',
							letterSpacing: 1.5,
							textTransform: 'uppercase',
							color: colors.accent,
							marginBottom: 2,
						}}
					>
						[ SYSTEM CONTROLS ]
					</Text>
					<Text
						style={{
							fontSize: 26,
							fontFamily: 'EBGaramond_700Bold',
							color: colors.textPrimary,
						}}
					>
						Settings & Discipline
					</Text>
				</View>

				{/* ============================================================== */}
				{/* CLUSTER 01: SPIRITUAL HABIT & SHIELD */}
				{/* ============================================================== */}
				<SectionHeader index='01' title='Spiritual Habit & Shield' />

				{/* Premium Sanctuary Banner */}
				<Card
					variant='dark'
					style={{
						padding: 16,
						marginBottom: 14,
						borderColor: colors.accent,
						backgroundColor: colors.accentBg,
					}}
				>
					<View className='flex-row items-center justify-between'>
						<View className='flex-row items-center flex-1 mr-3'>
							<View style={{ marginRight: 12 }}>
								<Crown size={26} color={colors.accent} />
							</View>
							<View style={{ flex: 1 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
									<Text
										style={{
											fontSize: 15,
											fontFamily: 'Inter_700Bold',
											color: colors.textPrimary,
										}}
									>
										{isPremium ? 'Sanctuary Member' : 'Enter the Sanctuary'}
									</Text>
									<Text
										style={{
											fontSize: 9,
											fontFamily: 'Inter_700Bold',
											color: colors.accent,
											letterSpacing: 0.5,
										}}
									>
										{isPremium ? '[ ACTIVE ]' : '[ COVENANT ]'}
									</Text>
								</View>
								<Text
									style={{
										fontSize: 12,
										fontFamily: 'Inter_500Medium',
										color: colors.accent,
										marginTop: 2,
									}}
								>
									{isPremium
										? 'All Spiritual Disciplines Unlocked'
										: 'Custom Apps, Protection & All Translations'}
								</Text>
							</View>
						</View>
						{!isPremium && (
							<Button
								title='Upgrade'
								variant='primary'
								size='sm'
								onPress={() => router.push('/paywall' as any)}
							/>
						)}
					</View>
				</Card>

				{/* My Stats Navigation Card */}
				<Card
					variant='dark'
					style={{
						padding: 14,
						marginBottom: 14,
						borderColor: colors.border,
						backgroundColor: colors.surface,
					}}
				>
					<Pressable
						onPress={() => router.push('/stats-detail' as any)}
						accessibilityRole='button'
						accessibilityLabel='Open My Stats and Badges'
						style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							<View
								style={{
									width: 40,
									height: 40,
									borderRadius: 10,
									backgroundColor: 'rgba(245, 184, 0, 0.12)',
									alignItems: 'center',
									justifyContent: 'center',
									borderWidth: 1,
									borderColor: 'rgba(245, 184, 0, 0.3)',
								}}
							>
								<BarChart2 size={20} color={colors.accent} />
							</View>
							<View>
								<Text
									style={{
										fontSize: 14,
										fontFamily: 'Inter_700Bold',
										color: colors.textPrimary,
									}}
								>
									My Stats & Badges
								</Text>
								<Text
									style={{
										fontSize: 12,
										fontFamily: 'Inter_400Regular',
										color: colors.textSecondary,
										marginTop: 2,
									}}
								>
									Streaks, milestones & lifetime impact
								</Text>
							</View>
						</View>
						<ChevronRight size={18} color={colors.textSecondary} />
					</Pressable>
				</Card>

				{/* System Permission Guard Status with Battery Guard */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between mb-3'>
						<View style={{ flex: 1, marginRight: 12 }}>
							<Text
								style={{
									fontSize: 14,
									fontFamily: 'Inter_700Bold',
									color: colors.textPrimary,
								}}
							>
								Shield Protection Permission
							</Text>
							<Text
								style={{
									fontSize: 12,
									color: colors.textSecondary,
									marginTop: 2,
								}}
							>
								{hasPermission
									? 'Active & guarding distraction apps'
									: 'Requires device permission to block apps'}
							</Text>
						</View>
						<View className='flex-row items-center'>
							<View
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: hasPermission ? colors.success : '#f59e0b',
									marginRight: 6,
								}}
							/>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_600SemiBold',
									color: hasPermission ? colors.success : '#f59e0b',
								}}
							>
								{hasPermission ? 'Active' : 'Disabled'}
							</Text>
						</View>
					</View>

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
						<Button
							title={hasPermission ? 'Manage in Settings' : 'Grant Blocker Permission'}
							variant={hasPermission ? 'outline' : 'primary'}
							size='sm'
							onPress={handleRequestPermissions}
							style={{ flex: 1 }}
						/>
						<Button title='Verify' variant='ghost' size='sm' onPress={handleCheckPermission} />
						{Platform.OS === 'android' && (
							<Pressable
								onPress={() => setShowBatteryModal(true)}
								hitSlop={8}
								accessibilityRole='button'
								accessibilityLabel='Keep Shield Active Battery Settings'
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: colors.surfaceSubtle,
									borderWidth: 1,
									borderColor: colors.borderSubtle,
									paddingHorizontal: 10,
									height: 36,
									borderRadius: 8,
									gap: 4,
								}}
							>
								<BatteryCharging size={14} color={colors.accent} />
								<Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
									Battery
								</Text>
							</Pressable>
						)}
					</View>
				</Card>

				{/* Daily Scripture Goal */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<Text
						style={{
							fontSize: 14,
							fontFamily: 'Inter_700Bold',
							color: colors.textPrimary,
							marginBottom: 4,
						}}
					>
						Daily Scripture Goal
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: colors.textSecondary,
							marginBottom: 12,
						}}
					>
						Minutes of reading to unlock your apps each day
					</Text>

					<View className='flex-row justify-between'>
						{GOAL_OPTIONS.map((mins) => {
							const isSelected = dailyGoal === mins;
							const isLocked = !isPremium && mins > 15;
							return (
								<Pressable
									key={mins}
									onPress={() => handleSelectGoal(mins)}
									accessibilityRole='button'
									accessibilityLabel={`${mins} minutes goal`}
									style={{
										flex: 1,
										marginHorizontal: 2,
										paddingVertical: 10,
										borderRadius: 10,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: isSelected ? colors.accent : colors.border,
										backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
									}}
								>
									<View className='flex-row items-center justify-center'>
										<Text
											style={{
												fontSize: 13,
												fontFamily: 'Inter_700Bold',
												color: isSelected ? '#141413' : colors.textPrimary,
											}}
										>
											{mins}m
										</Text>
										{isLocked && (
											<Lock size={10} color={colors.textMuted} style={{ marginLeft: 3 }} />
										)}
									</View>
								</Pressable>
							);
						})}

						{/* Custom Goal */}
						{(() => {
							const isCustomSelected = !GOAL_OPTIONS.includes(dailyGoal);
							return (
								<Pressable
									onPress={handleCustomGoalPress}
									accessibilityRole='button'
									accessibilityLabel='Custom goal duration'
									style={{
										flex: 1.2,
										marginHorizontal: 2,
										paddingVertical: 10,
										borderRadius: 10,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: isCustomSelected
											? colors.accent
											: showCustomGoalInput
												? colors.accent
												: colors.border,
										backgroundColor: isCustomSelected ? colors.accent : colors.surfaceSubtle,
									}}
								>
									<View className='flex-row items-center justify-center'>
										<Text
											style={{
												fontSize: 12,
												fontFamily: 'Inter_700Bold',
												color: isCustomSelected ? '#141413' : colors.textPrimary,
											}}
											numberOfLines={1}
										>
											{isCustomSelected ? `${dailyGoal}m` : 'Custom'}
										</Text>
										{!isPremium && (
											<Lock size={10} color={colors.textMuted} style={{ marginLeft: 3 }} />
										)}
									</View>
								</Pressable>
							);
						})()}
					</View>

					{/* Inline Custom Goal Input */}
					{showCustomGoalInput && (
						<View
							style={{
								marginTop: 12,
								paddingTop: 12,
								borderTopWidth: 1,
								borderTopColor: colors.border,
							}}
						>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_500Medium',
									color: colors.textSecondary,
									marginBottom: 8,
								}}
							>
								Enter custom duration (1–120 minutes):
							</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<TextInput
									style={{
										flex: 1,
										height: 40,
										backgroundColor: colors.surfaceSubtle,
										borderWidth: 1,
										borderColor: colors.border,
										borderRadius: 8,
										paddingHorizontal: 12,
										color: colors.textPrimary,
										fontSize: 14,
										fontFamily: 'Inter_600SemiBold',
									}}
									placeholder='Minutes (e.g. 45)'
									placeholderTextColor={colors.textMuted}
									keyboardType='number-pad'
									value={customGoalText}
									onChangeText={setCustomGoalText}
									maxLength={3}
									autoFocus
								/>
								<Pressable
									onPress={handleSaveCustomGoal}
									style={{
										marginLeft: 8,
										backgroundColor: colors.accent,
										paddingHorizontal: 14,
										height: 40,
										borderRadius: 8,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text
										style={{
											fontSize: 13,
											fontFamily: 'Inter_700Bold',
											color: '#141413',
										}}
									>
										Set
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setShowCustomGoalInput(false)}
									style={{
										marginLeft: 6,
										padding: 8,
										borderRadius: 8,
										borderWidth: 1,
										borderColor: colors.border,
									}}
								>
									<X size={16} color={colors.textSecondary} />
								</Pressable>
							</View>
						</View>
					)}
				</Card>

				{/* Shielded Applications */}
				<View className='mb-2'>
					<View className='flex-row items-center justify-between mb-2.5 px-1'>
						<Text
							style={{
								fontSize: 12,
								fontFamily: 'Inter_700Bold',
								color: colors.textPrimary,
							}}
						>
							Shielded Apps ({blockedList.length}
							{!isPremium ? '/5' : ''})
						</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							{!isPremium && (
								<Pressable
									onPress={handleResetDefaultApps}
									accessibilityRole='button'
									accessibilityLabel='Reset default apps'
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										backgroundColor: colors.surfaceSubtle,
										paddingHorizontal: 10,
										paddingVertical: 6,
										borderRadius: 8,
										borderWidth: 1,
										borderColor: colors.borderSubtle,
										marginRight: 8,
									}}
								>
									<RotateCcw size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
									<Text
										style={{
											fontSize: 12,
											color: colors.textSecondary,
											fontFamily: 'Inter_600SemiBold',
										}}
									>
										Reset
									</Text>
								</Pressable>
							)}
							<Pressable
								onPress={handleCustomApps}
								accessibilityRole='button'
								accessibilityLabel='Add apps to shield'
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: colors.accentBg,
									paddingHorizontal: 10,
									paddingVertical: 6,
									borderRadius: 8,
								}}
							>
								<Plus size={13} color={colors.accent} style={{ marginRight: 4 }} />
								<Text
									style={{
										fontSize: 12,
										color: colors.accent,
										fontFamily: 'Inter_600SemiBold',
									}}
								>
									Add Apps
								</Text>
							</Pressable>
						</View>
					</View>

					<Card variant='dark' style={{ padding: 8, marginBottom: 14 }}>
						{blockedList.length === 0 ? (
							<View className='items-center py-6 px-4'>
								<View
									style={{
										width: 48,
										height: 48,
										borderRadius: 24,
										backgroundColor: colors.accentBg,
										alignItems: 'center',
										justifyContent: 'center',
										marginBottom: 8,
									}}
								>
									<Shield size={24} color={colors.accent} />
								</View>
								<Text
									style={{
										fontSize: 14,
										fontFamily: 'Inter_700Bold',
										color: colors.textPrimary,
										marginBottom: 4,
									}}
								>
									No Apps Shielded
								</Text>
								<Text
									style={{
										fontSize: 12,
										color: colors.textSecondary,
										textAlign: 'center',
										marginBottom: 14,
										lineHeight: 18,
									}}
								>
									Shield distracting apps like social media or games so they stay locked until your
									Bible goal is met.
								</Text>
								<Pressable
									onPress={isPremium ? handleCustomApps : handleResetDefaultApps}
									style={{
										paddingHorizontal: 16,
										paddingVertical: 10,
										borderRadius: 12,
										backgroundColor: colors.accent,
										flexDirection: 'row',
										alignItems: 'center',
									}}
								>
									{isPremium ? (
										<>
											<Plus size={14} color='#141413' style={{ marginRight: 6 }} />
											<Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
												Select Apps to Shield
											</Text>
										</>
									) : (
										<>
											<RotateCcw size={14} color='#141413' style={{ marginRight: 6 }} />
											<Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
												Restore 5 Default Apps
											</Text>
										</>
									)}
								</Pressable>
							</View>
						) : (
							blockedList.map((pkg, idx) => {
								const info = getAppInfo(pkg);
								const isInstalled =
									installedApps.length === 0 || installedApps.some((a) => a.packageName === pkg);
								return (
									<View
										key={pkg}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: 12,
											borderTopWidth: idx !== 0 ? 1 : 0,
											borderTopColor: colors.borderSubtle,
											opacity: isInstalled ? 1 : 0.55,
										}}
									>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												flex: 1,
												marginRight: 12,
											}}
										>
											<View style={{ marginRight: 12 }}>
												<AppIcon
													packageName={pkg}
													label={info.label}
													iconUri={info.icon}
													size={36}
													borderRadius={8}
												/>
											</View>
											<View style={{ flex: 1 }}>
												<View
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														flexWrap: 'wrap',
													}}
												>
													<Text
														style={{
															fontSize: 14,
															fontFamily: 'Inter_500Medium',
															color: colors.textPrimary,
															marginRight: 6,
														}}
														numberOfLines={1}
													>
														{info.label}
													</Text>
													{!isInstalled && (
														<View
															style={{
																backgroundColor: colors.surfaceSubtle,
																paddingHorizontal: 6,
																paddingVertical: 1.5,
																borderRadius: 6,
																borderWidth: 1,
																borderColor: colors.borderSubtle,
															}}
														>
															<Text
																style={{
																	fontSize: 10,
																	fontFamily: 'Inter_600SemiBold',
																	color: colors.textMuted,
																}}
															>
																Not installed
															</Text>
														</View>
													)}
												</View>
												<Text
													style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}
													numberOfLines={1}
												>
													{pkg}
												</Text>
											</View>
										</View>

										<Pressable
											onPress={() => handleToggleApp(pkg)}
											style={{
												padding: 8,
												borderRadius: 8,
												backgroundColor: colors.surfaceSubtle,
											}}
											hitSlop={8}
											accessibilityRole='button'
											accessibilityLabel={`Remove ${info.label} from shield`}
										>
											<Trash2 size={16} color={colors.danger} />
										</Pressable>
									</View>
								);
							})
						)}
					</Card>
				</View>

				{/* ============================================================== */}
				{/* CLUSTER 02: READING & MEDIA ASSETS */}
				{/* ============================================================== */}
				<SectionHeader index='02' title='Reading & Media Assets' />

				{/* Appearance & Theme */}
				<Card variant='dark' style={{ padding: 14, marginBottom: 14 }}>
					<Text
						style={{
							fontSize: 13,
							fontFamily: 'Inter_700Bold',
							color: colors.textPrimary,
							marginBottom: 10,
						}}
					>
						Atmosphere & Theme
					</Text>
					<View className='flex-row justify-between'>
						<Pressable
							onPress={() => setThemeMode('dark')}
							accessibilityRole='button'
							accessibilityLabel='Celestial Dark Theme'
							style={{
								flex: 1,
								marginRight: 6,
								padding: 12,
								borderRadius: 12,
								borderWidth: 1,
								alignItems: 'center',
								backgroundColor: themeMode === 'dark' ? colors.accentBg : colors.surfaceSubtle,
								borderColor: themeMode === 'dark' ? colors.accent : colors.border,
							}}
						>
							<Moon
								size={20}
								color={themeMode === 'dark' ? colors.accent : colors.textSecondary}
								style={{ marginBottom: 6 }}
							/>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_700Bold',
									color: themeMode === 'dark' ? colors.accent : colors.textPrimary,
								}}
							>
								Dark
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
								Celestial
							</Text>
						</Pressable>

						<Pressable
							onPress={() => setThemeMode('light')}
							accessibilityRole='button'
							accessibilityLabel='Parchment Light Theme'
							style={{
								flex: 1,
								marginHorizontal: 6,
								padding: 12,
								borderRadius: 12,
								borderWidth: 1,
								alignItems: 'center',
								backgroundColor: themeMode === 'light' ? colors.accentBg : colors.surfaceSubtle,
								borderColor: themeMode === 'light' ? colors.accent : colors.border,
							}}
						>
							<Sun
								size={20}
								color={themeMode === 'light' ? colors.accent : colors.textSecondary}
								style={{ marginBottom: 6 }}
							/>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_700Bold',
									color: themeMode === 'light' ? colors.accent : colors.textPrimary,
								}}
							>
								Light
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
								Parchment
							</Text>
						</Pressable>

						<Pressable
							onPress={() => setThemeMode('system')}
							accessibilityRole='button'
							accessibilityLabel='System Auto Theme'
							style={{
								flex: 1,
								marginLeft: 6,
								padding: 12,
								borderRadius: 12,
								borderWidth: 1,
								alignItems: 'center',
								backgroundColor: themeMode === 'system' ? colors.accentBg : colors.surfaceSubtle,
								borderColor: themeMode === 'system' ? colors.accent : colors.border,
							}}
						>
							<Smartphone
								size={20}
								color={themeMode === 'system' ? colors.accent : colors.textSecondary}
								style={{ marginBottom: 6 }}
							/>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_700Bold',
									color: themeMode === 'system' ? colors.accent : colors.textPrimary,
								}}
							>
								System
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
								Auto
							</Text>
						</Pressable>
					</View>
				</Card>

				{/* Bible Translations & Languages */}
				<Card variant='dark' style={{ padding: 14, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between mb-3'>
						<Text
							style={{
								fontSize: 13,
								fontFamily: 'Inter_700Bold',
								color: colors.textPrimary,
							}}
						>
							Bible Translations
						</Text>
						<Pressable
							onPress={() => setShowTranslationModal(true)}
							hitSlop={8}
							accessibilityRole='button'
							accessibilityLabel='Browse and download translations'
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: colors.accentBg,
								paddingHorizontal: 8,
								paddingVertical: 4,
								borderRadius: 6,
								gap: 4,
							}}
						>
							<Globe size={12} color={colors.accent} />
							<Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Inter_700Bold' }}>
								Browse All (50+)
							</Text>
						</Pressable>
					</View>

					<View className='flex-row justify-between mb-3'>
						<Pressable
							onPress={() => handleSelectTranslation('WEB')}
							accessibilityRole='button'
							accessibilityLabel='Select World English Bible'
							style={{
								flex: 1,
								marginRight: 6,
								padding: 12,
								borderRadius: 10,
								borderWidth: 1,
								alignItems: 'center',
								backgroundColor: translation === 'WEB' ? colors.accentBg : colors.surfaceSubtle,
								borderColor: translation === 'WEB' ? colors.accent : colors.border,
							}}
						>
							<Text
								style={{
									fontSize: 14,
									fontFamily: 'Inter_700Bold',
									color: colors.textPrimary,
									marginBottom: 2,
								}}
							>
								WEB
							</Text>
							<Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
								World English Bible
							</Text>
						</Pressable>

						<Pressable
							onPress={() => handleSelectTranslation('KJV')}
							accessibilityRole='button'
							accessibilityLabel='Select King James Version'
							style={{
								flex: 1,
								marginLeft: 6,
								padding: 12,
								borderRadius: 10,
								borderWidth: 1,
								alignItems: 'center',
								backgroundColor: translation === 'KJV' ? colors.accentBg : colors.surfaceSubtle,
								borderColor: translation === 'KJV' ? colors.accent : colors.border,
							}}
						>
							<Text
								style={{
									fontSize: 14,
									fontFamily: 'Inter_700Bold',
									color: colors.textPrimary,
									marginBottom: 2,
								}}
							>
								KJV
							</Text>
							<Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
								King James Version
							</Text>
						</Pressable>
					</View>

					{translation !== 'WEB' && translation !== 'KJV' && (
						<View
							style={{
								padding: 10,
								borderRadius: 10,
								backgroundColor: colors.accentBg,
								borderWidth: 1,
								borderColor: colors.accent,
								marginBottom: 6,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<View className='flex-row items-center'>
								<Globe size={14} color={colors.accent} style={{ marginRight: 6 }} />
								<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>
									Active: {translation}
								</Text>
							</View>
							<Text style={{ fontSize: 11, color: colors.textSecondary }}>Downloaded</Text>
						</View>
					)}
				</Card>

				{/* Bible Scroll Sacred Artwork */}
				<Card variant='dark' style={{ padding: 14, marginBottom: 14 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
						<View
							style={{
								width: 40,
								height: 40,
								borderRadius: 10,
								backgroundColor: colors.accentBg,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: 12,
								borderWidth: 1,
								borderColor: colors.accent,
							}}
						>
							<Sparkles size={20} color={colors.accent} />
						</View>
						<View style={{ flex: 1 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
								<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
									Sacred Artwork Pack
								</Text>
								<Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent }}>
									[{artworkCount}/30]
								</Text>
							</View>
							<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
								{artworkCount >= 30
									? 'All 30 sacred backgrounds active in Bible Scroll.'
									: isPremium
										? '10 bundled offline. Download 20 additional HD biblical backgrounds.'
										: '10 bundled offline. Sanctuary members unlock 20 additional HD backgrounds.'}
							</Text>
						</View>
					</View>

					{artworkCount < 30 && (
						<Pressable
							onPress={handleDownloadArtwork}
							disabled={isDownloadingArtwork}
							accessibilityRole='button'
							accessibilityLabel='Download HD Backgrounds'
							style={{
								width: '100%',
								paddingVertical: 12,
								borderRadius: 10,
								backgroundColor: colors.accent,
								alignItems: 'center',
								flexDirection: 'row',
								justifyContent: 'center',
								opacity: isDownloadingArtwork ? 0.7 : 1,
							}}
						>
							{isDownloadingArtwork ? (
								<>
									<ActivityIndicator size='small' color='#141413' style={{ marginRight: 8 }} />
									<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#141413' }}>
										Downloading ({downloadProgress.downloaded}/{downloadProgress.total})...
									</Text>
								</>
							) : !isPremium ? (
								<>
									<Lock size={15} color='#141413' style={{ marginRight: 6 }} />
									<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#141413' }}>
										Unlock 20 HD Backgrounds (Sanctuary)
									</Text>
								</>
							) : (
								<>
									<Download size={15} color='#141413' style={{ marginRight: 6 }} />
									<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#141413' }}>
										Download 20 HD Backgrounds
									</Text>
								</>
							)}
						</Pressable>
					)}
				</Card>

				{/* ============================================================== */}
				{/* CLUSTER 03: REMINDERS & QUIET HOURS */}
				{/* ============================================================== */}
				<SectionHeader index='03' title='Reminders & Quiet Hours' />

				{/* Daily Reading Reminders */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between mb-2'>
						<View>
							<Text
								style={{
									fontSize: 14,
									fontFamily: 'Inter_700Bold',
									color: colors.textPrimary,
								}}
							>
								Daily Reading Reminders
							</Text>
							<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
								Notifications to keep your habit consistent
							</Text>
						</View>
						<Pressable
							onPress={handleOpenTimePicker}
							hitSlop={8}
							accessibilityRole='button'
							accessibilityLabel='Add reminder time'
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: colors.accentBg,
								paddingHorizontal: 10,
								paddingVertical: 6,
								borderRadius: 8,
								gap: 4,
							}}
						>
							{!isPremium && scheduledTimes.length >= 1 ? (
								<Lock size={12} color={colors.accent} />
							) : (
								<Plus size={13} color={colors.accent} />
							)}
							<Text
								style={{
									fontSize: 12,
									color: colors.accent,
									fontFamily: 'Inter_600SemiBold',
								}}
							>
								Add Time
							</Text>
						</Pressable>
					</View>

					{scheduledTimes.length === 0 ? (
						<View
							style={{
								padding: 12,
								borderRadius: 12,
								backgroundColor: colors.surfaceSubtle,
								alignItems: 'center',
								marginTop: 8,
							}}
						>
							<Text style={{ fontSize: 12, color: colors.textSecondary }}>
								No reminder times set. Tap "+ Add Time" above.
							</Text>
						</View>
					) : (
						<View style={{ marginTop: 8 }}>
							{scheduledTimes.map((timeStr) => (
								<View
									key={timeStr}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										paddingHorizontal: 12,
										paddingVertical: 10,
										borderRadius: 10,
										backgroundColor: colors.surfaceSubtle,
										borderWidth: 1,
										borderColor: colors.borderSubtle,
										marginBottom: 6,
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<View
											style={{
												width: 26,
												height: 26,
												borderRadius: 13,
												backgroundColor: colors.accentBg,
												alignItems: 'center',
												justifyContent: 'center',
												marginRight: 10,
											}}
										>
											<Clock size={13} color={colors.accent} />
										</View>
										<Text
											style={{
												fontSize: 14,
												fontFamily: 'Inter_600SemiBold',
												color: colors.textPrimary,
											}}
										>
											{timeStr}
										</Text>
									</View>

									<Pressable
										onPress={() => handleRemoveReminderTime(timeStr)}
										hitSlop={10}
										accessibilityRole='button'
										accessibilityLabel={`Delete reminder ${timeStr}`}
										style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: colors.dangerBg,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Trash2 size={13} color={colors.danger} />
									</Pressable>
								</View>
							))}
						</View>
					)}

					{!isPremium && scheduledTimes.length >= 1 && (
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								marginTop: 8,
								paddingHorizontal: 2,
							}}
						>
							<Lock size={11} color={colors.accent} style={{ marginRight: 4 }} />
							<Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Inter_500Medium' }}>
								Sanctuary unlocks unlimited custom reminder times.
							</Text>
						</View>
					)}

					{/* Divider */}
					<View
						style={{
							height: 1,
							backgroundColor: colors.borderSubtle,
							marginVertical: 14,
						}}
					/>

					{/* Evening Reflection Prompt */}
					<View className='flex-row items-center justify-between'>
						<View className='flex-1 mr-4'>
							<Text
								style={{
									fontSize: 14,
									fontFamily: 'Inter_600SemiBold',
									color: colors.textPrimary,
								}}
							>
								Evening Reflection (8:00 PM)
							</Text>
							<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
								Gentle reminder if your daily goal is unmet by sunset.
							</Text>
						</View>
						<Switch
							value={eveningReminder}
							onValueChange={setEveningReminder}
							trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
							thumbColor={eveningReminder ? '#ffffff' : colors.textMuted}
						/>
					</View>
				</Card>

				{/* Daily Devotional Verse Notifications */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between mb-1'>
						<View className='flex-1 mr-3'>
							<View className='flex-row items-center'>
								<Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
								<Text
									style={{
										fontSize: 14,
										fontFamily: 'Inter_700Bold',
										color: colors.textPrimary,
									}}
								>
									Daytime Verse Notifications
								</Text>
							</View>
							<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
								Receive inspiring verses spaced throughout your day.
							</Text>
						</View>
						<Switch
							value={verseNotifsEnabled}
							onValueChange={handleToggleVerseNotifications}
							trackColor={{ false: colors.surfaceSubtle, true: colors.accent }}
							thumbColor={verseNotifsEnabled ? '#ffffff' : colors.textMuted}
						/>
					</View>

					{/* Quiet Hours Guarantee Banner */}
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: colors.surfaceSubtle,
							padding: 10,
							borderRadius: 10,
							marginTop: 12,
							borderWidth: 1,
							borderColor: colors.borderSubtle,
						}}
					>
						<Moon size={14} color={colors.accent} style={{ marginRight: 8 }} />
						<View style={{ flex: 1 }}>
							<Text
								style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}
							>
								Daytime Delivery Only (7:00 AM – 10:00 PM)
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
								Adapts to your timezone. Night hours are 100% silent.
							</Text>
						</View>
					</View>

					{verseNotifsEnabled && (
						<View style={{ marginTop: 14 }}>
							<View className='flex-row items-center justify-between mb-3'>
								<View>
									<Text
										style={{
											fontSize: 13,
											fontFamily: 'Inter_600SemiBold',
											color: colors.textPrimary,
										}}
									>
										Verses Per Day
									</Text>
									<Text style={{ fontSize: 11, color: colors.textSecondary }}>
										{!isPremium ? '1 to 6 on Free • Up to 24 on Sanctuary' : 'Up to 24 on Sanctuary'}
									</Text>
								</View>

								{/* Stepper Controls */}
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										backgroundColor: colors.surfaceSubtle,
										borderRadius: 10,
										borderWidth: 1,
										borderColor: colors.border,
										padding: 2,
									}}
								>
									<Pressable
										onPress={() => handleUpdateVerseNotifCount(verseNotifCount - 1)}
										disabled={verseNotifCount <= 1}
										hitSlop={6}
										accessibilityRole='button'
										accessibilityLabel='Decrease notifications'
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											alignItems: 'center',
											justifyContent: 'center',
											opacity: verseNotifCount <= 1 ? 0.3 : 1,
										}}
									>
										<Minus size={15} color={colors.textPrimary} />
									</Pressable>

									<View style={{ minWidth: 36, alignItems: 'center', paddingHorizontal: 4 }}>
										<Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.accent }}>
											{verseNotifCount}
										</Text>
									</View>

									<Pressable
										onPress={() => handleUpdateVerseNotifCount(verseNotifCount + 1)}
										hitSlop={6}
										accessibilityRole='button'
										accessibilityLabel='Increase notifications'
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										{!isPremium && verseNotifCount >= 6 ? (
											<Lock size={13} color={colors.accent} />
										) : (
											<Plus size={15} color={colors.textPrimary} />
										)}
									</Pressable>
								</View>
							</View>

							{/* Quick Presets */}
							<View className='flex-row justify-between mb-3'>
								{[1, 2, 3, 6, 12, 24].map((n) => {
									const isLocked = !isPremium && n > 6;
									const isSelected = verseNotifCount === n;
									return (
										<Pressable
											key={n}
											onPress={() => handleUpdateVerseNotifCount(n)}
											accessibilityRole='button'
											accessibilityLabel={`${n} verses daily`}
											style={{
												flex: 1,
												marginHorizontal: 2,
												paddingVertical: 8,
												borderRadius: 8,
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor: isSelected ? colors.accentBg : colors.surfaceSubtle,
												borderWidth: 1,
												borderColor: isSelected ? colors.accent : colors.borderSubtle,
											}}
										>
											<View style={{ flexDirection: 'row', alignItems: 'center' }}>
												<Text
													style={{
														fontSize: 12,
														fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
														color: isSelected ? colors.accent : colors.textPrimary,
													}}
												>
													{n}x
												</Text>
												{isLocked && (
													<Lock size={9} color={colors.accent} style={{ marginLeft: 2 }} />
												)}
											</View>
										</Pressable>
									);
								})}
							</View>

							{/* Schedule Preview */}
							<View
								style={{
									backgroundColor: colors.surfaceSubtle,
									borderRadius: 10,
									padding: 10,
									borderWidth: 1,
									borderColor: colors.borderSubtle,
								}}
							>
								<Text
									style={{
										fontSize: 11,
										fontFamily: 'Inter_600SemiBold',
										color: colors.textSecondary,
										marginBottom: 4,
									}}
								>
									Today's Daytime Schedule ({translation}):
								</Text>
								<Text
									style={{
										fontSize: 12,
										color: colors.textPrimary,
										fontFamily: 'Inter_500Medium',
										lineHeight: 18,
									}}
								>
									{calculateDaytimeHours(verseNotifCount)
										.map((s) => formatSlotTime(s.hour, s.minute))
										.join(' • ')}
								</Text>
							</View>
						</View>
					)}
				</Card>

				{/* ============================================================== */}
				{/* CLUSTER 04: ACCOUNT, DATA & SUPPORT */}
				{/* ============================================================== */}
				<SectionHeader index='04' title='Account, Data & Support' />

				{/* Reader Profile & Offline Privacy */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between'>
						<View className='flex-1 mr-3'>
							<Text style={{ fontSize: 11, color: colors.textSecondary }}>Reader Profile</Text>
							<Text
								style={{
									fontSize: 16,
									fontFamily: 'Inter_700Bold',
									color: colors.textPrimary,
									marginTop: 2,
								}}
							>
								{userName}
							</Text>
							<Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
								Used in daily greetings, streak celebrations, and badges.
							</Text>
						</View>
						<Pressable
							onPress={handleOpenEditName}
							accessibilityRole='button'
							accessibilityLabel='Edit Reader Name'
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: 12,
								paddingVertical: 7,
								borderRadius: 8,
								backgroundColor: colors.accentBg,
								borderWidth: 1,
								borderColor: colors.accent,
								gap: 4,
							}}
						>
							<Pencil size={13} color={colors.accent} />
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_600SemiBold',
									color: colors.accent,
								}}
							>
								Edit
							</Text>
						</Pressable>
					</View>
				</Card>

				{/* Data Portability & Backup */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<View className='flex-row items-center justify-between mb-3'>
						<View className='flex-1 mr-3'>
							<View className='flex-row items-center'>
								<DownloadCloud size={16} color={colors.accent} style={{ marginRight: 6 }} />
								<Text
									style={{
										fontSize: 14,
										fontFamily: 'Inter_700Bold',
										color: colors.textPrimary,
									}}
								>
									Local Data Backup & Restore
								</Text>
							</View>
							<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
								Export your streaks, bookmarks, and notes to a private JSON file or restore them anytime.
							</Text>
						</View>
						<Button
							title='Backup'
							variant='outline'
							size='sm'
							onPress={() => setShowBackupModal(true)}
						/>
					</View>
				</Card>

				{/* Subscription & Purchases */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<Text
						style={{
							fontSize: 14,
							fontFamily: 'Inter_700Bold',
							color: colors.textPrimary,
							marginBottom: 10,
						}}
					>
						Subscription & Purchases
					</Text>

					{/* Restore Purchases Button */}
					<Pressable
						onPress={handleRestorePurchases}
						disabled={isRestoringPurchases}
						accessibilityRole='button'
						accessibilityLabel='Restore App Purchases'
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderBottomColor: colors.borderSubtle,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<RefreshCw size={16} color={colors.accent} />
							<Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
								Restore Purchases
							</Text>
						</View>
						{isRestoringPurchases ? (
							<ActivityIndicator size='small' color={colors.accent} />
						) : (
							<ChevronRight size={16} color={colors.textSecondary} />
						)}
					</Pressable>

					{/* Manage Subscription Button */}
					<Pressable
						onPress={handleManageSubscription}
						accessibilityRole='button'
						accessibilityLabel='Manage Subscriptions'
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: 12,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<CreditCard size={16} color={colors.accent} />
							<Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
								Manage Subscription (Store)
							</Text>
						</View>
						<ChevronRight size={16} color={colors.textSecondary} />
					</Pressable>
				</Card>

				{/* Community & Growth */}
				<Card variant='dark' style={{ padding: 16, marginBottom: 14 }}>
					<Text
						style={{
							fontSize: 14,
							fontFamily: 'Inter_700Bold',
							color: colors.textPrimary,
							marginBottom: 10,
						}}
					>
						Community & Support
					</Text>

					{/* Share App */}
					<Pressable
						onPress={handleShareApp}
						accessibilityRole='button'
						accessibilityLabel='Share Bible Unlock with Friends'
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderBottomColor: colors.borderSubtle,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<Share2 size={16} color={colors.accent} />
							<Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
								Share Bible Unlock with a Friend
							</Text>
						</View>
						<ChevronRight size={16} color={colors.textSecondary} />
					</Pressable>

					{/* Rate App */}
					<Pressable
						onPress={handleRateApp}
						accessibilityRole='button'
						accessibilityLabel='Rate Bible Unlock on Google Play'
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: 12,
							borderBottomWidth: 1,
							borderBottomColor: colors.borderSubtle,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<Star size={16} color={colors.accent} />
							<Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
								Rate on Google Play
							</Text>
						</View>
						<ChevronRight size={16} color={colors.textSecondary} />
					</Pressable>

					{/* Contact Support */}
					<Pressable
						onPress={handleContactSupport}
						accessibilityRole='button'
						accessibilityLabel='Send Feedback and Support'
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: 12,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
							<MessageSquare size={16} color={colors.accent} />
							<Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary }}>
								Help & Feature Feedback
							</Text>
						</View>
						<ChevronRight size={16} color={colors.textSecondary} />
					</Pressable>
				</Card>

				{/* Legal & App Version Info */}
				<Card variant='dark' style={{ padding: 14, marginBottom: 14 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 10 }}>
						<Pressable onPress={handleOpenPrivacy} hitSlop={10}>
							<Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter_500Medium' }}>
								Privacy Policy
							</Text>
						</Pressable>
						<Text style={{ color: colors.border }}>•</Text>
						<Pressable onPress={handleOpenTerms} hitSlop={10}>
							<Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Inter_500Medium' }}>
								Terms of Service
							</Text>
						</Pressable>
					</View>

					<View style={{ alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
						<Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textMuted }}>
							Bible Unlock v1.0.0 (Build 1) • 100% Local-First
						</Text>
					</View>
				</Card>

				{/* Developer Controls (when __DEV__) */}
				{__DEV__ && (
					<Card
						variant='dark'
						style={{
							padding: 16,
							marginBottom: 20,
							borderColor: '#ef4444',
							backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
							<ShieldAlert size={14} color='#ef4444' />
							<Text
								style={{
									fontSize: 11,
									fontFamily: 'Inter_700Bold',
									letterSpacing: 1,
									textTransform: 'uppercase',
									color: '#ef4444',
								}}
							>
								[ DEV // PROTOCOLS ]
							</Text>
						</View>
						<View style={{ flexDirection: 'row', gap: 8 }}>
							<Button
								title='Reset Reading Progress'
								variant='ghost'
								size='sm'
								onPress={handleResetProgress}
								style={{ flex: 1 }}
							/>
							<Button
								title={isPremium ? 'Simulate Free' : 'Simulate Pro'}
								variant='ghost'
								size='sm'
								onPress={handleToggleSimulatePlan}
								style={{ flex: 1 }}
							/>
						</View>
					</Card>
				)}
			</ScrollView>

			{/* ============================================================== */}
			{/* MODALS */}
			{/* ============================================================== */}

			{/* Interactive App Picker Modal */}
			<Modal
				visible={showAppPickerModal}
				animationType='slide'
				transparent={false}
				statusBarTranslucent
				onRequestClose={() => setShowAppPickerModal(false)}
			>
				<View style={{ flex: 1, backgroundColor: colors.background }}>
					<SafeAreaView
						style={{ flex: 1, backgroundColor: colors.background }}
						edges={['top', 'left', 'right']}
					>
						<View
							style={{
								flex: 1,
								paddingHorizontal: 20,
								paddingTop: 12,
								paddingBottom: Math.max(20, insets.bottom + 12),
							}}
						>
							{/* Header */}
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									paddingVertical: 12,
									borderBottomWidth: 1,
									borderBottomColor: colors.border,
									marginBottom: 12,
								}}
							>
								<View>
									<Text
										style={{
											fontSize: 22,
											fontFamily: 'EBGaramond_700Bold',
											color: colors.textPrimary,
										}}
									>
										Select Apps to Shield
									</Text>
									<Text style={{ fontSize: 12, color: colors.textSecondary }}>
										{blockedList.length} apps selected for distraction shielding
									</Text>
								</View>
								<Pressable
									onPress={() => setShowAppPickerModal(false)}
									accessibilityRole='button'
									accessibilityLabel='Close app picker'
									style={{
										width: 32,
										height: 32,
										borderRadius: 16,
										backgroundColor: colors.surfaceSubtle,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<X size={16} color={colors.textPrimary} />
								</Pressable>
							</View>

							{/* Search Bar */}
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingHorizontal: 14,
									paddingVertical: 10,
									borderRadius: 12,
									backgroundColor: colors.surface,
									borderWidth: 1,
									borderColor: colors.border,
									marginBottom: 12,
								}}
							>
								<Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
								<TextInput
									value={appSearchQuery}
									onChangeText={setAppSearchQuery}
									placeholder='Search installed applications...'
									placeholderTextColor={colors.textMuted}
									style={{
										flex: 1,
										color: colors.textPrimary,
										fontSize: 14,
										padding: 0,
									}}
								/>
							</View>

							{loadingApps ? (
								<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
									<ActivityIndicator color={colors.accent} size='large' />
									<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12 }}>
										Scanning device applications...
									</Text>
								</View>
							) : (
								<ScrollView style={{ flex: 1, marginBottom: 12 }} showsVerticalScrollIndicator={false}>
									{installedApps
										.filter(
											(a) =>
												a.label.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
												a.packageName.toLowerCase().includes(appSearchQuery.toLowerCase()),
										)
										.map((app) => {
											const isSelected = blockedList.includes(app.packageName);
											return (
												<Pressable
													key={app.packageName}
													onPress={() => handleToggleApp(app.packageName)}
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														justifyContent: 'space-between',
														padding: 14,
														borderRadius: 12,
														marginBottom: 8,
														borderWidth: 1,
														borderColor: isSelected ? colors.accent : colors.border,
														backgroundColor: isSelected ? colors.accentBg : colors.surface,
													}}
												>
													<View
														style={{
															flexDirection: 'row',
															alignItems: 'center',
															flex: 1,
															marginRight: 12,
														}}
													>
														<View style={{ marginRight: 12 }}>
															<AppIcon
																packageName={app.packageName}
																label={app.label}
																iconUri={app.icon}
																size={40}
																borderRadius={10}
															/>
														</View>
														<View style={{ flex: 1 }}>
															<Text
																numberOfLines={1}
																style={{
																	fontSize: 14,
																	fontFamily: 'Inter_600SemiBold',
																	color: colors.textPrimary,
																}}
															>
																{app.label}
															</Text>
															<Text
																numberOfLines={1}
																style={{
																	fontSize: 11,
																	color: colors.textSecondary,
																	marginTop: 2,
																}}
															>
																{app.packageName}
															</Text>
														</View>
													</View>

													<View
														style={{
															width: 24,
															height: 24,
															borderRadius: 6,
															borderWidth: 1,
															borderColor: isSelected ? colors.accent : colors.border,
															backgroundColor: isSelected ? colors.accent : 'transparent',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													>
														{isSelected && (
															<Check size={14} color='#141413' strokeWidth={3} />
														)}
													</View>
												</Pressable>
											);
										})}
								</ScrollView>
							)}

							{/* Bottom Done Action Button */}
							<Pressable
								onPress={() => setShowAppPickerModal(false)}
								style={{
									width: '100%',
									paddingVertical: 14,
									borderRadius: 16,
									backgroundColor: colors.accent,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#141413' }}>
									Done ({blockedList.length} Apps Shielded)
								</Text>
							</Pressable>
						</View>
					</SafeAreaView>
				</View>
			</Modal>

			{/* Reusable Time Picker Modal for Reminders */}
			<TimePickerModal
				visible={showTimePickerModal}
				onClose={() => setShowTimePickerModal(false)}
				onSave={handleAddReminderTime}
				title='Add Reminder Time'
			/>

			{/* Bible Translation & Download Modal */}
			<BibleTranslationModal visible={showTranslationModal} onClose={() => setShowTranslationModal(false)} />

			{/* Android Battery Optimization Guide Modal */}
			<BatteryOptimizationModal
				visible={showBatteryModal}
				onClose={() => setShowBatteryModal(false)}
			/>

			{/* Local Data Backup & Restore Modal */}
			<DataBackupModal
				visible={showBackupModal}
				onClose={() => setShowBackupModal(false)}
				onRestoreSuccess={() => {
					setUserNameState(getUserName());
					setDailyGoal(getDailyGoalMinutes());
					setBlockedListState(getBlockedApps());
					setScheduledTimes(getScheduledReadingTimes());
				}}
			/>

			{/* Edit Reader Name Modal */}
			<Modal
				visible={showEditNameModal}
				transparent
				animationType='fade'
				onShow={() => {
					setTimeout(() => {
						nameInputRef.current?.focus();
					}, 100);
				}}
				onRequestClose={() => setShowEditNameModal(false)}
			>
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
					<Pressable
						onPress={Keyboard.dismiss}
						style={{
							flex: 1,
							backgroundColor: 'rgba(0, 0, 0, 0.75)',
						}}
					>
						<ScrollView
							style={{ flex: 1, width: '100%' }}
							contentContainerStyle={{
								flexGrow: 1,
								justifyContent: 'flex-end',
								alignItems: 'center',
								paddingHorizontal: 16,
								paddingBottom: 32,
							}}
							bounces={false}
							keyboardShouldPersistTaps='handled'
						>
							<Pressable
								onPress={(e) => e.stopPropagation()}
								style={{
									width: '100%',
									maxWidth: 360,
									backgroundColor: colors.surface,
									borderColor: colors.borderSubtle,
									borderWidth: 1,
									borderRadius: 20,
									padding: 20,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 8 },
									shadowOpacity: 0.35,
									shadowRadius: 16,
									elevation: 8,
								}}
							>
								{/* Header */}
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: 16,
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<View
											style={{
												width: 32,
												height: 32,
												borderRadius: 16,
												backgroundColor: isDark ? '#142a20' : '#e2f0e8',
												alignItems: 'center',
												justifyContent: 'center',
												marginRight: 10,
											}}
										>
											<User size={16} color={colors.accent} />
										</View>
										<Text
											style={{
												fontSize: 17,
												fontFamily: 'Inter_600SemiBold',
												color: colors.textPrimary,
											}}
										>
											Reader Name
										</Text>
									</View>
									<Pressable
										onPress={() => setShowEditNameModal(false)}
										hitSlop={12}
										accessibilityRole='button'
										accessibilityLabel='Close'
										style={{
											width: 30,
											height: 30,
											borderRadius: 15,
											alignItems: 'center',
											justifyContent: 'center',
											backgroundColor: colors.borderSubtle,
										}}
									>
										<X size={15} color={colors.textSecondary} />
									</Pressable>
								</View>

								<Text
									style={{
										fontSize: 13,
										fontFamily: 'Inter_400Regular',
										color: colors.textSecondary,
										marginBottom: 16,
										lineHeight: 18,
									}}
								>
									This name appears in your daily Scripture greetings, streak milestones, and shared
									badges.
								</Text>

								{/* Input */}
								<TextInput
									ref={nameInputRef}
									value={editNameText}
									onChangeText={setEditNameText}
									maxLength={30}
									placeholder='e.g. John or Disciple'
									placeholderTextColor={colors.textSecondary}
									selectTextOnFocus
									selectionColor={colors.accent}
									returnKeyType='done'
									onSubmitEditing={handleSaveName}
									onFocus={() => setIsNameInputFocused(true)}
									onBlur={() => setIsNameInputFocused(false)}
									style={{
										width: '100%',
										paddingHorizontal: 16,
										paddingVertical: 12,
										borderRadius: 12,
										backgroundColor: colors.background,
										borderWidth: 1.5,
										borderColor: isNameInputFocused ? colors.accent : colors.borderSubtle,
										fontSize: 15,
										fontFamily: 'Inter_500Medium',
										color: colors.textPrimary,
										marginBottom: 6,
									}}
								/>

								<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
									<Text style={{ fontSize: 11, color: colors.textSecondary }}>
										{editNameText.length}/30
									</Text>
								</View>

								{/* Actions */}
								<View style={{ flexDirection: 'row', gap: 8 }}>
									<Button
										title='Cancel'
										variant='ghost'
										size='md'
										onPress={() => setShowEditNameModal(false)}
										style={{ flex: 1 }}
									/>
									<Button
										title='Save Name'
										variant='primary'
										size='md'
										onPress={handleSaveName}
										style={{ flex: 1 }}
									/>
								</View>
							</Pressable>
						</ScrollView>
					</Pressable>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}
