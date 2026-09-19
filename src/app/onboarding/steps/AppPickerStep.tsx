import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, AlertTriangle, Check, Search, ShieldAlert, Sparkles } from 'lucide-react-native';
import { AppBlocker } from '../../../lib/appBlocker';
import { usePurchases } from '../../../lib/purchases';
import { AppIcon } from '../../../components/AppIcon';

interface AppPickerStepProps {
	blockedApps: string[];
	setBlockedApps: (apps: string[]) => void;
	onBack: () => void;
	onNext: () => void;
}

interface AppItem {
	packageName: string;
	label: string;
	isSystemApp?: boolean;
	icon?: string;
}

const COMMON_DISTRACTIONS = [
	{ label: 'Instagram', packageName: 'com.instagram.android' },
	{ label: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
	{ label: 'YouTube', packageName: 'com.google.android.youtube' },
	{ label: 'X / Twitter', packageName: 'com.twitter.android' },
	{ label: 'Reddit', packageName: 'com.reddit.frontpage' },
];

export const AppPickerStep: React.FC<AppPickerStepProps> = ({ blockedApps, setBlockedApps, onBack, onNext }) => {
	const insets = useSafeAreaInsets();
	const { isPremium } = usePurchases();
	const [showModal, setShowModal] = useState(false);
	const [installedApps, setInstalledApps] = useState<AppItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [tempSelected, setTempSelected] = useState<string[]>(blockedApps);

	useEffect(() => {
		AppBlocker.getInstalledApps().then((apps) => {
			setInstalledApps(apps);
			if (apps && apps.length > 0) {
				const installedDefaults = blockedApps.filter((pkg) => apps.some((a) => a.packageName === pkg));
				if (installedDefaults.length > 0 && installedDefaults.length < blockedApps.length) {
					setBlockedApps(installedDefaults);
					setTempSelected(installedDefaults);
				}
			}
		});
	}, []);

	const openPicker = async () => {
		setTempSelected(blockedApps);
		setShowModal(true);
		setLoading(true);
		const apps = await AppBlocker.getInstalledApps();
		setInstalledApps(apps);
		setLoading(false);
	};

	const toggleApp = (pkg: string) => {
		if (tempSelected.includes(pkg)) {
			setTempSelected(tempSelected.filter((p) => p !== pkg));
		} else {
			if (!isPremium && tempSelected.length >= 5) {
				Alert.alert(
					'5 App Limit (Covenant Plan)',
					'The Covenant plan includes up to 5 shielded apps. Deselect an app first or enter the Sanctuary for unlimited shields.',
				);
				return;
			}
			setTempSelected([...tempSelected, pkg]);
		}
	};

	const handleSave = () => {
		const finalSelected = !isPremium && tempSelected.length > 5 ? tempSelected.slice(0, 5) : tempSelected;
		setBlockedApps(finalSelected);
		setShowModal(false);
	};

	const toggleQuickApp = (pkg: string) => {
		if (blockedApps.includes(pkg)) {
			setBlockedApps(blockedApps.filter((p) => p !== pkg));
		} else {
			if (!isPremium && blockedApps.length >= 5) {
				Alert.alert(
					'5 App Limit (Covenant Plan)',
					'The Covenant plan includes up to 5 shielded apps. Deselect an app first or enter the Sanctuary for unlimited shields.',
				);
				return;
			}
			setBlockedApps([...blockedApps, pkg]);
		}
	};

	const filteredApps = installedApps.filter(
		(app) =>
			app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<View
			className='flex-1 justify-between px-6 py-4 bg-[#0d2e24]'
			style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
			>
				{/* Top 5-segment Progress Bar */}
				<View className='flex-row space-x-1.5 pt-4 mb-4'>
					{[1, 2, 3, 4, 5].map((idx) => (
						<View
							key={idx}
							className={`flex-1 h-1 rounded-full mr-1.5 ${idx <= 3 ? 'bg-[#f5b800]' : 'bg-[#1b4a3c]'}`}
						/>
					))}
				</View>

				<Text className='text-xs font-sans-bold text-[#f5b800] mb-3'>3 of 5</Text>

				<Text
					className='text-[32px] font-serif-bold text-[#faf9f5] mb-2 tracking-tight leading-[40px]'
					style={{ fontFamily: 'EBGaramond_700Bold' }}
				>
					Guard your heart from the noise that steals your peace
				</Text>

				<Text className='text-base font-sans text-[#78a898] mb-4 leading-relaxed'>
					Select the apps that tempt you to scroll instead of seek Him. They will stay quietly paused each day
					until your soul is nourished in the Bible.
				</Text>

				{/* Guarded Apps Status Card (Disabled for Free plan in Onboarding) */}
				<Pressable
					disabled={!isPremium}
					onPress={isPremium ? openPicker : undefined}
					className={`p-5 rounded-3xl items-center justify-center mb-5 border ${
						blockedApps.length > 0 ? 'border-[#f5b800] bg-[#143e32]' : 'border-[#265e4d] bg-[#12382d]'
					} ${isPremium ? 'active:opacity-90' : ''}`}
				>
					<View className='w-12 h-12 rounded-lg bg-[#1d5242] items-center justify-center mb-1'>
						<Lock size={28} color='#f5b800' strokeWidth={2} />
					</View>
					<Text className='text-xl font-sans-bold text-[#faf9f5] mb-1'>
						{blockedApps.length > 0
							? `${blockedApps.length} ${blockedApps.length === 1 ? 'app' : 'apps'} shielded`
							: 'No Apps Selected'}
					</Text>
					<Text className='text-xs font-sans text-[#78a898]'>
						{isPremium
							? 'Tap to adjust your selected apps'
							: blockedApps.length > 0
								? 'Silenced until you spend your daily time with Jesus'
								: 'Select distractions from the options below'}
					</Text>
				</Pressable>

				{/* Quick Suggestion Chips */}
				<View className='mb-3'>
					<Text className='text-xs font-sans-bold text-[#78a898] mb-2.5'>
						Common Distractions to Silence:
					</Text>
					<View className='flex-row flex-wrap'>
						{COMMON_DISTRACTIONS.map((c) => {
							const isSelected = blockedApps.includes(c.packageName);
							const isInstalled =
								installedApps.length === 0 ||
								installedApps.some((a) => a.packageName === c.packageName);
							return (
								<Pressable
									key={c.packageName}
									onPress={() => toggleQuickApp(c.packageName)}
									className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
										isSelected
											? 'border-[#f5b800] bg-[#1d4c3d]'
											: isInstalled
												? 'border-[#205243] bg-[#143e32]'
												: 'border-[#1b3d32] bg-[#0f2e25]'
									}`}
									style={{ opacity: isInstalled || isSelected ? 1 : 0.6 }}
								>
									<View style={{ marginRight: 6 }}>
										<AppIcon
											packageName={c.packageName}
											label={c.label}
											size={16}
											borderRadius={4}
										/>
									</View>
									<View>
										<Text
											className={`text-xs font-sans-bold ${
												isSelected
													? 'text-[#f5b800]'
													: isInstalled
														? 'text-[#faf9f5]'
														: 'text-[#8fa89f]'
											}`}
										>
											{c.label}
										</Text>
										{!isInstalled && (
											<Text
												style={{ fontSize: 9, color: '#729489', fontFamily: 'Inter_500Medium' }}
											>
												Not installed
											</Text>
										)}
									</View>
									{isSelected && <Check size={14} color='#f5b800' style={{ marginLeft: 6 }} />}
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Selected Apps Confirmation Badge */}
				{blockedApps.length > 0 && (
					<View className='p-4 rounded-2xl bg-[#134032] border border-[#2b725c] flex-row items-center mb-5'>
						<Check size={18} color='#5db872' style={{ marginRight: 10 }} />
						<Text className='text-xs font-sans text-[#aee2d1] flex-1 leading-relaxed'>
							These apps will stay quietly paused each day until your heart is filled with God's Word in
							the Bible.
						</Text>
					</View>
				)}

				{/* Instructions Card */}
				<View className='p-4 rounded-2xl bg-[#143e32] border border-[#205243] mb-6'>
					<View className='flex-row items-center mb-2'>
						<Sparkles size={16} color='#f5b800' style={{ marginRight: 8 }} />
						<Text className='text-xs font-sans-bold text-[#f5b800]'>How Bible Shield Works:</Text>
					</View>
					<Text className='text-xs font-sans text-[#c8ded6] leading-relaxed mb-1.5'>
						• Whenever you tap a shielded app during your scheduled time, Bible Unlock gently opens to the
						Bible instead.
					</Text>
					<Text className='text-xs font-sans text-[#c8ded6] leading-relaxed'>
						• Once you complete your quiet time with Jesus, all apps unlock freely for the rest of your day.
					</Text>
				</View>
			</ScrollView>

			{/* Bottom Navigation */}
			<View className='flex-row space-x-3 pt-2'>
				<Pressable
					onPress={onBack}
					className='flex-1 py-4.5 mr-2 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80'
				>
					<Text className='text-lg font-sans-bold text-[#78a898]'>Back</Text>
				</Pressable>

				<Pressable
					onPress={onNext}
					className='flex-1 py-4.5 ml-2 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg'
				>
					<Text className='text-lg font-sans-bold text-[#141413]'>Next</Text>
				</Pressable>
			</View>

			{/* Fullscreen Selection Modal (Safe Area Aware) */}
			<Modal visible={showModal} animationType='slide'>
				<View
					className='flex-1 bg-[#12161f] px-5'
					style={{
						paddingTop: Math.max(24, insets.top + 16),
						paddingBottom: Math.max(20, insets.bottom + 12),
					}}
				>
					<Text
						className='text-2xl font-serif-bold text-[#faf9f5] mb-1 tracking-tight'
						style={{ fontFamily: 'EBGaramond_700Bold' }}
					>
						Choose Apps to Shield
					</Text>
					<Text className='text-xs font-sans text-[#a09d96] mb-4'>
						{isPremium
							? 'Select apps to pause until your quiet time with Jesus is complete'
							: 'Choose up to 5 apps on the Covenant plan (Unlimited in Sanctuary)'}
					</Text>

					{/* Search bar */}
					<View className='flex-row items-center px-4 py-3 rounded-xl bg-[#1e232d] border border-[#303642] mb-4'>
						<Search size={18} color='#6c6a64' style={{ marginRight: 10 }} />
						<TextInput
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholder='Search installed apps...'
							placeholderTextColor='#6c6a64'
							className='flex-1 text-[#faf9f5] font-sans text-sm p-0'
						/>
					</View>

					{loading ? (
						<View className='flex-1 items-center justify-center'>
							<ActivityIndicator color='#f5b800' size='large' />
							<Text className='text-xs font-sans text-[#a09d96] mt-3'>Scanning installed apps...</Text>
						</View>
					) : (
						<ScrollView className='flex-1 mb-4' showsVerticalScrollIndicator={false}>
							{filteredApps.map((app) => {
								const isSelected = tempSelected.includes(app.packageName);
								return (
									<Pressable
										key={app.packageName}
										onPress={() => toggleApp(app.packageName)}
										className={`flex-row items-center justify-between p-3.5 rounded-xl mb-2 border ${
											isSelected
												? 'border-[#f5b800] bg-[#242b1e]'
												: 'border-[#212631] bg-[#161a23]'
										}`}
									>
										<View className='flex-row items-center flex-1 mr-3'>
											<View style={{ marginRight: 12 }}>
												<AppIcon
													packageName={app.packageName}
													label={app.label}
													iconUri={app.icon}
													size={40}
													borderRadius={10}
												/>
											</View>
											<View className='flex-1'>
												<Text
													className='text-sm font-sans-bold text-[#faf9f5]'
													numberOfLines={1}
												>
													{app.label}
												</Text>
												<Text
													className='text-[11px] font-sans text-[#8e8b82]'
													numberOfLines={1}
												>
													{app.packageName}
												</Text>
											</View>
										</View>

										<View
											className={`w-6 h-6 rounded-md border items-center justify-center ${
												isSelected ? 'border-[#f5b800] bg-[#f5b800]' : 'border-[#4a5263]'
											}`}
										>
											{isSelected && <Check size={14} color='#141413' strokeWidth={3} />}
										</View>
									</Pressable>
								);
							})}
						</ScrollView>
					)}

					{/* Modal bottom actions (Cleared above Android Navigation Bar) */}
					<View className='flex-row space-x-3 pt-3 border-t border-[#262c38]'>
						<Pressable
							onPress={() => setShowModal(false)}
							className='flex-1 py-3.5 mr-2 rounded-xl bg-[#212631] items-center justify-center'
						>
							<Text className='text-sm font-sans-bold text-[#a09d96]'>Cancel</Text>
						</Pressable>

						<Pressable
							onPress={handleSave}
							className='flex-1 py-3.5 ml-2 rounded-xl bg-[#f5b800] items-center justify-center shadow-md'
						>
							<Text className='text-sm font-sans-bold text-[#141413]'>
								Save & Continue ({tempSelected.length}
								{!isPremium ? '/5' : ''})
							</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</View>
	);
};
